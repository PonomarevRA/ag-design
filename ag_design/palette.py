"""Bounded palette evaluation through the exact offline JS model used by the browser."""
import json
from .config import resource_root
from .errors import DesignError
from .validation import object_fields


class Palette:
    """Load trusted bundle once; each request gets an isolated memory/time-limited interpreter."""

    def __init__(self):
        """Use packaged static assets; never import caller code, paths or dependencies."""
        self.source = (resource_root() / 'web/vendor/ag-design/palette-runtime.js').read_text(encoding='utf-8')

    def generate(self, value):
        """Validate bounded literal input before serializing it as data into a fixed trusted function."""
        keys = {'baseColor', 'space', 'harmonies', 'background', 'foreground', 'fontSize', 'fontWeight', 'role'}
        object_fields(value, keys, {'baseColor'})
        for key in ('baseColor', 'background', 'foreground', 'space', 'role'):
            if key in value and (not isinstance(value[key], str) or len(value[key]) > 32):
                raise DesignError('invalid_palette', 'Use bounded literal palette values', 422)
        harmonies = value.get('harmonies')
        if 'harmonies' in value and (not isinstance(harmonies, list) or not 1 <= len(harmonies) <= 7 or any(not isinstance(item, str) or len(item) > 32 for item in harmonies)):
            raise DesignError('invalid_palette', 'Select1–7 distinct supported harmonies', 422)
        for key in ('fontSize', 'fontWeight'):
            if key in value and type(value[key]) not in (int, float):
                raise DesignError('invalid_palette', 'Use numeric typography', 422)
        import quickjs
        context = quickjs.Context()
        context.set_memory_limit(8 * 1024 * 1024)
        context.set_time_limit(.5)
        try:
            arguments = json.dumps(value, ensure_ascii=True, allow_nan=False, separators=(',', ':'))
        except (ValueError, TypeError):
            raise DesignError('invalid_palette', 'Use finite JSON values', 422) from None
        context.eval(self.source)
        # User data never selects the function, global, module, path or executable expression.
        expression = 'JSON.stringify(AGPalette.generatePalette(' + arguments + '))'
        try:
            result = context.eval(expression)
        except quickjs.JSException as error:
            if 'TypeError' in str(error):
                raise DesignError('invalid_palette', 'Use opaque #RRGGBB colors and supported palette/typography options', 422) from None
            raise DesignError('palette_unavailable', 'Palette evaluation could not complete', 503) from None
        if len(result.encode('utf-8')) > 60000:
            raise DesignError('palette_unavailable', 'Palette result exceeds its bounded response', 503)
        return json.loads(result)
