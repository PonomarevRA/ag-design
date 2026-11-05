"""Bounded teaching examples are authored data, never HTML, executable code or remote asset URLs."""
from .errors import DesignError
from .validation import object_fields, text

GROUPS = ('start', 'interface', 'inclusion', 'communication', 'delivery', 'system', 'assistants')
FIGURES = ('flow', 'structure', 'spacing', 'typography', 'actions', 'form', 'states',
           'color', 'data', 'golden-grid', 'slide', 'workbook', 'journey', 'languages', 'compare')


def validate_lesson(value):
    """Accept one literal teaching record with a fixed local figure renderer and bounded readable text."""
    object_fields(value, {'group', 'takeaway', 'scenario', 'before', 'after', 'practice', 'figure'},
                  {'group', 'takeaway', 'scenario', 'before', 'after', 'practice', 'figure'})
    if value['group'] not in GROUPS:
        raise DesignError('invalid_lesson', 'Unknown learning group', 422)
    for name, limit in [('takeaway', 600), ('scenario', 1800), ('before', 1000), ('after', 1000)]:
        text(value[name], 'lesson.' + name, limit)
    practice = value['practice']
    if not isinstance(practice, list) or not 1 <= len(practice) <= 5:
        raise DesignError('invalid_lesson', 'Use one to five practice steps', 422)
    for step in practice:
        text(step, 'lesson.practice', 600)
    figure = value['figure']
    object_fields(figure, {'kind', 'labels'}, {'kind', 'labels'})
    if figure['kind'] not in FIGURES:
        raise DesignError('invalid_lesson', 'Unknown local teaching figure', 422)
    if not isinstance(figure['labels'], list) or not 2 <= len(figure['labels']) <= 6:
        raise DesignError('invalid_lesson', 'Figures need two to six literal labels', 422)
    for label in figure['labels']:
        text(label, 'lesson.figure.label', 180)


def lesson_search(value):
    """Keep examples discoverable without expanding list or agent responses with the complete teaching record."""
    if not value:
        return ''
    parts = [value[key] for key in ('takeaway', 'scenario', 'before', 'after')]
    parts.extend(value['practice'])
    parts.extend(value['figure']['labels'])
    return ' '.join(parts)
