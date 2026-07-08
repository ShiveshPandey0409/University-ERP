import { applyDecorators, SetMetadata } from "@nestjs/common";
import type { PermissionKey } from "@erp/shared";
import { PERMISSIONS_KEY, PERMISSION_MODE_KEY } from "../constants/metadata-keys.js";

/** Requires ALL listed permissions. */
export const Permissions = (...permissions: PermissionKey[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSION_MODE_KEY, "all"),
  );

/** Requires ANY of the listed permissions. */
export const AnyPermission = (...permissions: PermissionKey[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSION_MODE_KEY, "any"),
  );
