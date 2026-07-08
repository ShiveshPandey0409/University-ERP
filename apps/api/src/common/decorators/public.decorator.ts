import { SetMetadata } from "@nestjs/common";
import { IS_PUBLIC_KEY } from "../constants/metadata-keys.js";

/** Marks a route as reachable without authentication. The ONLY escape hatch
 * from the global default-deny guard chain. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
