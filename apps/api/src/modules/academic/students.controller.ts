import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  studentCreateSchema,
  studentQuerySchema,
  studentUpdateSchema,
  type StudentCreate,
  type StudentQuery,
} from "@erp/shared";
import { Permissions } from "../../common/decorators/permissions.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Audit } from "../../common/decorators/audit.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import type { AuthenticatedPrincipal } from "../../common/interfaces/authenticated-principal.interface.js";
import { StudentsService } from "./students.service.js";

@Controller("admin/academic/students")
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  @Permissions("academic.student.read")
  list(
    @Query(new ZodValidationPipe(studentQuerySchema)) query: StudentQuery,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.students.list(query, actor.userId);
  }

  @Get(":id")
  @Permissions("academic.student.read")
  get(@Param("id") id: string, @CurrentUser() actor: AuthenticatedPrincipal) {
    return this.students.get(id, actor.userId);
  }

  @Post()
  @Permissions("academic.student.manage")
  @Audit({ action: "academic.student.create", entityType: "student" })
  create(
    @Body(new ZodValidationPipe(studentCreateSchema)) body: StudentCreate,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.students.create(body, actor.userId);
  }

  @Patch(":id")
  @Permissions("academic.student.manage")
  @Audit({ action: "academic.student.update", entityType: "student" })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(studentUpdateSchema)) body: Partial<StudentCreate>,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.students.update(id, body, actor.userId);
  }

  @Delete(":id")
  @Permissions("academic.student.manage")
  @Audit({ action: "academic.student.delete", entityType: "student" })
  remove(@Param("id") id: string, @CurrentUser() actor: AuthenticatedPrincipal) {
    return this.students.remove(id, actor.userId);
  }
}
