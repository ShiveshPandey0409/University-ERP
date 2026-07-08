import { customAlphabet } from "nanoid";

const digits = customAlphabet("0123456789", 8);

/** Human-readable reference code, e.g. `GRV-48120375`. Uniqueness is still
 * enforced by the column's unique constraint; this only avoids obvious clashes. */
export function refCode(prefix: string): string {
  return `${prefix}-${digits()}`;
}
