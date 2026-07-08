import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  FeeTransactionQuery,
  Paginated,
  RftIssueInput,
  RftQuery,
  RftUpdateInput,
} from "@erp/shared";
import type { Prisma } from "@erp/db";
import { PrismaService } from "../../prisma/prisma.service.js";
import { skipTake, toPaginated } from "../../common/util/paginate.js";
import { setAuditBefore } from "../../common/context/audit-context.js";
import { refCode } from "../../common/util/ids.js";

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Fee transactions (read + dashboard) ---

  async listTransactions(query: FeeTransactionQuery): Promise<Paginated<unknown>> {
    const where: Prisma.FeeTransactionWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { orderNo: { contains: query.search, mode: "insensitive" } },
        { enrollmentNo: { contains: query.search, mode: "insensitive" } },
        { studentName: { contains: query.search, mode: "insensitive" } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.feeTransaction.count({ where }),
      this.prisma.feeTransaction.findMany({ where, orderBy: { txnDate: "desc" }, ...skipTake(query) }),
    ]);
    return toPaginated(data, total, query);
  }

  /** Dashboard: transaction count + total amount per fees type. */
  async dashboard() {
    const grouped = await this.prisma.feeTransaction.groupBy({
      by: ["feesFor"],
      where: { status: "paid" },
      _count: { _all: true },
      _sum: { amount: true },
    });
    return grouped.map((g) => ({
      feesFor: g.feesFor,
      count: g._count._all,
      amount: g._sum.amount ? Number(g._sum.amount) : 0,
    }));
  }

  // --- RFT (refund) ---

  async listRft(query: RftQuery): Promise<Paginated<unknown>> {
    const where: Prisma.RftRequestWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { rftNo: { contains: query.search, mode: "insensitive" } },
        { enrollmentNo: { contains: query.search, mode: "insensitive" } },
        { studentName: { contains: query.search, mode: "insensitive" } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.rftRequest.count({ where }),
      this.prisma.rftRequest.findMany({ where, orderBy: { issuedAt: "desc" }, ...skipTake(query) }),
    ]);
    return toPaginated(data, total, query);
  }

  async getRft(id: string) {
    const rft = await this.prisma.rftRequest.findUnique({
      where: { id },
      include: { feeTransaction: true },
    });
    if (!rft) throw new NotFoundException({ code: "NOT_FOUND", message: "RFT not found" });
    return rft;
  }

  issueRft(input: RftIssueInput, actorUserId: string) {
    return this.prisma.rftRequest.create({
      data: { ...input, rftNo: refCode("RFT"), status: "issued", issuedBy: actorUserId },
    });
  }

  async updateRft(id: string, input: RftUpdateInput) {
    setAuditBefore(await this.getRft(id));
    return this.prisma.rftRequest.update({ where: { id }, data: input });
  }

  /** Print view — marks the RFT printed and returns a print-friendly payload. */
  async printRft(id: string) {
    const rft = await this.getRft(id);
    if (rft.status === "issued") {
      await this.prisma.rftRequest.update({ where: { id }, data: { status: "printed" } });
    }
    return {
      rftNo: rft.rftNo,
      enrollmentNo: rft.enrollmentNo,
      studentName: rft.studentName,
      amount: Number(rft.amount),
      reason: rft.reason,
      bankDetails: rft.bankDetails,
      issuedAt: rft.issuedAt,
      status: "printed",
    };
  }
}
