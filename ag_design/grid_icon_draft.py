"""
Original bounded SVG starter glyphs and numeric construction evidence, never arbitrary user SVG execution.
"""

import html
import math
from .layout_grids import geometry, check_geometry, invalid, number

SYMBOLS = ("play", "focus", "image", "compass")


def drawing(symbol):
    """
    Return original fixed primitives; callers never provide paths or external resource references.

    Args:
        symbol: Validated play/focus/image/compass starter ID.

    Returns:
        Fresh original fixed primitives; unknown internal symbols fall back to compass. Public callers validate first.
    """
    if symbol == "play":
        return [
            {"kind": "polygon", "points": [[8, 5], [8, 19], [20, 12]], "fill": True}
        ]
    if symbol == "focus":
        return [
            {"kind": "polyline", "points": p}
            for p in [
                [[4, 9], [4, 4], [9, 4]],
                [[15, 4], [20, 4], [20, 9]],
                [[20, 15], [20, 20], [15, 20]],
                [[9, 20], [4, 20], [4, 15]],
            ]
        ]
    if symbol == "image":
        return [
            {"kind": "rect", "x": 3, "y": 3, "width": 18, "height": 18},
            {"kind": "circle", "cx": 8, "cy": 8, "r": 2},
            {
                "kind": "polyline",
                "points": [[5, 18], [10, 12], [14, 16], [18, 10], [20, 18]],
            },
        ]
    return [
        {"kind": "circle", "cx": 12, "cy": 12, "r": 9},
        {"kind": "polygon", "points": [[8, 16], [10, 10], [16, 8], [14, 14]]},
    ]


def bounds(primitives, stroke):
    """
    Include conservative round-cap/join stroke extents, rather than merely checking centre paths.

    Args:
        primitives: Generated circle/rect/polyline/polygon dictionaries.
        stroke: Finite visible stroke width in viewBox units.

    Returns:
        Conservative bounding rectangle including round-cap/join stroke extents.
    """
    left = top = math.inf
    right = bottom = -math.inf
    # Centre paths omit cap/join extents; the returned bounds include half the visible stroke.
    for p in primitives:
        if p["kind"] == "circle":
            a = p["cx"] - p["r"]
            b = p["cy"] - p["r"]
            c = p["cx"] + p["r"]
            d = p["cy"] + p["r"]
        elif p["kind"] == "rect":
            a = p["x"]
            b = p["y"]
            c = a + p["width"]
            d = b + p["height"]
        else:
            a = min((v[0] for v in p["points"]))
            b = min((v[1] for v in p["points"]))
            c = max((v[0] for v in p["points"]))
            d = max((v[1] for v in p["points"]))
        left = min(left, a - stroke / 2)
        top = min(top, b - stroke / 2)
        right = max(right, c + stroke / 2)
        bottom = max(bottom, d + stroke / 2)
    return {"x": left, "y": top, "width": right - left, "height": bottom - top}


def fmt(value):
    """
    Produce short finite decimal SVG coordinates with bounded precision.

    Args:
        value: Finite generated coordinate.

    Returns:
        A decimal string with at most six fractional places and no unnecessary trailing zeros.
    """
    return f"{value:.6f}".rstrip("0").rstrip(".")


def validate_label(label):
    """
    Validate literal accessible text consistently with the JavaScript UTF-16 budget.

    Args:
        label: Candidate literal title, with no markup interpretation.

    Returns:
        None. The input string is never normalized or truncated.

    Raises:
        DesignError: Blank, non-string, oversized or XML-invalid title.
    """
    if not isinstance(label, str):
        invalid("icon label")
    if not label.replace("\ufeff", "").strip() or len(label) > 80:
        invalid("icon label")
    # Match JavaScript UTF-16 length without discarding non-BMP characters.
    if len(label.encode("utf-16-le", "surrogatepass")) // 2 > 80:
        invalid("icon label")
    for char in label:
        code = ord(char)
        if (
            code < 32
            or 127 <= code <= 159
            or 55296 <= code <= 57343
            or code in (65534, 65535)
        ):
            invalid("icon label")


