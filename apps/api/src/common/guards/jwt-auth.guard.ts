import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { FastifyRequest } from "fastify";
import type { UserType } from "@erp/shared";
import { RedisService } from "../../redis/redis.service.js";
import { IS_PUBLIC_KEY } from "../constants/metadata-keys.js";
import type { AuthenticatedPrincipal } from "../interfaces/authenticated-principal.interface.js";

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  typ: UserType;
  rv: number;
}

export const sessionKey = (sessionId: string) => `session:${sessionId}`;

/** Guard #1 in the global chain. Verifies the access token and confirms the
 * session is still live. Public routes bypass; a valid token on a public route
 * is attached best-effort so audit/no-store can see the actor. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedPrincipal }>();
    const token = this.extractBearer(req);

    if (isPublic) {
      if (token) {
        const payload = await this.safeVerify(token);
        if (payload) req.user = this.toPrincipal(payload);
      }
      return true;
    }

    if (!token) throw new UnauthorizedException({ code: "UNAUTHENTICATED", message: "Missing access token" });

    const payload = await this.safeVerify(token);
    if (!payload) throw new UnauthorizedException({ code: "INVALID_TOKEN", message: "Invalid or expired token" });

    const live = await this.redis.get(sessionKey(payload.sid));
    if (!live) throw new UnauthorizedException({ code: "SESSION_EXPIRED", message: "Session is no longer active" });

    req.user = this.toPrincipal(payload);
    return true;
  }

  private extractBearer(req: FastifyRequest): string | null {
    const header = req.headers["authorization"];
    if (!header || Array.isArray(header)) return null;
    const [scheme, value] = header.split(" ");
    return scheme?.toLowerCase() === "bearer" && value ? value : null;
  }

  private async safeVerify(token: string): Promise<AccessTokenPayload | null> {
    try {
      return await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow<string>("auth.jwtSecret"),
      });
    } catch {
      return null;
    }
  }

  private toPrincipal(payload: AccessTokenPayload): AuthenticatedPrincipal {
    return {
      userId: payload.sub,
      userType: payload.typ,
      sessionId: payload.sid,
      roleVersion: payload.rv,
    };
  }
}
