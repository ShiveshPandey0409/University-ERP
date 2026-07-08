import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Paginated, StudentCreate, StudentQuery } from "@erp/shared";
import type { Prisma } from "@erp/db";
import { PrismaService } from "../../prisma/prisma.service.js";
import { ScopeService } from "../rbac/scope.service.js";
import { skipTake, toPaginated } from "../../common/util/paginate.js";
import { setAuditBefore } from "../../common/context/audit-context.js";

const STUDENT_INCLUDE = {
  college: { select: { name: true, code: true } },
  course: { select: { name: true, code: true } },
  academicSession: { select: { name: true, code: true } },
} satisfies Prisma.StudentInclude;

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  private async assertCollegeInScope(userId: string, collegeId: string): Promise<void> {
    const scopeCtx = await this.scope.getScopeContext(userId);
    const restricted = !scopeCtx.isGlobal && scopeCtx.collegeIds.length > 0;
    if (restricted && !scopeCtx.collegeIds.includes(collegeId)) {
      throw new ForbiddenException({ code: "OUT_OF_SCOPE", message: "College outside your scope" });
    }
  }

  async list(query: StudentQuery, userId: string): Promise<Paginated<unknown>> {
    const scopeCtx = await this.scope.getScopeContext(userId);
    const where: Prisma.StudentWhereInput = { deletedAt: null };

    if (query.courseId) where.courseId = query.courseId;
    if (query.academicSessionId) where.academicSessionId = query.academicSessionId;
    if (query.semester) where.currentSemester = query.semester;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { enrollmentNumber: { contains: query.search } },
      ];
    }

    const restricted = !scopeCtx.isGlobal && scopeCtx.collegeIds.length > 0;
    if (restricted) where.collegeId = { in: scopeCtx.collegeIds };
    else if (query.collegeId) where.collegeId = query.collegeId;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        include: STUDENT_INCLUDE,
        orderBy: { [query.sort ?? "enrollmentNumber"]: query.order },
        ...skipTake(query),
      }),
    ]);
    return toPaginated(data, total, query);
  }

  async get(id: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { id }, include: STUDENT_INCLUDE });
    if (!student || student.deletedAt) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Student not found" });
    }
    await this.assertCollegeInScope(userId, student.collegeId);
    return student;
  }

  async create(data: StudentCreate, userId: string) {
    await this.assertCollegeInScope(userId, data.collegeId);
    return this.prisma.student.create({
      data: {
        enrollmentNumber: data.enrollmentNumber,
        name: data.name,
        dob: data.dob ? new Date(data.dob) : null,
        gender: data.gender ?? null,
        category: data.category ?? null,
        collegeId: data.collegeId,
        programId: data.programId,
        courseId: data.courseId,
        academicSessionId: data.academicSessionId,
        currentSemester: data.currentSemester,
        status: data.status,
        createdBy: userId,
      },
      include: STUDENT_INCLUDE,
    });
  }

  async update(id: string, data: Partial<StudentCreate>, userId: string) {
    const before = await this.get(id, userId);
    setAuditBefore(before);
    if (data.collegeId) await this.assertCollegeInScope(userId, data.collegeId);
    return this.prisma.student.update({
      where: { id },
      data: {
        ...(data.enrollmentNumber !== undefined && { enrollmentNumber: data.enrollmentNumber }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.dob !== undefined && { dob: data.dob ? new Date(data.dob) : null }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.collegeId !== undefined && { collegeId: data.collegeId }),
        ...(data.programId !== undefined && { programId: data.programId }),
        ...(data.courseId !== undefined && { courseId: data.courseId }),
        ...(data.academicSessionId !== undefined && { academicSessionId: data.academicSessionId }),
        ...(data.currentSemester !== undefined && { currentSemester: data.currentSemester }),
        ...(data.status !== undefined && { status: data.status }),
        updatedBy: userId,
      },
      include: STUDENT_INCLUDE,
    });
  }

  /** Soft delete — students are referenced by exam forms and marks. */
  async remove(id: string, userId: string) {
    const before = await this.get(id, userId);
    setAuditBefore(before);
    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
    return { id, deleted: true };
  }
}
