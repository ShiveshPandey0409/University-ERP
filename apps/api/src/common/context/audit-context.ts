import { AsyncLocalStorage } from "node:async_hooks";

export interface AuditStore {
  before?: unknown;
  after?: unknown;
  entityId?: string;
}

export const auditContext = new AsyncLocalStorage<AuditStore>();

/** Called by services to record the pre-image of an entity before mutation. */
export function setAuditBefore(value: unknown): void {
  const store = auditContext.getStore();
  if (store) store.before = value;
}

/** Called by services to record the post-image (if not derivable from the response). */
export function setAuditAfter(value: unknown): void {
  const store = auditContext.getStore();
  if (store) store.after = value;
}

/** Called by services to record the affected entity id when not in the route params. */
export function setAuditEntityId(id: string): void {
  const store = auditContext.getStore();
  if (store) store.entityId = id;
}
