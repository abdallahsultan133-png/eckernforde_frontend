export type ParentRecordContext = { childId: string; academicYearId: number };

export const PARENT_RECORD_CONTEXT_EVENT = "academix:parent-record-context";

const storageKey = (parentId: string) => `academix.parent-record-context.${parentId}`;

export function readParentRecordContext(parentId?: string | null): ParentRecordContext | null {
  if (!parentId || typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey(parentId)) ?? "null") as Partial<ParentRecordContext> | null;
    const childId = typeof value?.childId === "string" ? value.childId.trim() : "";
    const academicYearId = Number(value?.academicYearId);
    return childId && Number.isInteger(academicYearId) && academicYearId > 0 ? { childId, academicYearId } : null;
  } catch {
    return null;
  }
}

export function saveParentRecordContext(parentId: string, context: ParentRecordContext) {
  if (typeof window === "undefined" || !parentId || !context.childId || !Number.isInteger(context.academicYearId) || context.academicYearId <= 0) return;
  window.localStorage.setItem(storageKey(parentId), JSON.stringify(context));
  window.dispatchEvent(new CustomEvent(PARENT_RECORD_CONTEXT_EVENT, { detail: { parentId, context } }));
}

export function parentRecordHref(mode: "homework" | "attendance" | "reports", context: ParentRecordContext | null) {
  if (!context) return `/parent/${mode}`;
  const query = new URLSearchParams({ childId: context.childId, academicYearId: String(context.academicYearId) });
  return `/parent/${mode}/view?${query.toString()}`;
}
