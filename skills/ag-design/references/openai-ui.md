# OpenAI plugin UI scope

Read the three current chapters via MCP, or their RU/EN editions in @ag-design/rules/sections.json. The dated source ledger is @ag-design/rules/openai-ui-research.json. ChatGPT-specific recommendations are not blanket web rules.

createConversationCard is a host-neutral display primitive; callers provide localized title/summary/status and at most two explicit intent callbacks. It does not install MCP Apps, window.openai, storage, network, confirmation or permission handling. Use update for accepted display data. inspect omits prose/values. inspectConversationSurface accepts context/mode and observed scalar facts; absence stays unknown and web returns not-applicable. Actual DOM, host capabilities, accessibility, security and consumer admission need independent evidence.


## ChatKit inside a product
Search ChatKit and read chatkit-widget-composition, chatkit-widget-actions and chatkit-widget-forms. This product embed can follow host theming; ChatGPT plugin styling restrictions are a different context. The portable chatkit-patterns.json maps source types to AG candidates and explicit unsupported boundaries. Search widget-list for bounded keyed results with explicit pending scope and host intent callbacks. It is an AG data contract, not ChatKit SDK/JSON compatibility. Keep native/common form checks, server authority, current source signatures and real host qualification separate.


## Public chat composition research
Search Grok, compact composer or agent work; read chat-composer-patterns and agent-work-presentation. Public x.ai marketing demos are visual observations, not verified runtime contracts. Reuse the optional compact agent-conversation composer and explicit host tool intents; retain native labels, multiline/submit, product tokens, separate connection/runtime/receipt facts and current session identity. No voice/upload/scheduler or hidden reasoning UI is installed. The portable chat-patterns-research.json records source and unknown boundaries.


## Three AG chat presentations
Read chat-presentation-selection. Use document for longer explanations/research, messenger for short recipient exchanges, work-log for development and observable operations. One agent-conversation model owns all views. setPresentation preserves existing DOM, draft, focus, disclosure, pending receipts and follow/read anchor. presentationState is redacted structure, not permission/qualification. Compare identical content at /chat-comparison.html with shared result/running/question/error states; no live vendor backend is implied.
