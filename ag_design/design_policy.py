"""Bundled design requirements and contextual authoring choices, independent of caller-edited prose."""

from copy import deepcopy
from functools import lru_cache
import hashlib
import json

from .config import resource_root
from .errors import DesignError
from .validation import identifier

VARIANTS = {
    'button': [
        {'id': 'labelled', 'when': 'Основное или неоднозначное действие', 'implementation': 'createButton({label, iconOnly:false})'},
        {'id': 'icon-only', 'when': 'Узнаваемое локальное действие с доступным именем', 'implementation': 'createButton({label, icon, iconOnly:true})'},
        {'id': 'touch', 'when': 'Крупная зона указателя', 'implementation': 'createButton({label, density:"touch"})'},
    ],
    'field': [
        {'id': 'compact', 'when': 'Плотная CRM с постоянной подписью', 'implementation': 'createField({id,label,density:"compact"})'},
        {'id': 'touch', 'when': 'Сенсорный ввод', 'implementation': 'createField({id,label,density:"touch"})'},
        {'id': 'read-only', 'when': 'Значение видно и доступно для копирования', 'implementation': 'createField({id,label,readOnly:true})'},
        {'id': 'error', 'when': 'Исправление ввода с текстовой причиной', 'implementation': 'createField({id,label,error:"Укажите корректное значение"})'},
    ],
}


@lru_cache(maxsize=1)
def _policy():
    """Load one fixed, bounded package policy; requests never choose a file or run its contents."""
    path = resource_root() / 'catalog' / 'design-requirements.json'
    if path.is_symlink() or not path.is_file() or path.stat().st_size > 524288:
        raise DesignError('invalid_policy', 'Bundled requirements policy is unavailable', 503)
    raw = path.read_bytes()
    value = json.loads(raw)
    if value.get('schemaVersion') != 'ag-design/requirements-v1':
        raise DesignError('invalid_policy', 'Unsupported requirements schema', 503)
    rules = value.get('rules')
    if not isinstance(rules, list) or not 1 <= len(rules) <= 128:
        raise DesignError('invalid_policy', 'Invalid requirements inventory', 503)
    seen = set()
    for rule in rules:
        key = identifier(rule.get('id'), 'ruleId')
        if key in seen or type(rule.get('mandatory')) is not bool:
            raise DesignError('invalid_policy', 'Invalid or repeated requirement', 503)
        seen.add(key)
    return {**value, 'policyHash': hashlib.sha256(raw).hexdigest()}


def requirements(component=None):
    """Return independent policy data, optionally limited to the actual catalog component's applicability."""
    value = deepcopy(_policy())
    if component is not None:
        known = set()
        for rule in value['rules']:
            known.update(rule['componentIds'])
        applicable = []
        for rule in value['rules']:
            ids = rule['componentIds']
            # Unknown/new components start with the full contract, rather than escaping purpose-specific rules.
            if component['id'] not in known or '*' in ids or component['id'] in ids:
                applicable.append(rule)
        value['rules'] = applicable
        value['componentId'] = component['id']
    return value


