import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  assignRolesSchema,
  createUserSchema,
  paginationQuerySchema,
  updateUserSchema,
  type AssignRolesInput,
  type CreateUserInput,
  type PaginationQuery,
  type UpdateUserInput,
} from "@erp/shared";
import { Permissions } from "../../common/decorators/permissions.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { Audit } from "../../common/decorators/audit.decorator.js";
import type { AuthenticatedPrincipal } from "../../common/interfaces/authenticated-principal.interface.js";
import { UsersService } from "./users.service.js";

@Controller("admin/system/users")
@Permissions("system.user.manage")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {
    return this.users.list(query);
  }

  @Post()
  @Audit({ action: "system.user.create", entityType: "user" })
  create(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.users.create(body, actor.userId);
  }

  @Patch(":id")
  @Audit({ action: "system.user.update", entityType: "user" })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserInput,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.users.update(id, body, actor.userId);
  }

  @Post(":id/disable")
  @Audit({ action: "system.user.disable", entityType: "user" })
  disable(@Param("id") id: string, @CurrentUser() actor: AuthenticatedPrincipal) {
    return this.users.disable(id, actor.userId);
  }

  @Post(":id/roles")
  @Audit({ action: "system.user.assign_roles", entityType: "user" })
  assignRoles(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(assignRolesSchema)) body: AssignRolesInput,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.users.assignRoles(id, body, actor.userId);
  }
}
