import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  GrievanceAssignInput,
  GrievanceQuery,
  GrievanceRegisterInput,
  GrievanceReplyInput,
  Paginated,
} from "@erp/shared";
import type { Prisma } from "@erp/db";
import { PrismaService } from "../../prisma/prisma.service.js";
import { skipTake, toPaginated } from "../../common/util/paginate.js";
import { setAuditBefore } from "../../common/context/audit-context.js";
import { refCode } from "../../common/util/ids.js";

@Injectable()
export class GrievanceService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Public ---

  async register(input: GrievanceRegisterInput) {
    const grievance = await this.prisma.grievance.create({
      data: { ...input, ticketNo: refCode("GRV"), status: "open" },
      select: { ticketNo: true, status: true, createdAt: true },
    });
    return { ...grievance, message: "Complaint registered. Save your ticket number to track it." };
  }

  async searchByTicket(ticketNo: string) {
    const g = await this.prisma.grievance.findUnique({
      where: { ticketNo },
      include: {
        replies: {
          where: { isPublic: true },
          orderBy: { createdAt: "asc" },
          select: { message: true, createdAt: true },
        },
      },
    });
    if (!g) return { found: false as const };
    return {
      found: true as const,
      ticketNo: g.ticketNo,
      category: g.category,
      status: g.status,
      subject: g.subject,
      createdAt: g.createdAt,
      replies: g.replies,
    };
  }

  // --- Admin ---

  async list(query: GrievanceQuery): Promise<Paginated<unknown>> {
    const where: Prisma.GrievanceWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { ticketNo: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
        { enrollmentNo: { contains: query.search, mode: "insensitive" } },
        { mobile: { contains: query.search } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.grievance.count({ where }),
      this.prisma.grievance.findMany({
        where,
        orderBy: { createdAt: query.sort === "createdAt" ? query.order : "desc" },
        ...skipTake(query),
      }),
    ]);
    return toPaginated(data, total, query);
  }

  async get(id: string) {
    const g = await this.prisma.grievance.findUnique({
      where: { id },
      include: { replies: { orderBy: { createdAt: "asc" } } },
    });
    if (!g) throw new NotFoundException({ code: "NOT_FOUND", message: "Grievance not found" });
    return g;
  }

  async assign(id: string, input: GrievanceAssignInput) {
    const before = await this.get(id);
    setAuditBefore(before);
    return this.prisma.grievance.update({
      where: { id },
      data: {
        assignedTo: input.assignedTo,
        assignedAt: new Date(),
        status: before.status === "closed" ? before.status : "assigned",
      },
    });
  }

  async reply(id: string, input: GrievanceReplyInput, actorUserId: string) {
    const before = await this.get(id);
    setAuditBefore(before);
    await this.prisma.grievanceReply.create({
      data: { grievanceId: id, authorUserId: actorUserId, message: input.message, isPublic: input.isPublic },
    });
    return this.prisma.grievance.update({
      where: { id },
      data: { status: before.status === "closed" ? before.status : "replied" },
      include: { replies: { orderBy: { createdAt: "asc" } } },
    });
  }

  async close(id: string) {
    const before = await this.get(id);
    setAuditBefore(before);
    return this.prisma.grievance.update({
      where: { id },
      data: { status: "closed", closedAt: new Date() },
    });
  }
}