def authoring_brief(component=None):
    """Give agents requirements before implementation, concrete supported variants and honest evidence boundaries."""
    policy = requirements(component)
    variants = deepcopy(VARIANTS.get(component['id'], [])) if component else []
    return {**policy, 'variantChoices': variants,
            'declaredVariants': deepcopy(component.get('variants', [])) if component else [],
            'shapeChoices': ['fixed', 'capsule', 'concentric'],
            'shapeFallback': 'Concentric uses fallbackRadius outside a declared parent; the web helper covers uniform circular geometry.',
            'appearanceOptions': {'theme': ['light', 'dark'], 'contrast': ['standard', 'increased'],
                                  'implementation': 'applyColorProfile(element, profile, theme, contrast)'},
            'appearanceMatrix': ['light', 'dark', 'light-increased-contrast', 'dark-increased-contrast'],
            'workflow': ['Read this brief before implementation; retain policyVersion and policyHash.',
                         'Select a fitting existing variant or document why a new draft is needed.',
                         'Implement semantic controls, layout, recovery and accessible alternatives.',
                         'Measure quantitative rules and report explicit evidence; missing results stay unknown.',
                         'Pass current requirements and functional checks before consumer qualification.'],
            'uiMapWorkflow': {'captureImport': "import {captureUiSnapshot} from '@ag-design/rules/ui-map-capture'",
                              'capturePrivacy':'Pass one explicit local Element root; structural mode is default, never retain field values or private text.',
                              'operations':['import_ui_snapshot','ui_map','ui_node','evaluate_ui_map','compare_ui_maps'],
                              'cycle':['Select a suitable variant','Render an explicit synthetic/local root','Capture redacted snapshot',
                                       'Import and create first graph','Continue every collection by immutable graphId',
                                       'Evaluate supported facts under this policy hash','Repair and capture again'],
                              'measurable':['declared physical alignment residual','uniform circular inset residual'],
                              'manualRequired':['AT and keyboard scenario','optical mass and ink','color/appearance matrix','zoom/reflow and recovery'],
                              'limits':'Structural capture is partial evidence. Grouping is advisory; imported identity is unverified.',
                              'discovery':'Use only operations advertised by the actual source/installed owner; old sessions may not expose them.'},
            'compositionWorkflow': {
                'schema':'ag-design/composition-v2',
                'guidanceChapter':'atomic-design-composition',
                'contextReview':'Inspect shared patterns and representative populated screens; child PASS does not qualify a page.',
                'operations':['prepare_composition','inspect_composition','apply_composition_patch','check_composition',
                              'composition_report','compare_compositions','undo_composition','qualify_composition'],
                'cycle':['Read current brief and rules; search component definitions first',
                         'Prepare a pinned document with explicit mandatory nodes, groups and constraints',
                         'Keep documentId, revision, contextReceipt and each operation idempotency key',
                         'Render the document in the sandbox and measure the actual CSS viewport',
                         'Read findings, coverage and required gate; repair through a limited atomic patch',
                         'Remeasure the same environment/scenario and compare before host integration'],
                'limits':'Geometry uses bounded CSS client rectangles. Baselines cannot be weakened by a patch. '
                         'Caller facts do not attest keyboard, AT, optical layout or target host integration; unknown never grants admission.'},
            'changedBlockReviewWorkflow': {
                'tool': 'design_evaluate_interface',
                'argument': 'changed_block_review',
                'address': ['blockId', 'elementId', 'scenarioId', 'checkId'],
                'cycle': ['Before finishing UI work, inventory every changed block and affected nested element',
                          'Declare relevant scenarios and checks, then run the real rendered interface',
                          'Submit revision, inventory and observations from the same artifact revision',
                          'Resolve every changedBlockReview.unchecked case and require completionGate=pass'],
                'trust': 'Caller declares coverage. Reconcile the inventory with the change and DOM audit.',
            },
            'formRowWorkflow': {
                'chapter': 'form-row-layout',
                'captureImport': "import {auditInterface, auditFormRows} from '@ag-design/components/audit'",
                'numericImport': "import {inspectFormRow} from '@ag-design/rules/form-row'",
                'declaration': 'data-ag-form-row="auto|row|stack" on the container; direct data-ag-form-field groups; one native field, associated above-control caption and aria-describedby messages per group.',
                'cycle': ['Read current requirements; declare semantic groups before layout',
                          'Await fonts and settled layout; call auditInterface(root).formRows on an explicit local root',
                          'Retain redacted facts, per-rule residualPx, unknown coverage and scenario identity',
                          'Repair actual tracks; rerun wrapped captions, one-field error, narrow container and actual enlarged text',
                          'Submit measured requirementObservations with the current policyVersion/policyHash'],
                'metrics': {rule['id']: rule['metric'] for rule in policy['rules']
                            if rule['id'].startswith(('form-row-', 'form-field-')) and 'metric' in rule},
                'limits': 'Declared above-control groups only; unsupported or missing geometry stays unknown. '
                          'Different hint heights and wrapped caption bottoms are valid. '
                          'Rectangles do not attest typography, semantic grouping, keyboard, AT or responsive scenarios.'},
            'layoutWidthWorkflow': {
                'chapter': 'component-width-audit',
                'captureImport': "import {auditInterface,auditLayoutWidths} from '@ag-design/components/audit'",
                'report': 'auditInterface(localRoot).layoutWidths',
                'declarations': 'data-ag-width=fill|content; optional data-ag-width-min-em=0.5..100; allocate a wrapper for multi-track fill slots',
                'scenarios': ['normal', 'narrow', 'text200', 'narrow-text200'],
                'narrowViewportMaximumCssPx': 320,
                'textEvidence': 'measured fontSize>=1.99*normal per visible target; a textScale label is insufficient',
                'argument': 'layout_width_review',
                'qualificationArgument': 'report.designReview.layoutWidthReview',
                'completion': 'layoutWidthReview.gate=pass; inspect cases/unchecked plus changedBlockReview and completionGate',
                'limits': 'AG diagnostic thresholds, bounded caller-reported geometry; unsupported/inferred/truncated stays unknown, no AT/aesthetic certification.',
            },
            'qualification': 'Variants are implementation choices, not qualified components or proof of accessibility.'}
