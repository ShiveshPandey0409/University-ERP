import { SetMetadata } from "@nestjs/common";
import { AUTH_ONLY_KEY } from "../constants/metadata-keys.js";

/** Marks a route that requires a valid session but no specific permission
 * (e.g. /auth/me). Satisfies the misconfiguration-deny check without granting
 * an implicit allow to undecorated routes. */
export const Authenticated = () => SetMetadata(AUTH_ONLY_KEY, true);
