import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import type { FastifyRequest } from "fastify";
import { AuditService } from "../../modules/audit/audit.service.js";
import { auditContext, type AuditStore } from "../context/audit-context.js";
import { AUDIT_KEY, IS_PUBLIC_KEY, PERMISSIONS_KEY } from "../constants/metadata-keys.js";
import type { AuditConfig } from "../decorators/audit.decorator.js";
import type { AuthenticatedPrincipal } from "../interfaces/authenticated-principal.interface.js";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

interface ResolvedAuditMeta {
  action: string;
  entityType: string;
  entityIdParam?: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.resolveMeta(context);
    if (!meta) return next.handle();

    const req = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedPrincipal; params?: Record<string, string> }>();
    const store: AuditStore = {};

    return new Observable((subscriber) => {
      auditContext.run(store, () => {
        next
          .handle()
          .pipe(
            tap({
              next: (response) => {
                void this.record(meta, store, req, response, "success");
              },
              error: (err) => {
                void this.record(meta, store, req, undefined, "failure", err);
              },
            }),
          )
          .subscribe(subscriber);
      });
    });
  }

  private resolveMeta(context: ExecutionContext): ResolvedAuditMeta | null {
    const handler = context.getHandler();
    const cls = context.getClass();

    const explicit = this.reflector.getAllAndOverride<AuditConfig | undefined>(AUDIT_KEY, [
      handler,
      cls,
    ]);
    if (explicit) {
      return {
        action: explicit.action,
        entityType: explicit.entityType,
        entityIdParam: explicit.entityIdParam ?? "id",
      };
    }

    // Heuristic: audit mutating, permissioned (non-public) routes automatically.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [handler, cls]);
    if (isPublic) return null;
    const permissions = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
      handler,
      cls,
    ]);
    if (!permissions || permissions.length === 0) return null;

    const req = context.switchToHttp().getRequest<FastifyRequest>();
    if (!MUTATING.has(req.method)) return null;

    const [action] = permissions;
    const segments = action!.split(".");
    return {
      action: action!,
      entityType: segments.slice(0, 2).join("."),
      entityIdParam: "id",
    };
  }

  private async record(
    meta: ResolvedAuditMeta,
    store: AuditStore,
    req: FastifyRequest & { user?: AuthenticatedPrincipal; params?: Record<string, string> },
    response: unknown,
    outcome: "success" | "failure",
    error?: unknown,
  ): Promise<void> {
    const entityId =
      store.entityId ??
      (meta.entityIdParam ? req.params?.[meta.entityIdParam] : undefined) ??
      extractId(response);

    await this.auditService.write({
      actorUserId: req.user?.userId ?? null,
      actorType: req.user ? "user" : "anonymous",
      action: outcome === "failure" ? `${meta.action}.failed` : meta.action,
      entityType: meta.entityType,
      entityId: entityId ?? null,
      before: store.before,
      after: outcome === "success" ? (store.after ?? response) : { error: describeError(error) },
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
      requestId: req.id,
      outcome,
    });
  }
}

function extractId(response: unknown): string | undefined {
  if (response && typeof response === "object" && "id" in response) {
    const id = (response as { id: unknown }).id;
    return typeof id === "string" ? id : undefined;
  }
  return undefined;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}
