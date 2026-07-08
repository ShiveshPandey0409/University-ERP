import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import {
  examFormCreateSchema,
  examFormQuerySchema,
  examFormUpdateSchema,
  type ExamFormCreate,
  type ExamFormQuery,
} from "@erp/shared";
import { Permissions } from "../../common/decorators/permissions.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Audit } from "../../common/decorators/audit.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import type { AuthenticatedPrincipal } from "../../common/interfaces/authenticated-principal.interface.js";
import { ExamFormsService } from "./exam.service.js";

/** University-facing exam forms — full CRUD + verify/reject. */
@Controller("admin/exam/forms")
export class AdminExamController {
  constructor(private readonly exam: ExamFormsService) {}

  @Get()
  @Permissions("exam.form.read")
  list(
    @Query(new ZodValidationPipe(examFormQuerySchema)) query: ExamFormQuery,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.exam.list(query, actor.userId);
  }

  @Get(":id")
  @Permissions("exam.form.read")
  get(@Param("id") id: string, @CurrentUser() actor: AuthenticatedPrincipal) {
    return this.exam.get(id, actor.userId);
  }

  @Post()
  @Permissions("exam.form.manage")
  @Audit({ action: "exam.form.create", entityType: "exam_form" })
  create(
    @Body(new ZodValidationPipe(examFormCreateSchema)) body: ExamFormCreate,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.exam.create(body, actor.userId);
  }

  @Patch(":id")
  @Permissions("exam.form.manage")
  @Audit({ action: "exam.form.update", entityType: "exam_form" })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(examFormUpdateSchema)) body: Partial<ExamFormCreate>,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.exam.update(id, body, actor.userId);
  }

  @Delete(":id")
  @Permissions("exam.form.manage")
  @Audit({ action: "exam.form.delete", entityType: "exam_form" })
  remove(@Param("id") id: string, @CurrentUser() actor: AuthenticatedPrincipal) {
    return this.exam.remove(id, actor.userId);
  }

  @Post(":id/verify")
  @HttpCode(HttpStatus.OK)
  @Permissions("exam.form.verify")
  @Audit({ action: "exam.form.verify", entityType: "exam_form" })
  verify(@Param("id") id: string, @CurrentUser() actor: AuthenticatedPrincipal) {
    return this.exam.verify(id, actor.userId);
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  @Permissions("exam.form.reject")
  @Audit({ action: "exam.form.reject", entityType: "exam_form" })
  reject(@Param("id") id: string, @CurrentUser() actor: AuthenticatedPrincipal) {
    return this.exam.reject(id, actor.userId);
  }
}

/** College-facing exam forms — scoped list + verify/reject only. */
@Controller("college/exam/forms")
export class CollegeExamController {
  constructor(private readonly exam: ExamFormsService) {}

  @Get()
  @Permissions("exam.form.read")
  list(
    @Query(new ZodValidationPipe(examFormQuerySchema)) query: ExamFormQuery,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.exam.list(query, actor.userId);
  }

  @Post(":id/verify")
  @HttpCode(HttpStatus.OK)
  @Permissions("exam.form.verify")
  @Audit({ action: "exam.form.verify", entityType: "exam_form" })
  verify(@Param("id") id: string, @CurrentUser() actor: AuthenticatedPrincipal) {
    return this.exam.verify(id, actor.userId);
  }
}
