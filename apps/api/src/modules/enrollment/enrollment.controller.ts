import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import {
  enrollmentAllocateSchema,
  enrollmentCreateSchema,
  enrollmentQuerySchema,
  enrollmentRejectSchema,
  type EnrollmentAllocateInput,
  type EnrollmentCreate,
  type EnrollmentQuery,
  type EnrollmentRejectInput,
} from "@erp/shared";
import { Permissions } from "../../common/decorators/permissions.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Audit } from "../../common/decorators/audit.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import type { AuthenticatedPrincipal } from "../../common/interfaces/authenticated-principal.interface.js";
import { EnrollmentService } from "./enrollment.service.js";

@Controller("admin/enrollment/forms")
export class EnrollmentController {
  constructor(private readonly enrollment: EnrollmentService) {}

  @Get()
  @Permissions("enrollment.form.read")
  list(@Query(new ZodValidationPipe(enrollmentQuerySchema)) query: EnrollmentQuery) {
    return this.enrollment.list(query);
  }

  @Get(":id")
  @Permissions("enrollment.form.read")
  get(@Param("id") id: string) {
    return this.enrollment.get(id);
  }

  @Post()
  @Permissions("enrollment.form.verify")
  @Audit({ action: "enrollment.form.create", entityType: "enrollment_form" })
  create(@Body(new ZodValidationPipe(enrollmentCreateSchema)) body: EnrollmentCreate) {
    return this.enrollment.create(body);
  }

  @Post(":id/verify")
  @HttpCode(HttpStatus.OK)
  @Permissions("enrollment.form.verify")
  @Audit({ action: "enrollment.form.verify", entityType: "enrollment_form" })
  verify(@Param("id") id: string, @CurrentUser() actor: AuthenticatedPrincipal) {
    return this.enrollment.verify(id, actor.userId);
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  @Permissions("enrollment.form.reject")
  @Audit({ action: "enrollment.form.reject", entityType: "enrollment_form" })
  reject(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(enrollmentRejectSchema)) body: EnrollmentRejectInput,
  ) {
    return this.enrollment.reject(id, body.reason);
  }

  @Post(":id/allocate-number")
  @HttpCode(HttpStatus.OK)
  @Permissions("enrollment.number.allocate")
  @Audit({ action: "enrollment.number.allocate", entityType: "enrollment_form" })
  allocate(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(enrollmentAllocateSchema)) body: EnrollmentAllocateInput,
  ) {
    return this.enrollment.allocateNumber(id, body.enrollmentNumber);
  }
}
