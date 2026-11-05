# Shared field tracks

Core0.36.2, opt-in CSS utility `@ag-design/components/form-tracks.css`. Use existing `form-row-layout` guidance and exact component decisions before adopting it. No factory, new input event or custom widget is introduced.

Give the host grid class `ag-form-tracks`. The host still owns columns, column gap, field spans and responsive breakpoints. Each direct field wrapper has `data-ag-form-field` and three direct children:

```html
<div class="ag-form-tracks">
  <div data-ag-form-field>
    <label class="ag-form-track__label" for="amount">Amount</label>
    <input class="ag-form-track__control" id="amount">
    <div class="ag-form-track__feedback">Optional hint/error/disclosure</div>
  </div>
</div>
```

Use real unique IDs and label associations. Existing controls may be moved without cloning; preserve value/defaults, events, validity, hidden state and drafts. Keep explicit label-for association when moving a control out of a wrapping label. A current native select remains native. This utility does not set palette, typography, control height or business state.

CSS subgrid shares label/control/feedback tracks per visual row. Wrapped labels enlarge the label track; label text ends next to the control track. Controls align by their actual bottom border. For comparable single-line fields choose one density so both top and bottom borders align. Feedback is separate: opening help or showing an error enlarges space below the controls and moves later rows, not the common control axis. `--ag-form-track-gap` defaults to6CSSpx; it is AG policy, not a WCAG requirement. Do not align whole help-bearing wrappers with end/bottom or use fixed caption heights/margins to imitate this layout.

Put row-wide actions/settings in a separate host group when their intended control line cannot be expressed by these three slots. Do not force textarea/listbox/custom multiline widgets to the same height as single-line fields. Reflow changes the row grouping without CSS order. Hidden fields retain their hidden semantics; the utility never forces a hidden feedback panel open. Browsers without subgrid keep ordinary host layout; shared alignment is then unverified, not guaranteed.

Declare `data-ag-form-row` only for actual inspectable semantic groups; wrapping multi-row grids may need separate measured row facts. Existing `inspectFormRow` measures control tops and comparable heights; equal density makes its top result consistent with bottom alignment. Report bottom residual separately for intentionally unequal heights. Numeric checks do not certify caption ink, labels, AT or native behavior.

Verify short/wrapped captions, single-field help/error open/closed, actual field bottoms, row displacement, long/narrow/RTL/enlarged text and focus/value/reset preservation. CSS import alone does not qualify the component or host.