def icon_specification(grid, purpose):
    """
    Choose construction profiles allowed for the declared icon purpose.

    Args:
        grid: Optional strict grid dictionary; None chooses icon-keylines.
        purpose: Already validated ui or illustrative purpose.

    Returns:
        Detached grid dictionary; unspecified spacing step becomes2 viewBox units.

    Raises:
        DesignError: Non-object settings or a profile incompatible with this purpose.
    """
    if grid is None:
        spec = {"type": "icon-keylines"}
    elif isinstance(grid, dict):
        spec = dict(grid)
    else:
        invalid("icon grid")
    if spec.get("type") == "spacing" and "step" not in spec:
        spec["step"] = 2
    # Action glyphs keep the surrounding UI family; expressive framing is opt-in for illustrations.
    allowed = ("icon-keylines", "spacing")
    if purpose == "illustrative":
        allowed += (
            "golden-canon",
            "thirds",
            "edge-balance",
            "lead-room",
            "center-perspective",
            "phi-grid",
            "golden-triangle",
            "diagonal-flow",
        )
    if spec.get("type") not in allowed:
        invalid(
            "Single icon drafts require keylines, spacing or purpose-compatible framing; reading/track grids belong to the surrounding layout"
        )
    return spec


def serialize_svg(primitives, size, stroke, label):
    """
    Serialize only fixed generated primitives and XML-escaped literal title text.

    Args:
        primitives: Generated circle/rect/polyline/polygon dictionaries.
        size: Validated24 or64 square viewBox extent.
        stroke: Finite transformed stroke width in viewBox units.
        label: Validated literal accessible title.

    Returns:
        Standalone SVG with currentColor and no scripts or external resource references.
    """
    elements = []
    # Only our fixed primitive kinds reach this serializer; user text is escaped as a title.
    for p in primitives:
        fill = "currentColor" if p.get("fill") else "none"
        common = f' fill="{fill}"'
        if p["kind"] == "circle":
            element = f"""<circle cx="{fmt(p['cx'])}" cy="{fmt(p['cy'])}" r="{fmt(p['r'])}"{common}/>"""
        elif p["kind"] == "rect":
            element = f"""<rect x="{fmt(p['x'])}" y="{fmt(p['y'])}" width="{fmt(p['width'])}" height="{fmt(p['height'])}"{common}/>"""
        else:
            points = " ".join(
                (",".join((fmt(v) for v in point)) for point in p["points"])
            )
            element = f"""<{p['kind']} points="{points}"{common}/>"""
        elements.append(element)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" role="img" stroke="currentColor" stroke-width="{fmt(stroke)}" stroke-linecap="round" stroke-linejoin="round"><title>{html.escape(label)}</title>{''.join(elements)}</svg>"""


