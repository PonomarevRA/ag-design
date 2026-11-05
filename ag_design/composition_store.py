"""Durable composition transactions over the service's existing single-writer SQLite owner."""
from copy import deepcopy
import hashlib
import json
import re
import secrets
import uuid

from .composition_model import normalize_document, document_hash, apply_operations
from .composition_evaluation import evaluate_composition
from .composition_metrics import normalize_facts
from .design_policy import authoring_brief
from .errors import DesignError

SCHEMA = '''
CREATE TABLE IF NOT EXISTS compositions(id TEXT PRIMARY KEY,revision INTEGER NOT NULL,payload TEXT NOT NULL,policy TEXT NOT NULL,receipt TEXT NOT NULL,baseline TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS composition_changes(sequence INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,document_id TEXT NOT NULL,revision INTEGER NOT NULL,author TEXT NOT NULL,key TEXT NOT NULL,fingerprint TEXT NOT NULL,before_doc TEXT NOT NULL,response TEXT NOT NULL,undoable INTEGER NOT NULL DEFAULT 1,undone INTEGER NOT NULL DEFAULT 0,UNIQUE(document_id,key));
CREATE TABLE IF NOT EXISTS composition_reports(id TEXT PRIMARY KEY,document_id TEXT NOT NULL,revision INTEGER NOT NULL,payload TEXT NOT NULL);
'''


def encoded(value, maximum=524288):
    """Use finite canonical UTF-8 JSON for identity, durable storage and byte budgets."""
    try:
        result = json.dumps(value,sort_keys=True,separators=(',', ':'),ensure_ascii=False,allow_nan=False)
        size=len(result.encode('utf-8'))
    except (ValueError,TypeError,UnicodeError,RecursionError) as error:
        raise DesignError('invalid_composition','Composition data must be finite JSON') from error
    if size > maximum:
        raise DesignError('too_large','Composition data exceeds its byte budget',413)
    return result


def identity(value, label='identity'):
    """Accept opaque bounded identities, never paths, SQL fragments or executable input."""
    if not isinstance(value,str) or not re.fullmatch(r'[A-Za-z0-9:_-]{1,120}',value):
        raise DesignError('invalid_composition',f'Invalid {label}')
    return value


