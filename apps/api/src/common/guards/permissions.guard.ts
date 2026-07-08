import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";
import { RbacService } from "../../modules/rbac/rbac.service.js";
import {
  AUTH_ONLY_KEY,
  IS_PUBLIC_KEY,
  PERMISSION_MODE_KEY,
  PERMISSIONS_KEY,
} from "../constants/metadata-keys.js";
import type { AuthenticatedPrincipal } from "../interfaces/authenticated-principal.interface.js";

/** Guard #2. Default-deny + misconfiguration-deny: a non-public route that
 * declares neither @Authenticated nor @Permissions is unreachable (403), so a
 * forgotten guard can never expose data — the fix for the legacy 200-OK defect. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const req = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedPrincipal }>();
    if (!req.user) {
      throw new UnauthorizedException({ code: "UNAUTHENTICATED", message: "Authentication required" });
    }

    const authOnly = this.reflector.getAllAndOverride<boolean>(AUTH_ONLY_KEY, targets);
    const permissions = this.reflector.getAllAndOverride<string[] | undefined>(
      PERMISSIONS_KEY,
      targets,
    );

    if (authOnly && (!permissions || permissions.length === 0)) return true;

    if (!permissions || permissions.length === 0) {
      // Misconfiguration: undeclared authenticated route → deny.
      throw new ForbiddenException({
        code: "ROUTE_NOT_AUTHORIZED",
        message: "Route is missing an authorization declaration",
      });
    }

    const mode = this.reflector.getAllAndOverride<"all" | "any">(PERMISSION_MODE_KEY, targets) ?? "all";
    const allowed = await this.rbac.hasPermissions(req.user.userId, permissions, mode);
    if (!allowed) {
      throw new ForbiddenException({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }
    return true;
  }
}
