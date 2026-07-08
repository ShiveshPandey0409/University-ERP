import { Injectable, NotFoundException } from "@nestjs/common";
import type { DegreeCreate, DegreeQuery, DegreeUpdate, Paginated } from "@erp/shared";
import type { Prisma } from "@erp/db";
import { PrismaService } from "../../prisma/prisma.service.js";
import { skipTake, toPaginated } from "../../common/util/paginate.js";
import { setAuditBefore } from "../../common/context/audit-context.js";
import { refCode } from "../../common/util/ids.js";

const INCLUDE = {
  course: { select: { code: true, name: true } },
  academicSession: { select: { code: true, name: true } },
} satisfies Prisma.DegreeApplicationInclude;

@Injectable()
export class DegreeService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: DegreeQuery): Promise<Paginated<unknown>> {
    const where: Prisma.DegreeApplicationWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.courseId) where.courseId = query.courseId;
    if (query.search) {
      where.OR = [
        { applicationNo: { contains: query.search, mode: "insensitive" } },
        { studentName: { contains: query.search, mode: "insensitive" } },
        { enrollmentNo: { contains: query.search, mode: "insensitive" } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.degreeApplication.count({ where }),
      this.prisma.degreeApplication.findMany({
        where,
        include: INCLUDE,
        orderBy: { createdAt: "desc" },
        ...skipTake(query),
      }),
    ]);
    return toPaginated(data, total, query);
  }

  async get(id: string) {
    const d = await this.prisma.degreeApplication.findUnique({ where: { id }, include: INCLUDE });
    if (!d) throw new NotFoundException({ code: "NOT_FOUND", message: "Degree application not found" });
    return d;
  }

  create(input: DegreeCreate) {
    return this.prisma.degreeApplication.create({
      data: { ...input, applicationNo: input.applicationNo ?? refCode("DEG"), status: "applied" },
      include: INCLUDE,
    });
  }

  async update(id: string, input: DegreeUpdate) {
    setAuditBefore(await this.get(id));
    return this.prisma.degreeApplication.update({
      where: { id },
      data: input as Prisma.DegreeApplicationUncheckedUpdateInput,
      include: INCLUDE,
    });
  }

  async deliver(id: string, actorUserId: string) {
    setAuditBefore(await this.get(id));
    return this.prisma.degreeApplication.update({
      where: { id },
      data: { status: "delivered", deliveredBy: actorUserId, deliveredAt: new Date() },
      include: INCLUDE,
    });
  }

  /** Export = full filtered list without pagination (deliver register). */
  async export(query: DegreeQuery) {
    const where: Prisma.DegreeApplicationWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.courseId) where.courseId = query.courseId;
    const rows = await this.prisma.degreeApplication.findMany({
      where,
      include: INCLUDE,
      orderBy: { createdAt: "asc" },
      take: 5000,
    });
    return { total: rows.length, rows };
  }
}
