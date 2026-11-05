"""
Bounded authored framing templates; numeric guides do not infer optical subjects or aesthetic quality.
"""

import math

FIELDS = {
    "edge-balance": ("type", "edge", "insetRatio", "focusRatio"),
    "lead-room": ("type", "edge", "eyeLevel"),
    "center-perspective": ("type", "vanishX", "vanishY"),
    "phi-grid": ("type",),
    "golden-triangle": ("type", "flipX", "flipY"),
    "diagonal-flow": ("type", "flipX", "flipY"),
    "icon-keylines": ("type",),
}


def defaults(kind):
    """
    Return explicit normalized AG positions, not universal cinematography ratios.

    Args:
        kind: Supported composition profile ID.

    Returns:
        A fresh dictionary of normalized AG defaults; other kinds return an empty dictionary.
    """
    if kind == "edge-balance":
        return {"edge": "left", "insetRatio": 0.18, "focusRatio": 0.4}
    if kind == "lead-room":
        return {"edge": "left", "eyeLevel": 1 / 3}
    if kind == "center-perspective":
        return {"vanishX": 0.5, "vanishY": 0.45}
    if kind in ("golden-triangle", "diagonal-flow"):
        return {"flipX": False, "flipY": False}
    return {}


def segment_target(x, y, line):
    """
    Project onto the finite physical segment so perpendiculars remain correct for non-square frames.

    Args:
        x: Local horizontal coordinate in the same unit as line.
        y: Local vertical coordinate in the same unit as line.
        line: Finite segment dictionary with x1/y1/x2/y2.

    Returns:
        Closest point on the closed segment; a degenerate segment returns its first endpoint.
    """
    dx = line["x2"] - line["x1"]
    dy = line["y2"] - line["y1"]
    denominator = dx * dx + dy * dy
    t = (
        max(0, min(1, ((x - line["x1"]) * dx + (y - line["y1"]) * dy) / denominator))
        if denominator
        else 0
    )
    return {"x": line["x1"] + t * dx, "y": line["y1"] + t * dy}


