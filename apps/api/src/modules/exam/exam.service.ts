import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { ExamFormCreate, ExamFormQuery, Paginated } from "@erp/shared";
import type { Prisma } from "@erp/db";
import { PrismaService } from "../../prisma/prisma.service.js";
import { ScopeService } from "../rbac/scope.service.js";
import { skipTake, toPaginated } from "../../common/util/paginate.js";
import { setAuditBefore } from "../../common/context/audit-context.js";

const FORM_INCLUDE = {
  student: { select: { name: true, enrollmentNumber: true } },
  course: { select: { code: true, name: true } },
  college: { select: { code: true, name: true } },
  examSession: { select: { code: true, name: true } },
} satisfies Prisma.ExamFormInclude;

@Injectable()
export class ExamFormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
  ) {}

  private async collegeFilter(userId: string): Promise<string[] | null> {
    const ctx = await this.scope.getScopeContext(userId);
    return !ctx.isGlobal && ctx.collegeIds.length > 0 ? ctx.collegeIds : null;
  }

  private async assertScope(userId: string, collegeId: string): Promise<void> {
    const scoped = await this.collegeFilter(userId);
    if (scoped && !scoped.includes(collegeId)) {
      throw new ForbiddenException({ code: "OUT_OF_SCOPE", message: "College outside your scope" });
    }
  }

  async list(query: ExamFormQuery, userId: string): Promise<Paginated<unknown>> {
    const where: Prisma.ExamFormWhereInput = {};
    if (query.examSessionId) where.examSessionId = query.examSessionId;
    if (query.courseId) where.courseId = query.courseId;
    if (query.status) where.status = query.status;
    if (query.studentType) where.studentType = query.studentType;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.search) {
      where.OR = [
        { rollNumber: { contains: query.search } },
        { student: { enrollmentNumber: { contains: query.search } } },
        { student: { name: { contains: query.search, mode: "insensitive" } } },
      ];
    }
    const scoped = await this.collegeFilter(userId);
    if (scoped) where.collegeId = { in: scoped };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.examForm.count({ where }),
      this.prisma.examForm.findMany({
        where,
        include: FORM_INCLUDE,
        orderBy: { rollNumber: query.order },
        ...skipTake(query),
      }),
    ]);
    return toPaginated(data, total, query);
  }

  async get(id: string, userId: string) {
    const form = await this.prisma.examForm.findUnique({ where: { id }, include: FORM_INCLUDE });
    if (!form) throw new NotFoundException({ code: "NOT_FOUND", message: "Exam form not found" });
    await this.assertScope(userId, form.collegeId);
    return form;
  }

  async create(data: ExamFormCreate, userId: string) {
    await this.assertScope(userId, data.collegeId);
    const form = await this.prisma.examForm.create({ data, include: FORM_INCLUDE });
    await this.addHistory(form.id, null, data.status ?? "applied", userId);
    return form;
  }

  async update(id: string, data: Partial<ExamFormCreate>, userId: string) {
    const before = await this.get(id, userId);
    setAuditBefore(before);
    if (data.collegeId) await this.assertScope(userId, data.collegeId);
    const updated = await this.prisma.examForm.update({ where: { id }, data, include: FORM_INCLUDE });
    if (data.status && data.status !== before.status) {
      await this.addHistory(id, before.status, data.status, userId);
    }
    return updated;
  }

  async remove(id: string, userId: string) {
    await this.get(id, userId);
    await this.prisma.examForm.delete({ where: { id } });
    return { id, deleted: true };
  }

  verify(id: string, userId: string) {
    return this.setStatus(id, "verified", userId);
  }
  reject(id: string, userId: string) {
    return this.setStatus(id, "rejected", userId);
  }

  private async setStatus(id: string, status: "verified" | "rejected", userId: string) {
    const before = await this.get(id, userId);
    setAuditBefore(before);
    const updated = await this.prisma.examForm.update({
      where: { id },
      data: { status, verifiedBy: userId, verifiedAt: new Date() },
      include: FORM_INCLUDE,
    });
    await this.addHistory(id, before.status, status, userId);
    return updated;
  }

  private async addHistory(
    examFormId: string,
    fromStatus: "draft" | "applied" | "verified" | "rejected" | null,
    toStatus: "draft" | "applied" | "verified" | "rejected",
    actorUserId: string,
  ): Promise<void> {
    await this.prisma.examFormStatusHistory.create({
      data: { examFormId, fromStatus, toStatus, actorUserId },
    });
  }
}
