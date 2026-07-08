import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedPrincipal } from "../interfaces/authenticated-principal.interface.js";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedPrincipal | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedPrincipal }>();
    return request.user;
  },
);
