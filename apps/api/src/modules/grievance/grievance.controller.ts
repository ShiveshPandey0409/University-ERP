import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import {
  grievanceAssignSchema,
  grievanceQuerySchema,
  grievanceRegisterSchema,
  grievanceReplySchema,
  grievanceSearchSchema,
  type GrievanceAssignInput,
  type GrievanceQuery,
  type GrievanceRegisterInput,
  type GrievanceReplyInput,
  type GrievanceSearchInput,
} from "@erp/shared";
import { Public } from "../../common/decorators/public.decorator.js";
import { Permissions } from "../../common/decorators/permissions.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Audit } from "../../common/decorators/audit.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import type { AuthenticatedPrincipal } from "../../common/interfaces/authenticated-principal.interface.js";
import { GrievanceService } from "./grievance.service.js";

/** Public complaint portal — register + track by ticket. */
@Controller("public/grievance")
export class PublicGrievanceController {
  constructor(private readonly grievance: GrievanceService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("register")
  register(@Body(new ZodValidationPipe(grievanceRegisterSchema)) body: GrievanceRegisterInput) {
    return this.grievance.register(body);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("search")
  search(@Body(new ZodValidationPipe(grievanceSearchSchema)) body: GrievanceSearchInput) {
    return this.grievance.searchByTicket(body.ticketNo);
  }
}

/** University grievance manager. */
@Controller("admin/grievance")
export class AdminGrievanceController {
  constructor(private readonly grievance: GrievanceService) {}

  @Get()
  @Permissions("grievance.complaint.read")
  list(@Query(new ZodValidationPipe(grievanceQuerySchema)) query: GrievanceQuery) {
    return this.grievance.list(query);
  }

  @Get(":id")
  @Permissions("grievance.complaint.read")
  get(@Param("id") id: string) {
    return this.grievance.get(id);
  }

  @Post(":id/assign")
  @HttpCode(HttpStatus.OK)
  @Permissions("grievance.complaint.assign")
  @Audit({ action: "grievance.complaint.assign", entityType: "grievance" })
  assign(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(grievanceAssignSchema)) body: GrievanceAssignInput,
  ) {
    return this.grievance.assign(id, body);
  }

  @Post(":id/reply")
  @HttpCode(HttpStatus.OK)
  @Permissions("grievance.complaint.reply")
  @Audit({ action: "grievance.complaint.reply", entityType: "grievance" })
  reply(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(grievanceReplySchema)) body: GrievanceReplyInput,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.grievance.reply(id, body, actor.userId);
  }

  @Post(":id/close")
  @HttpCode(HttpStatus.OK)
  @Permissions("grievance.complaint.close")
  @Audit({ action: "grievance.complaint.close", entityType: "grievance" })
  close(@Param("id") id: string) {
    return this.grievance.close(id);
  }
}