def geometry(width, height, config):
    """
    Build finite carrier-local targets and guide regions; icon keylines stay square inside wide frames.

    Args:
        width: Validated positive carrier width in the caller unit.
        height: Validated positive carrier height in the same unit.
        config: Validated profile settings including resolved defaults.

    Returns:
        Fresh bounded local axes, points, segments, regions and optional circles. No host mutation or image recognition.
    """
    x = []
    y = []
    points = []
    diagonals = []
    regions = []
    circles = []
    kind = config["type"]

    def point(key, px, py):
        """
        Construct one literal local target.

        Args:
            key: Literal stable target ID.
            px: Local horizontal coordinate.
            py: Local vertical coordinate.

        Returns:
            Detached target dictionary.
        """
        return {"id": key, "x": px, "y": py}

    if kind == "edge-balance":
        side = config["edge"]
        vertical = side in ("top", "bottom")
        reverse = side in ("right", "bottom")
        axis = 1 - config["insetRatio"] if reverse else config["insetRatio"]
        px = config["focusRatio"] if vertical else axis
        py = axis if vertical else config["focusRatio"]
        bx = 0.5 if vertical else 0.3 if reverse else 0.7
        by = (0.3 if reverse else 0.7) if vertical else 0.5
        x = [px * width]
        y = [py * height]
        points = [
            point("subject", x[0], y[0]),
            point("counterweight", bx * width, by * height),
        ]
        start = 0.05 if reverse else 0.4
        regions = [
            {
                "id": "negative-space",
                "x": (0.05 if vertical else start) * width,
                "y": (start if vertical else 0.05) * height,
                "width": (0.9 if vertical else 0.55) * width,
                "height": (0.55 if vertical else 0.9) * height,
            }
        ]
    elif kind == "lead-room":
        subject = 1 / 3 if config["edge"] == "left" else 2 / 3
        look = 1 - subject
        x = [subject * width, look * width]
        y = [config["eyeLevel"] * height]
        points = [point("subject", x[0], y[0]), point("look-target", x[1], y[0])]
        regions = [
            {
                "id": "look-room",
                "x": (0.45 if config["edge"] == "left" else 0.05) * width,
                "y": 0.1 * height,
                "width": 0.5 * width,
                "height": 0.8 * height,
            }
        ]
    elif kind == "center-perspective":
        px = config["vanishX"] * width
        py = config["vanishY"] * height
        x = [px]
        y = [py]
        points = [point("vanishing", px, py)]
        for a, b in (
            (0, 0),
            (width, 0),
            (width, height),
            (0, height),
            (width / 2, 0),
            (width, height / 2),
            (width / 2, height),
            (0, height / 2),
        ):
            diagonals.append({"x1": a, "y1": b, "x2": px, "y2": py})
    elif kind == "phi-grid":
        f = (3 - math.sqrt(5)) / 2
        x = [f * width, (1 - f) * width]
        y = [f * height, (1 - f) * height]
        for row in range(2):
            for col in range(2):
                points.append(point(f"phi-{col}-{row}", x[col], y[row]))
    elif kind in ("golden-triangle", "diagonal-flow"):
        main = {"x1": 0, "y1": 0, "x2": width, "y2": height}
        diagonals = [main]
        if kind == "golden-triangle":
            for index, a, b in ((0, width, 0), (1, 0, height)):
                foot = segment_target(a, b, main)
                diagonals.append({"x1": a, "y1": b, "x2": foot["x"], "y2": foot["y"]})
                points.append(point("foot-" + str(index), foot["x"], foot["y"]))
        else:
            diagonals.append({"x1": width, "y1": 0, "x2": 0, "y2": height})
            points = [
                point("center", width / 2, height / 2),
                point("flow-start", width / 3, height / 3),
                point("flow-end", width * 2 / 3, height * 2 / 3),
            ]
        if config["flipX"]:
            points = [{**p, "x": width - p["x"]} for p in points]
            diagonals = [
                {**d, "x1": width - d["x1"], "x2": width - d["x2"]} for d in diagonals
            ]
        if config["flipY"]:
            points = [{**p, "y": height - p["y"]} for p in points]
            diagonals = [
                {**d, "y1": height - d["y1"], "y2": height - d["y2"]} for d in diagonals
            ]
    elif kind == "icon-keylines":
        size = min(width, height)
        step = size / 24
        left = (width - size) / 2
        top = (height - size) / 2
        x = [left + v * step for v in (2, 3, 4, 12, 20, 21, 22)]
        y = [top + v * step for v in (2, 3, 4, 12, 20, 21, 22)]
        points = [
            point("center", width / 2, height / 2),
            point("square-tl", left + 3 * step, top + 3 * step),
            point("square-br", left + 21 * step, top + 21 * step),
        ]
        circles = [
            {"id": "circle-keyline", "cx": width / 2, "cy": height / 2, "r": 10 * step}
        ]
        for key, a, b, w, h in (
            ("live", 2, 2, 20, 20),
            ("square", 3, 3, 18, 18),
            ("portrait", 4, 2, 16, 20),
            ("landscape", 2, 4, 20, 16),
        ):
            regions.append(
                {
                    "id": key,
                    "x": left + a * step,
                    "y": top + b * step,
                    "width": w * step,
                    "height": h * step,
                }
            )
    return {
        "x": x,
        "y": y,
        "points": points,
        "diagonals": diagonals,
        "regions": regions,
        **({"circles": circles} if circles else {}),
    }


def nearest_guide(shape, anchor):
    """
    Use finite segment/circle targets and deterministic lower-index ties, matching offline JS.

    Args:
        shape: Validated local geometry with finite segments and optional circles.
        anchor: Declared local x/y coordinates in the same unit.

    Returns:
        Nearest guide point and distance, or None with no guides. Equal distances keep the first guide.
    """
    best = None

    def consider(key, x, y):
        """
        Retain a strictly nearer local guide candidate.

        Args:
            key: Literal guide ID.
            x: Candidate horizontal coordinate.
            y: Candidate vertical coordinate.

        Returns:
            None. Updates the local nearest candidate only for a strictly shorter distance.
        """
        nonlocal best
        distance = math.hypot(anchor["x"] - x, anchor["y"] - y)
        if best is None or distance < best["distance"]:
            best = {"id": key, "x": x, "y": y, "distance": distance}

    for i, line in enumerate(shape["diagonals"]):
        p = segment_target(anchor["x"], anchor["y"], line)
        consider("segment-" + str(i), p["x"], p["y"])
    for circle in shape.get("circles", []):
        dx = anchor["x"] - circle["cx"]
        dy = anchor["y"] - circle["cy"]
        d = math.hypot(dx, dy)
        consider(
            circle["id"],
            circle["cx"] + (dx / d if d else 1) * circle["r"],
            circle["cy"] + (dy / d if d else 0) * circle["r"],
        )
    return best
