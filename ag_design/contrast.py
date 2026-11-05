"""Evaluate opaque sRGB web text through the exact APCA JS implementation and WCAG2 luminance math."""

import json
import re

from .config import resource_root
from .errors import DesignError

TYPOGRAPHY_GUIDANCE = ('Use fontSize 8–120px; fontWeight must be one of 100, 200, 300, 400, '
                      '500, 600, 700, 800, 900; role must be body, label or large.')


class Contrast:
    """Run trusted, bundled JS only in a bounded offline context; caller strings never become source code."""

    def __init__(self):
        """Retain the reviewed local bundle once; each request owns its isolated lightweight JS context."""
        self.source = (resource_root() / 'web/vendor/ag-design/contrast-runtime.js').read_text(encoding='utf-8')

    def evaluate(self, foreground, background, *, font_size=16, font_weight=400, role='body'):
        """Return separate WCAG/APCA results plus a 70/30 advisory score; WCAG failure is never averaged away."""
        for color in (foreground, background):
            if not isinstance(color, str) or re.fullmatch(r'#[0-9a-fA-F]{6}', color) is None:
                raise DesignError('invalid_color', 'Use opaque sRGB colors as #RRGGBB', 422)
        if type(font_size) not in (int, float) or not 8 <= font_size <= 120 or type(font_weight) is not int or font_weight not in range(100, 901, 100) or role not in ('body', 'label', 'large'):
            raise DesignError('invalid_typography', TYPOGRAPHY_GUIDANCE, 422)
        import quickjs
        context = quickjs.Context()
        context.set_memory_limit(4 * 1024 * 1024)
        context.set_time_limit(.2)
        context.eval(self.source)
        arguments = json.dumps({'foreground': foreground, 'background': background, 'fontSize': font_size, 'fontWeight': font_weight, 'role': role})
        try:
            return json.loads(context.eval('JSON.stringify(AGContrast.evaluateColorPair(' + arguments + '))'))
        except quickjs.JSException as error:
            raise DesignError('contrast_unavailable', 'Contrast engine could not evaluate this pair', 503) from error
