import { Injectable, NotFoundException } from "@nestjs/common";
import type { MarksBatchCreate, MarksBatchQuery, Paginated } from "@erp/shared";
import type { Prisma } from "@erp/db";
import { PrismaService } from "../../prisma/prisma.service.js";
import { skipTake, toPaginated } from "../../common/util/paginate.js";
import { setAuditBefore } from "../../common/context/audit-context.js";

const BATCH_INCLUDE = {
  examSession: { select: { code: true, name: true } },
  course: { select: { code: true, name: true } },
  subject: { select: { code: true, name: true } },
} satisfies Prisma.MarksBatchInclude;

@Injectable()
export class MarksBatchService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: MarksBatchQuery): Promise<Paginated<unknown>> {
    const where: Prisma.MarksBatchWhereInput = {};
    if (query.examSessionId) where.examSessionId = query.examSessionId;
    if (query.courseId) where.courseId = query.courseId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.status) where.status = query.status;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.marksBatch.count({ where }),
      this.prisma.marksBatch.findMany({
        where,
        include: BATCH_INCLUDE,
        orderBy: { createdAt: query.order },
        ...skipTake(query),
      }),
    ]);
    return toPaginated(data, total, query);
  }

  async get(id: string) {
    const batch = await this.prisma.marksBatch.findUnique({ where: { id }, include: BATCH_INCLUDE });
    if (!batch) throw new NotFoundException({ code: "NOT_FOUND", message: "Batch not found" });
    return batch;
  }

  async create(data: MarksBatchCreate, actorId: string) {
    return this.prisma.marksBatch.create({
      data: { ...data, createdBy: actorId },
      include: BATCH_INCLUDE,
    });
  }

  async update(id: string, data: { status: MarksBatchCreate["status"] }) {
    const before = await this.get(id);
    setAuditBefore(before);
    return this.prisma.marksBatch.update({ where: { id }, data, include: BATCH_INCLUDE });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.marksBatch.delete({ where: { id } });
    return { id, deleted: true };
  }
}
