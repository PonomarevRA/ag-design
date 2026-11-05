"""Shared lexical normalization beneath catalog and handbook models."""

import unicodedata


def normalized(value):
    """
    Normalize one text value with Unicode NFKC and case folding for lexical matching.

    Args:
        value: String supplied by validated catalog/section search.

    Returns:
        Normalized string; no fuzzy matching or semantic inference is performed.
    """
    return unicodedata.normalize('NFKC', value).casefold()
