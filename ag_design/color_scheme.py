"""Bounded literal text-color scheme evaluation sharing the trusted single-pair contrast algorithm."""

from .errors import DesignError
from .validation import identifier, object_fields


def evaluate_scheme(value, contrast):
    """Evaluate 1–32 uniquely named opaque text pairs; report average ranking and weakest-pair accessibility gate."""
    object_fields(value, {'pairs'}, {'pairs'})
    pairs = value['pairs']
    if not isinstance(pairs, list) or not 1 <= len(pairs) <= 32:
        raise DesignError('invalid_scheme', 'Supply 1–32 named text color pairs', 422)
    seen, results = set(), []
    for pair in pairs:
        object_fields(pair, {'id', 'foreground', 'background', 'fontSize', 'fontWeight', 'role'}, {'id', 'foreground', 'background'})
        key = identifier(pair['id'], 'pairId')
        if key in seen:
            raise DesignError('invalid_scheme', 'Pair identities must be unique', 422)
        seen.add(key)
        evaluated = contrast.evaluate(pair['foreground'], pair['background'], font_size=pair.get('fontSize', 16),
                                      font_weight=pair.get('fontWeight', 400), role=pair.get('role', 'body'))
        results.append({'id': key, **evaluated})
    failed = [row['id'] for row in results if not row['wcag2']['aa']]
    advisory = [row['id'] for row in results if not row['apca']['meetsAdvisoryTarget']]
    return {'policyVersion': 'ag-text-color-scheme-v1', 'pairs': results,
            'score': round(sum(row['weightedScore'] for row in results) / len(results), 2),
            'scoreAggregation': 'unweighted mean of per-pair APCA70/WCAG30 rankings',
            'minimumPairScore': min(row['weightedScore'] for row in results),
            'apcaWeight': .7, 'wcagWeight': .3, 'allWcagAAPass': not failed,
            'failedWcagPairs': failed, 'advisoryApcaPairs': advisory,
            'verdict': 'wcag-fail' if failed else 'review-apca' if advisory else 'contrast-targets-met',
            'limitations': ['Only supplied opaque sRGB text/background pairs are checked.',
                            'Non-text contrast, images, transparency and full interface conformance require separate review.']}
