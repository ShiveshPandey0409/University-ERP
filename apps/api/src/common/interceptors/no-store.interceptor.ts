import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthenticatedPrincipal } from "../interfaces/authenticated-principal.interface.js";

/** Sets `Cache-Control: no-store` on responses to authenticated requests so
 * private data is never cached by intermediaries or the browser. */
@Injectable()
export class NoStoreInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedPrincipal }>();
    if (req.user) {
      const reply = context.switchToHttp().getResponse<FastifyReply>();
      reply.header("Cache-Control", "no-store");
    }
    return next.handle();
  }
}