def icon_draft(
    *, symbol="focus", purpose="ui", grid=None, label=None, stroke_width=1.5
):
    """
    Construct one bounded glyph and source-linked grid report; optics/recognition/accessibility remain host checks.

    Args:
        symbol: One of four starter IDs; focus by default.
        purpose: ui for24 units or illustrative for64 units.
        grid: Strict supported grid settings; None selects icon-keylines.
        label: Literal nonblank title, at most80 UTF-16 units; None uses symbol.
        stroke_width: Finite initial stroke width from1 through3;1.5 by default.

    Returns:
        Detached primitives, escaped SVG, visible stroke bounds and shared numeric grid report. Optical/recognition/host accessibility remain unknown.

    Raises:
        DesignError: Invalid symbol/purpose/label/stroke, strict grid settings, or no safe live area.
    """
    if symbol not in SYMBOLS or purpose not in ("ui", "illustrative"):
        invalid("icon symbol/purpose")
    label = symbol if label is None else label
    validate_label(label)
    number(stroke_width, "icon strokeWidth", 1, 3)
    spec = icon_specification(grid, purpose)
    size = 24 if purpose == "ui" else 64
    shape = geometry(size, size, spec)
    focal = next(
        (p for p in shape["points"] if p["id"] in ("subject", "vanishing", "center")),
        None,
    )
    if focal is None and shape["points"]:
        focal = min(
            shape["points"],
            key=lambda p: math.hypot(p["x"] - size / 2, p["y"] - size / 2),
        )
    if focal is None:
        focal = {"id": "carrier-center", "x": size / 2, "y": size / 2}
    canonical = drawing(symbol)
    base = bounds(canonical, stroke_width)
    padding = 2
    radius = max(
        12 - base["x"],
        base["x"] + base["width"] - 12,
        12 - base["y"],
        base["y"] + base["height"] - 12,
    )
    available = min(
        focal["x"] - padding,
        focal["y"] - padding,
        size - padding - focal["x"],
        size - padding - focal["y"],
    )
    if available <= 0:
        invalid("icon focal point leaves no safe live area")
    # Bound the visible stroke around the declared focus, including edge-biased illustrations.
    scale = min(1 if purpose == "ui" else 1.6, available / radius)

    def tx(x):
        """
        Transform one canonical x coordinate.

        Args:
            x: Canonical horizontal glyph coordinate.

        Returns:
            Scaled local horizontal coordinate around the chosen focal point.
        """
        return focal["x"] + (x - 12) * scale

    def ty(y):
        """
        Transform one canonical y coordinate.

        Args:
            y: Canonical vertical glyph coordinate.

        Returns:
            Scaled local vertical coordinate around the chosen focal point.
        """
        return focal["y"] + (y - 12) * scale

    primitives = []
    for p in canonical:
        if p["kind"] == "circle":
            value = {**p, "cx": tx(p["cx"]), "cy": ty(p["cy"]), "r": p["r"] * scale}
        elif p["kind"] == "rect":
            value = {
                **p,
                "x": tx(p["x"]),
                "y": ty(p["y"]),
                "width": p["width"] * scale,
                "height": p["height"] * scale,
            }
        else:
            value = {**p, "points": [[tx(x), ty(y)] for x, y in p["points"]]}
        primitives.append(value)
    stroke = stroke_width * scale
    visible = bounds(primitives, stroke)
    report = check_geometry(
        shape,
        [
            {
                "id": "construction-focus",
                "ownerId": "icon",
                "x": focal["x"],
                "y": focal["y"],
            }
        ],
        0.008,
    )
    svg = serialize_svg(primitives, size, stroke, label)
    within = (
        visible["x"] >= padding - 1e-09
        and visible["y"] >= padding - 1e-09
        and (visible["x"] + visible["width"] <= size - padding + 1e-09)
        and (visible["y"] + visible["height"] <= size - padding + 1e-09)
    )
    result = {
        "schemaVersion": "ag-design/grid-icon-draft-v1",
        "symbol": symbol,
        "purpose": purpose,
        "label": label,
        "viewBox": {"x": 0, "y": 0, "width": size, "height": size},
        "strokeWidth": stroke,
        "primitives": primitives,
        "svg": svg,
        "visibleBounds": visible,
        "padding": padding,
        "withinLiveArea": within,
        "report": report,
        "constraints": {
            "colors": "currentColor; host semantic palette",
            "immutability": "detached draft data",
            "alignment": "construction evidence only",
            "opticalReview": "unknown",
            "semanticRecognition": "unknown",
            "accessibility": "host-owned name/control/contrast",
        },
        "warnings": [
            "A grid hit is not proof of legibility, recognition or professional composition.",
            "Review actual16/20/24/32px rendering and optical balance; preserve host icon family and labels.",
        ],
    }
    return result
