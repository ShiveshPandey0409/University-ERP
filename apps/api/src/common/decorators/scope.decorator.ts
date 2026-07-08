import { SetMetadata } from "@nestjs/common";
import { SCOPE_KEY } from "../constants/metadata-keys.js";

export interface ScopeConfig {
  /** Where to read the target id from. */
  source: "param" | "query" | "body";
  /** The key holding the target id. */
  key: string;
  /** Which scope dimension to check it against. */
  dimension: "college" | "department" | "session";
}

/** Enforces that the referenced resource id is within the caller's scopes. */
export const ScopedResource = (config: ScopeConfig) => SetMetadata(SCOPE_KEY, config);
