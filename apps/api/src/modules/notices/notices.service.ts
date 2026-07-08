import { Injectable, NotFoundException } from "@nestjs/common";
import type { NoticeCreate, NoticeQuery, NoticeUpdate, Paginated } from "@erp/shared";
import type { Prisma } from "@erp/db";
import { PrismaService } from "../../prisma/prisma.service.js";
import { skipTake, toPaginated } from "../../common/util/paginate.js";
import { setAuditBefore } from "../../common/context/audit-context.js";

@Injectable()
export class NoticesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public notice board — published, not hidden, pinned first. */
  async listPublic() {
    return this.prisma.notice.findMany({
      where: { isPublished: true, hiddenAt: null },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      select: { id: true, title: true, body: true, category: true, pinned: true, publishedAt: true },
      take: 100,
    });
  }

  async list(query: NoticeQuery): Promise<Paginated<unknown>> {
    const where: Prisma.NoticeWhereInput = {};
    if (query.published !== undefined) where.isPublished = query.published;
    if (query.search) where.title = { contains: query.search, mode: "insensitive" };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.notice.count({ where }),
      this.prisma.notice.findMany({
        where,
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        ...skipTake(query),
      }),
    ]);
    return toPaginated(data, total, query);
  }

  async get(id: string) {
    const n = await this.prisma.notice.findUnique({ where: { id } });
    if (!n) throw new NotFoundException({ code: "NOT_FOUND", message: "Notice not found" });
    return n;
  }

  create(input: NoticeCreate, actorUserId: string) {
    return this.prisma.notice.create({ data: { ...input, createdBy: actorUserId } });
  }

  async update(id: string, input: NoticeUpdate) {
    setAuditBefore(await this.get(id));
    return this.prisma.notice.update({ where: { id }, data: input });
  }

  async publish(id: string) {
    const before = await this.get(id);
    setAuditBefore(before);
    return this.prisma.notice.update({
      where: { id },
      data: { isPublished: true, hiddenAt: null, publishedAt: before.publishedAt ?? new Date() },
    });
  }

  async hide(id: string) {
    setAuditBefore(await this.get(id));
    return this.prisma.notice.update({
      where: { id },
      data: { isPublished: false, hiddenAt: new Date() },
    });
  }

  async remove(id: string) {
    setAuditBefore(await this.get(id));
    await this.prisma.notice.delete({ where: { id } });
    return { id, deleted: true as const };
  }
}
