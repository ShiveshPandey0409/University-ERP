import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import {
  degreeCreateSchema,
  degreeQuerySchema,
  degreeUpdateSchema,
  type DegreeCreate,
  type DegreeQuery,
  type DegreeUpdate,
} from "@erp/shared";
import { Permissions } from "../../common/decorators/permissions.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Audit } from "../../common/decorators/audit.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import type { AuthenticatedPrincipal } from "../../common/interfaces/authenticated-principal.interface.js";
import { DegreeService } from "./degree.service.js";

@Controller("admin/degree/applications")
export class DegreeController {
  constructor(private readonly degree: DegreeService) {}

  @Get("export")
  @Permissions("degree.application.export")
  export(@Query(new ZodValidationPipe(degreeQuerySchema)) query: DegreeQuery) {
    return this.degree.export(query);
  }

  @Get()
  @Permissions("degree.application.read")
  list(@Query(new ZodValidationPipe(degreeQuerySchema)) query: DegreeQuery) {
    return this.degree.list(query);
  }

  @Get(":id")
  @Permissions("degree.application.read")
  get(@Param("id") id: string) {
    return this.degree.get(id);
  }

  @Post()
  @Permissions("degree.application.deliver")
  @Audit({ action: "degree.application.create", entityType: "degree_application" })
  create(@Body(new ZodValidationPipe(degreeCreateSchema)) body: DegreeCreate) {
    return this.degree.create(body);
  }

  @Patch(":id")
  @Permissions("degree.application.deliver")
  @Audit({ action: "degree.application.update", entityType: "degree_application" })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(degreeUpdateSchema)) body: DegreeUpdate,
  ) {
    return this.degree.update(id, body);
  }

  @Post(":id/deliver")
  @HttpCode(HttpStatus.OK)
  @Permissions("degree.application.deliver")
  @Audit({ action: "degree.application.deliver", entityType: "degree_application" })
  deliver(@Param("id") id: string, @CurrentUser() actor: AuthenticatedPrincipal) {
    return this.degree.deliver(id, actor.userId);
  }
}
