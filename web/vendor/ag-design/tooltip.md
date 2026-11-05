# Shared timed hints

`bindTooltip({trigger,text,hoverDelayMs:250,focusDelayMs:0,placement:"auto",container})` decorates an existing named control without replacing its action, keyboard role or accessible name. Text is literal, role tooltip; caller translations stay caller-owned. It returns panel, trigger, isOpen, setOpen, setText, setDelays and dispose. The optional same-document container owns the closed node; do not place it inside the trigger.

Delays are finite integer milliseconds0..5000;250ms pointer dwell and immediate focus are AG defaults, not platform/WCAG numbers. A100ms exit grace makes the10px pointer gap crossable. Leave before dwell cancels; Escape/outside/activation/disabled/dispose retire pending and visible hints. A hovered panel stays open. Managed hints temporarily suppress native title and restore the original on disposal if the host has not supplied a new title. A tooltip supplements an existing accessible name and never hosts links/actions or required instructions.

`createInlineHelp({label,text,hoverDelayMs:250,focusDelayMs:0})` reuses that lifecycle and existing positioner. It remains a non-modal role-note disclosure with aria-controls/expanded. Mouse hover and keyboard focus can reveal it; first click/touch pins, another click or Escape/outside closes. `setOpen` and disposal remain compatible; `setDelays` changes timing atomically.

Positioning reuses top-layer/manual popover and theme-preserving body fallback; the anchor owns semantic tokens. Short tooltips fit content; long i-notes retain their existing width budget. Vertical size is constrained to available space so normal viewport anchors remain uncovered. No full browser/native/AT qualification follows from DOM tests.
