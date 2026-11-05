"""Shared primitive Studio validation; board and journey models depend on this lower layer."""

import math
import re
from .errors import DesignError


def invalid():
    """
    Raise the existing fixed public Studio validation error without imported content.

    Raises:
        DesignError: Always, with invalid_studio and HTTP422.
    """
    raise DesignError('invalid_studio', 'Supply a bounded brand-studio-v1 document with valid references.', 422)


def fields(value, allowed, required=None):
    """
    Validate one object boundary while preserving the existing required-field semantics.

    Args:
        value: Candidate mapping.
        allowed: Accepted member names.
        required: Required names, or the allowed set when omitted/falsey.

    Returns:
        The same mapping.

    Raises:
        DesignError: The value is not a mapping or has unknown/missing fields.
    """
    if not isinstance(value, dict) or set(value) - set(allowed) or not set(required or allowed) <= set(value):
        invalid()
    return value


def text(value, maximum=256, empty=False):
    """
    Validate literal printable text without converting user input into markup.

    Args:
        value: Candidate string.
        maximum: Maximum character count, default256.
        empty: Whether an empty or whitespace-only string is allowed.

    Returns:
        The unchanged accepted string.

    Raises:
        DesignError: Wrong type, excessive length, forbidden XML control or surrogate code point.
    """
    if not isinstance(value, str):
        invalid()
    if len(value) > maximum:
        invalid()
    if not empty and not value.strip():
        invalid()
    for char in value:
        code = ord(char)
        control = code < 32 and char not in '\n\t'
        surrogate = 0xd800 <= code <= 0xdfff
        if control or surrogate or code in (0xfffe, 0xffff):
            invalid()
    return value


def identity(value):
    """
    Validate an opaque data key without treating it as a path or selector.

    Args:
        value: Candidate ASCII identifier of1–80letters, digits, underscores or hyphens.

    Returns:
        The unchanged accepted identifier.

    Raises:
        DesignError: Identifier type, alphabet or length is invalid.
    """
    if not isinstance(value, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,80}', value):
        invalid()
    return value


def number(value, low, high):
    """
    Validate a finite bounded number while rejecting booleans.

    Args:
        value: Candidate int/float.
        low: Inclusive minimum.
        high: Inclusive maximum.

    Returns:
        The unchanged accepted numeric value.

    Raises:
        DesignError: Wrong type, nonfinite value or a value outside the inclusive bounds.
    """
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
        invalid()
    return value


def color(value):
    """
    Validate an opaque RGB color without accepting CSS expressions or paint servers.

    Args:
        value: Candidate six-digit RGB hex string prefixed by#.

    Returns:
        Lowercase accepted color.

    Raises:
        DesignError: Candidate is not an opaque RGB hex string.
    """
    if not isinstance(value, str) or not re.fullmatch(r'#[0-9a-fA-F]{6}', value):
        invalid()
    return value.lower()


def items(value, maximum):
    """
    Validate a bounded list of objects and reject duplicate opaque identities.

    Args:
        value: Candidate list of objects containing id.
        maximum: Maximum permitted item count.

    Returns:
        The unchanged accepted list.

    Raises:
        DesignError: Wrong type, excessive count or invalid/repeated item identity.
    """
    if not isinstance(value, list) or len(value) > maximum:
        invalid()
    seen = set()
    for item in value:
        if not isinstance(item, dict) or identity(item.get('id')) in seen:
            invalid()
        seen.add(item['id'])
    return value
