/** Redacted geometry only: no content, original IDs, URLs or input values. */
export interface LayoutWidthTarget {
  id: string; source: "declared" | "inferred"; mode: "fill" | "content" | null;
  width: number | null; availableWidth: number | null; fontSize: number | null; minEm: number | null;
  hidden: boolean; status: "pass" | "fail" | "unknown" | "not-applicable"; deficitPx: number | null; reason: string;
}
export interface LayoutWidthAudit {
  schemaVersion: "ag-design/width-audit-v1"; targets: LayoutWidthTarget[];
  geometryGate: "pass" | "fail" | "unknown"; truncated: boolean; inspectedNodes: number;
  coverage: {declared: number; inferred: number; measured: number; unknown: number; excluded: number};
  environment: {viewportWidth: number; scopeWidth: number | null}; manualRequired: string[]; trust: string;
}
/** Capture one settled local environment; scenario completeness is checked by layoutWidthReview. */
export function auditLayoutWidths(root: Element | Document, options?: {maxNodes?: number; maxTargets?: number}): LayoutWidthAudit;
export function auditFormRows(root: Element | Document, options?: {maxRows?: number; maxNodes?: number}): {rows: unknown[]; coverage: {visibleControls: number; declaredControls: number; undeclaredControls: number; measuredControls: number}; geometryGate: string; truncated: boolean; [key: string]: unknown};
export function auditInterface(root: Element | Document, options?: {maxElements?: number}): {schemaVersion: string; findings: {ruleId: string; severity: string; summary: string; evidence: string; componentId?: string}[]; layoutWidths: LayoutWidthAudit; formRows: ReturnType<typeof auditFormRows>; inspected: number; truncated: boolean; manualRequired: string[]; verdict: string};
export function contrastRatio(first: number[], second: number[]): number;
