import { SetMetadata } from "@nestjs/common";
import { AUDIT_KEY } from "../constants/metadata-keys.js";

export interface AuditConfig {
  action: string;
  entityType: string;
  /** Param key holding the entity id, e.g. "id". */
  entityIdParam?: string;
}

/** Explicitly audit a route (overrides the default mutating-route heuristic). */
export const Audit = (config: AuditConfig) => SetMetadata(AUDIT_KEY, config);
