# Design-book language and audience contract

Source app0.24.0 / rules0.10.1. The source edition remains Russian. User editions are RU/EN; English editions are authored concise adaptations, not a promise of word-for-word equivalence. Existing source annotations retain their original language. Compact English agent instructions are a separate projection, not a translated screenshot.

- HTTP section list/detail defaults: `audience=user`, `locale=ru`.
- MCP `design_rule_sections` / `design_rule_section` defaults: `audience=agent`, `locale=en`. For full English detail request `audience=user,locale=en`; for Russian user prose request `audience=user,locale=ru`.
- Agent instructions stay English regardless of requested locale. A source without current instructions returns an explicitly labelled fallback rather than inventing a translation. The original source remains available.
- User UI uses the existing saved locale context. RU/EN is the default enabled set; an intentional English-only policy remains valid. Book selection/query survive a language change. A single enabled language hides the redundant selector.

## Additive source fields

Legacy sections with id/title/summary/body/tags/ruleIds/sources remain valid. Optional `localizations` maps up to eight canonical lower-case language tags to title, summary, body and sourceHash. Russian is the source, not a duplicate localization. Optional agentInstructions contains language=`en`, body and sourceHash. Strings/dictionaries are bounded and never executed.

`sourceHash` is SHA-256 of UTF-8 JSON over id/title/summary/body/ruleIds/sources, sorted keys, `ensure_ascii=False`, compact separators `(',',':')`. Use `ag_design.book_localization.source_hash` or an equivalent canonical encoder. Whitespace/order inside source prose and source annotation changes affect this hash. Valid but stale hashes remain stored, yet cannot supply current localized advice or searchable localized bodies.

Unsupported well-formed locales resolve to an available base tag, then current English, then Russian, with requestedLocale, locale, fallbackUsed and fallbackReason. Stale/missing agent instructions are explicitly reported. Invalid language tags/audiences are rejected. A future locale requires an authored current dictionary and the host locale settings policy; adding a language code alone does not translate content or certify RTL.

List responses omit body, agentInstructions and raw localization dictionaries. User lists carry bounded cross-language search terms so the retained query still works after switching. Agent lists omit those terms and source prose annotations. Detail responses select one body. APIs preserve source URLs/kinds and a catalog revision; compactness does not assert a tokenizer-independent token saving.

## Authoring and review

Update source, English user detail and compact English operating brief together. Recompute lineage only after reviewing the changed advice/citations; never merely update a stale hash to silence a warning. Keep important limits and route agents to full current criteria when the brief is insufficient. Preserve custom managed-library records; absence of language metadata is a reported legacy state. Test no-match input validation, regional/unsupported locale, stale sources, old responses, page disposal and English-only policy.


## Illustrated user articles
Read `@ag-design/rules/illustrated-book.md` for the optional source-bound teaching metadata. User chapters include authored examples and practice, rendered through bounded local figure kinds and real AG factories. Keep compact English agent responses free of complete user lessons. New source teaching edits invalidate translation lineage. No generated numeric charts, broad DOM translation or fabricated product metrics.