class CompositionStore:
    """Commit CAS, author history and idempotency together; evidence is explicitly caller reported."""
    def __init__(self, owner, catalog):
        """Install additive tables only after the existing data owner has acquired its process lock."""
        self.owner,self.catalog=owner,catalog
        with owner.lock:
            owner.connection.executescript(SCHEMA)
            columns={row[1] for row in owner.connection.execute('PRAGMA table_info(composition_changes)')}
            for name in ('undoable','undone'):
                if name not in columns:
                    default=1 if name=='undoable' else 0
                    owner.connection.execute(f'ALTER TABLE composition_changes ADD COLUMN {name} INTEGER NOT NULL DEFAULT {default}')

    def _row(self, connection, document_id):
        """Resolve one exact document; no fallback to the current editor or another tab."""
        identity(document_id,'documentId')
        row=connection.execute('SELECT * FROM compositions WHERE id=?',(document_id,)).fetchone()
        if row is None:
            raise DesignError('composition_not_found','Composition was not found',404)
        return row

    def _envelope(self, row):
        """Expose the current revision and context receipt without implying a render has happened."""
        document=json.loads(row['payload'])
        return {'documentId':row['id'],'revision':row['revision'],'document':document,
                'documentHash':document_hash(document),'policyHash':row['policy'],'contextReceipt':row['receipt']}

    def _pins(self, document):
        """Pin actual catalog definitions; supplied mismatches fail instead of silently upgrading packages."""
        result=deepcopy(document)
        pins=result.setdefault('componentPins',{})
        for node in result['nodes']:
            if node['kind']!='component':
                continue
            component=self.catalog.get(node['component'])
            artifact=component.get('artifactHash') or hashlib.sha256(encoded(component).encode()).hexdigest()
            expected={'version':component['version'],'artifactHash':artifact}
            if node['component'] in pins and pins[node['component']] != expected:
                raise DesignError('composition_pin_mismatch','Component artifact changed; prepare a new composition',409)
            pins[node['component']]=expected
        return result

    def _context(self, row, receipt):
        """Require the prepared context and current bundled policy before mutations or evaluation."""
        if not isinstance(receipt,str) or not secrets.compare_digest(receipt,row['receipt']):
            raise DesignError('composition_context_required','Read the prepared composition context first',409)
        if authoring_brief()['policyHash'] != row['policy']:
            raise DesignError('composition_policy_mismatch','Policy changed; prepare a new composition',409)

    def prepare(self, raw, author_id):
        """Validate a new immutable baseline and return applicable rules plus exact component pins."""
        identity(author_id,'authorId')
        document=self._pins(normalize_document(raw,known_components=set(self.catalog.by_id)))
        brief=authoring_brief()
        baseline={'constraints':[c for c in document['constraints'] if c['required']],
                  'scenarios':document['scenarios'],'componentPins':document['componentPins'],
                  'overlayDeclarations':{n['id']:n['intentionalOverlay'] for n in document['nodes']},
                  'requiredNodes':{n['id']:{'kind':n['kind'],'component':n['component'],'intentionalOverlay':n['intentionalOverlay']} for n in document['nodes']
                      if any(c['required'] and n['id'] in c['nodeIds'] for c in document['constraints'])}}
        with self.owner.transaction() as connection:
            if connection.execute('SELECT count(*) FROM compositions').fetchone()[0]>=1000:
                raise DesignError('composition_capacity','Composition capacity reached',409)
            key=uuid.uuid4().hex
            connection.execute('INSERT INTO compositions VALUES(?,?,?,?,?,?)',
                (key,1,encoded(document),brief['policyHash'],secrets.token_hex(24),encoded(baseline)))
            result=self._envelope(self._row(connection,key))
        return {**result,'brief':brief,'capabilities':{'read':True,'write':True,'measure':True,'qualification':'caller-evidence-only'},
                'workflow':['inspect','patch','render','checks','report','compare','qualification']}

    def inspect(self, document_id):
        """Read one bounded document and its current revision; responses never concatenate all documents."""
        with self.owner.lock:
            return self._envelope(self._row(self.owner.connection,document_id))

    def _baseline(self, row, candidate):
        """Prevent score gaming by removing mandatory checks, component pins or required scenarios."""
        baseline=json.loads(row['baseline'])
        required=[c for c in candidate['constraints'] if c['required']]
        if required!=baseline['constraints'] or candidate['scenarios']!=baseline['scenarios']:
            raise DesignError('composition_baseline_protected','Required constraints and scenario matrix are protected',409)
        nodes={n['id']:n for n in candidate['nodes']}
        for key,expected in baseline.get('overlayDeclarations',{}).items():
            if key in nodes and nodes[key]['intentionalOverlay']!=expected:
                raise DesignError('composition_baseline_protected','Overlay exemptions belong to the prepared baseline',409)
        for key,expected in baseline.get('requiredNodes',{}).items():
            actual=nodes.get(key,{})
            if actual.get('kind')!=expected['kind'] or actual.get('component')!=expected['component'] or actual.get('intentionalOverlay')!=expected.get('intentionalOverlay',False):
                raise DesignError('composition_baseline_protected','Required node identities and component kinds are protected',409)
        for key,pin in baseline['componentPins'].items():
            if candidate['componentPins'].get(key)!=pin:
                raise DesignError('composition_baseline_protected','Original component pins are protected',409)

    def mutate(self, document_id, expected_revision, key, author_id, receipt, operations=None, *, undo=False):
        """Apply one all-or-none command; exact retries return the original acknowledgement after any timeout."""
        identity(key,'idempotencyKey');identity(author_id,'authorId')
        if type(expected_revision) is not int or expected_revision<1:
            raise DesignError('invalid_composition','expectedRevision must be a positive integer')
        fingerprint=hashlib.sha256(encoded({'revision':expected_revision,'author':author_id,'operations':operations,'undo':undo}).encode()).hexdigest()
        with self.owner.transaction() as connection:
            row=self._row(connection,document_id)
            self._context(row,receipt)
            previous=connection.execute('SELECT * FROM composition_changes WHERE document_id=? AND key=?',(document_id,key)).fetchone()
            if previous:
                if previous['fingerprint']!=fingerprint:
                    raise DesignError('composition_idempotency_conflict','This operation key belongs to a different command',409)
                return json.loads(previous['response'])
            if row['revision']!=expected_revision:
                raise DesignError('composition_revision_conflict','Revision changed; inspect before preparing another patch',409)
            self._pins(json.loads(row['payload']))
            if undo:
                latest=connection.execute('SELECT * FROM composition_changes WHERE document_id=? ORDER BY sequence DESC LIMIT 1',(document_id,)).fetchone()
                if latest is None or latest['author']!=author_id:
                    raise DesignError('composition_undo_conflict','Only the author of the latest change may undo it',409)
                candidate=connection.execute('SELECT * FROM composition_changes WHERE document_id=? AND undoable=1 AND undone=0 ORDER BY sequence DESC LIMIT 1',(document_id,)).fetchone()
                if candidate is None or candidate['author']!=author_id:
                    raise DesignError('composition_undo_conflict','No previous own command can be undone without crossing another author',409)
                document=json.loads(candidate['before_doc'])
                connection.execute('UPDATE composition_changes SET undone=1 WHERE id=?',(candidate['id'],))
            else:
                document=apply_operations(json.loads(row['payload']),operations,known_components=set(self.catalog.by_id))
            document=self._pins(document)
            self._baseline(row,document)
            if connection.execute('SELECT count(*) FROM composition_changes').fetchone()[0]>=10000:
                raise DesignError('composition_capacity','Composition history capacity reached',409)
            change_id=uuid.uuid4().hex
            revision=row['revision']+1
            connection.execute('UPDATE compositions SET revision=?,payload=? WHERE id=?',(revision,encoded(document),document_id))
            result={**self._envelope(self._row(connection,document_id)),'committed':True,'newRevision':revision,
                    'changeId':change_id,'renderState':'pending','checkState':'stale'}
            connection.execute('INSERT INTO composition_changes(id,document_id,revision,author,key,fingerprint,before_doc,response,undoable) VALUES(?,?,?,?,?,?,?,?,?)',
                (change_id,document_id,revision,author_id,key,fingerprint,row['payload'],encoded(result),0 if undo else 1))
            return result

    def checks(self, document_id, expected_revision, receipt, facts):
        """Evaluate actual supplied DOM facts under the current policy; callers cannot submit pass flags."""
        with self.owner.transaction() as connection:
            row=self._row(connection,document_id)
            self._context(row,receipt)
            if type(expected_revision) is not int or row['revision']!=expected_revision:
                raise DesignError('composition_revision_conflict','Measure the current revision',409)
            document=json.loads(row['payload'])
            self._pins(document)
            report=evaluate_composition(document,facts)
            report.update(requirementsPolicyHash=row['policy'],trust='caller-reported',qualification=False)
            report_id=uuid.uuid4().hex
            result={'reportId':report_id,'documentId':document_id,'revision':row['revision'],'report':report,
                    'evidence':{'document':document,'facts':normalize_facts(document,facts)}}
            if connection.execute('SELECT count(*) FROM composition_reports').fetchone()[0]>=1000:
                raise DesignError('composition_capacity','Composition report capacity reached',409)
            connection.execute('INSERT INTO composition_reports VALUES(?,?,?,?)',(report_id,document_id,row['revision'],encoded(result,2_000_000)))
            return result

    def report(self, report_id):
        """Read immutable evidence by ID, including the exact evaluated document revision."""
        identity(report_id,'reportId')
        with self.owner.lock:
            row=self.owner.connection.execute('SELECT payload FROM composition_reports WHERE id=?',(report_id,)).fetchone()
            if row is None:
                raise DesignError('composition_not_found','Composition report was not found',404)
            return json.loads(row['payload'])

    def compare(self, before_id, after_id):
        """Compare compatible evidence and preserve unknowns rather than calling missing findings improvements."""
        before,after=self.report(before_id),self.report(after_id)
        a,b=before['report'],after['report']
        compatible=before['documentId']==after['documentId']
        for field in ('policyHash','requirementsPolicyHash','methodVersion'):
            compatible=compatible and a.get(field)==b.get(field)
        # A score comparison across different environments or scenario coverage has no reproducible meaning.
        for field in ('environment','scenarioId','scenarioHash'):
            compatible=compatible and a.get(field)==b.get(field)
        if not compatible:
            raise DesignError('composition_comparison_mismatch','Reports have incompatible document, policy or environment',409)
        old={c['id']:c for c in a['checks']};new={c['id']:c for c in b['checks']}
        regressed=[];resolved=[];unknown=[]
        for key in sorted(set(old)|set(new)):
            first,last=old.get(key,{}).get('status'),new.get(key,{}).get('status')
            if last in (None,'unknown'):
                unknown.append(key)
            elif last=='fail' and first!='fail':
                regressed.append(key)
            elif first=='fail' and last=='pass':
                resolved.append(key)
        return {'beforeId':before_id,'afterId':after_id,'regressions':regressed,'resolved':resolved,'unknown':unknown,
                'status':'regression' if regressed else ('unknown' if unknown else 'no-regression')}

    def qualification(self, report_id):
        """Return an artifact-bound admission decision; caller facts cannot attest host integration or AT checks."""
        result=self.report(report_id)
        current=self.inspect(result['documentId'])
        report=result['report']
        stale=current['revision']!=result['revision'] or current['documentHash']!=report['documentHash']
        reasons=['host-integration-required','keyboard-and-AT-scenarios-required','trusted-runner-attestation-required']
        if report.get('requirementsPolicyHash')!=authoring_brief()['policyHash']:
            stale=True
            reasons.append('stale-policy')
        try:
            self._pins(current['document'])
        except DesignError:
            stale=True
            reasons.append('stale-component-artifact')
        if stale:
            reasons.append('stale-document')
        if report['gate']['status']!='pass':
            reasons.append('geometry-'+report['gate']['status'])
        return {'reportId':report_id,'documentId':result['documentId'],'revision':result['revision'],
                'documentHash':report['documentHash'],'policyHash':report['policyHash'],'requirementsPolicyHash':report.get('requirementsPolicyHash'),'factsHash':report['factsHash'],
                'status':'blocked' if stale or report['gate']['status']=='fail' else 'unknown',
                'ready':False,'reasons':reasons,'geometryGate':report['gate'],'trust':'caller-reported'}
