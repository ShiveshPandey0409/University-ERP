import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";
import { ScopeService } from "../../modules/rbac/scope.service.js";
import { IS_PUBLIC_KEY, SCOPE_KEY } from "../constants/metadata-keys.js";
import type { ScopeConfig } from "../decorators/scope.decorator.js";
import type { AuthenticatedPrincipal } from "../interfaces/authenticated-principal.interface.js";

/** Guard #3. For routes that declare @ScopedResource, asserts the referenced
 * id is within the caller's scopes. Collection endpoints filter at the query
 * layer instead; this guards single-resource access. */
@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly scopeService: ScopeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const scopeConfig = this.reflector.getAllAndOverride<ScopeConfig | undefined>(
      SCOPE_KEY,
      targets,
    );
    if (!scopeConfig) return true;

    const req = context
      .switchToHttp()
      .getRequest<
        FastifyRequest & {
          user?: AuthenticatedPrincipal;
          params?: Record<string, string>;
          query?: Record<string, unknown>;
          body?: Record<string, unknown>;
        }
      >();
    if (!req.user) return true; // JwtAuthGuard already enforced auth for non-public routes

    const scopeCtx = await this.scopeService.getScopeContext(req.user.userId);
    if (scopeCtx.isGlobal) return true;

    const targetId = this.readTarget(req, scopeConfig);
    if (!targetId) return true; // nothing to check (e.g. list route)

    const pool =
      scopeConfig.dimension === "college"
        ? scopeCtx.collegeIds
        : scopeConfig.dimension === "department"
          ? scopeCtx.departmentIds
          : scopeCtx.sessionIds;

    if (!pool.includes(targetId)) {
      throw new ForbiddenException({
        code: "OUT_OF_SCOPE",
        message: "Resource is outside your assigned scope",
      });
    }
    return true;
  }

  private readTarget(
    req: { params?: Record<string, string>; query?: Record<string, unknown>; body?: Record<string, unknown> },
    config: ScopeConfig,
  ): string | undefined {
    const bag =
      config.source === "param" ? req.params : config.source === "query" ? req.query : req.body;
    const value = bag?.[config.key];
    return typeof value === "string" ? value : undefined;
  }
}
