"""Declarative prototype tasks and bounded navigation evidence; never collect field values or execute conditions."""
from .studio_validation import fields, identity, invalid, items, number, text


def normalize_plan(raw, screens, transitions):
    """Validate at most twelve neutral tasks against this exact graph; all goals and required edges must exist."""
    fields(raw, {'purpose','tasks'})
    if raw['purpose'] not in ('funnel','operations'):
        invalid()
    screen_ids = {item['id'] for item in screens}
    edge_ids = {item['id'] for item in transitions}
    tasks = []
    for item in items(raw['tasks'],12):
        fields(item,{'id','title','instruction','entryScreenId','goalScreenIds','requiredTransitionIds'})
        entry = identity(item['entryScreenId'])
        if entry not in screen_ids:
            invalid()
        goals = references(item['goalScreenIds'],screen_ids,32)
        required = references(item['requiredTransitionIds'],edge_ids,128,empty=True)
        tasks.append({**item,'title':text(item['title']),'instruction':text(item['instruction'],2048),
                      'entryScreenId':entry,'goalScreenIds':goals,'requiredTransitionIds':required})
    return {'purpose':raw['purpose'],'tasks':tasks}


def references(value, available, maximum, empty=False):
    """Reject dangling, repeated or unbounded references without silently weakening test criteria."""
    if not isinstance(value,list) or len(value)>maximum or (not empty and not value):
        invalid()
    result = []
    for item in value:
        identity(item)
        if item not in available or item in result:
            invalid()
        result.append(item)
    return result


def evaluate_navigation(document, task, raw_events, duration_ms):
    """Replay the actual edge/back/reset sequence. Goal attainment is route evidence, not server-operation correctness."""
    if not isinstance(raw_events,list) or len(raw_events)>256:
        invalid()
    duration = number(duration_ms,0,86_400_000)
    current, stack = task['entryScreenId'],[]
    edges = {item['id']:item for item in document['transitions']}
    visited, traversed, events = {current},set(),[]
    back_count = reset_count = 0
    previous_time = 0
    for event in raw_events:
        fields(event,{'kind','transitionId','elapsedMs'})
        elapsed = number(event['elapsedMs'],previous_time,duration)
        previous_time = elapsed
        kind, edge_id = event['kind'],event['transitionId']
        if kind == 'edge':
            identity(edge_id)
            edge = edges.get(edge_id)
            if edge is None or edge['from']!=current:
                invalid()
            stack.append(current)
            current = edge['to']
            traversed.add(edge_id)
            visited.add(current)
        elif kind == 'back' and edge_id is None:
            if not stack:
                invalid()
            current = stack.pop()
            back_count += 1
        elif kind == 'reset' and edge_id is None:
            current, stack = task['entryScreenId'],[]
            traversed.clear()
            reset_count += 1
        else:
            invalid()
        events.append({'kind':kind,'transitionId':edge_id,'elapsedMs':elapsed})
    reached = current in task['goalScreenIds']
    required = set(task['requiredTransitionIds']) <= traversed
    return {'events':events,'durationMs':duration,'lastScreenId':current,'visitedScreenIds':sorted(visited),
            'goalReached':reached,'requiredEdgesReached':required,'pathCriteriaMet':reached and required,
            'backCount':back_count,'resetCount':reset_count,'trust':'caller-reported-prototype-navigation',
            'businessOperation':'unknown','fieldValidation':'unknown','accessibility':'unknown'}


def summarize_trials(trials):
    """Use one closed run as denominator; active runs and assisted outcomes remain visible and separate."""
    finished = [item for item in trials if item.get('result') is not None]
    successful = assisted = abandoned = 0
    form_gates = {'pass':0,'fail':0,'unknown':0}
    stage_counts = {}
    for item in finished:
        result = item['result']
        form_gates[result.get('formChecks',{}).get('gate','unknown')] += 1
        if result['outcome']=='completed' and result['pathCriteriaMet']:
            successful += 1
        if result['outcome']=='assisted':
            assisted += 1
        if result['outcome']=='abandoned':
            abandoned += 1
        for screen_id in result['visitedScreenIds']:
            stage_counts[screen_id] = stage_counts.get(screen_id,0)+1
    return {'started':len(trials),'finished':len(finished),'active':len(trials)-len(finished),
            'successful':successful,'assisted':assisted,'abandoned':abandoned,
            'formObservations':form_gates,'successRate':successful/len(finished) if finished else None,'stageCounts':stage_counts,
            'unit':'one-closed-prototype-run','population':'this-exact-document-revision-only',
            'limitations':'Not market conversion, a representative user study, business-operation verification or accessibility certification.'}
