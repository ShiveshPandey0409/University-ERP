import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { EnrollmentCreate, EnrollmentQuery, Paginated } from "@erp/shared";
import type { Prisma } from "@erp/db";
import { PrismaService } from "../../prisma/prisma.service.js";
import { skipTake, toPaginated } from "../../common/util/paginate.js";
import { setAuditBefore } from "../../common/context/audit-context.js";

const INCLUDE = {
  course: { select: { code: true, name: true } },
  academicSession: { select: { code: true, name: true } },
} satisfies Prisma.EnrollmentFormInclude;

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: EnrollmentQuery): Promise<Paginated<unknown>> {
    const where: Prisma.EnrollmentFormWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.courseId) where.courseId = query.courseId;
    if (query.academicSessionId) where.academicSessionId = query.academicSessionId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { enrollmentNumber: { contains: query.search, mode: "insensitive" } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.enrollmentForm.count({ where }),
      this.prisma.enrollmentForm.findMany({
        where,
        include: INCLUDE,
        orderBy: { createdAt: "desc" },
        ...skipTake(query),
      }),
    ]);
    return toPaginated(data, total, query);
  }

  async get(id: string) {
    const f = await this.prisma.enrollmentForm.findUnique({ where: { id }, include: INCLUDE });
    if (!f) throw new NotFoundException({ code: "NOT_FOUND", message: "Enrollment form not found" });
    return f;
  }

  create(input: EnrollmentCreate) {
    return this.prisma.enrollmentForm.create({ data: { ...input, status: "pending" }, include: INCLUDE });
  }

  async verify(id: string, actorUserId: string) {
    setAuditBefore(await this.get(id));
    return this.prisma.enrollmentForm.update({
      where: { id },
      data: { status: "verified", verifiedBy: actorUserId, verifiedAt: new Date(), rejectedReason: null },
      include: INCLUDE,
    });
  }

  async reject(id: string, reason?: string) {
    setAuditBefore(await this.get(id));
    return this.prisma.enrollmentForm.update({
      where: { id },
      data: { status: "rejected", rejectedReason: reason ?? null },
      include: INCLUDE,
    });
  }

  /** Allocate an enrollment number — only for verified forms; number is unique. */
  async allocateNumber(id: string, enrollmentNumber: string) {
    const before = await this.get(id);
    if (before.status !== "verified") {
      throw new ConflictException({ code: "NOT_VERIFIED", message: "Form must be verified first" });
    }
    const clash = await this.prisma.enrollmentForm.findUnique({ where: { enrollmentNumber } });
    if (clash && clash.id !== id) {
      throw new ConflictException({ code: "DUPLICATE", message: "Enrollment number already allocated" });
    }
    setAuditBefore(before);
    return this.prisma.enrollmentForm.update({ where: { id }, data: { enrollmentNumber }, include: INCLUDE });
  }
}
