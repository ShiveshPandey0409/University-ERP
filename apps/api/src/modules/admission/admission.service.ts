import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdmissionQuery,
  AdmissionRegisterInput,
  AdmissionUpdate,
  MeritGenerateInput,
  Paginated,
} from "@erp/shared";
import type { Prisma } from "@erp/db";
import { PrismaService } from "../../prisma/prisma.service.js";
import { skipTake, toPaginated } from "../../common/util/paginate.js";
import { setAuditBefore } from "../../common/context/audit-context.js";
import { refCode } from "../../common/util/ids.js";

const INCLUDE = {
  course: { select: { code: true, name: true } },
  academicSession: { select: { code: true, name: true } },
} satisfies Prisma.AdmissionApplicationInclude;

@Injectable()
export class AdmissionService {
  constructor(private readonly prisma: PrismaService) {}

  private toData(input: AdmissionRegisterInput | AdmissionUpdate): Prisma.AdmissionApplicationUncheckedUpdateInput {
    const { dob, ...rest } = input;
    return { ...rest, ...(dob ? { dob: new Date(dob) } : {}) };
  }

  /** Public applicant registration. */
  async register(input: AdmissionRegisterInput) {
    const app = await this.prisma.admissionApplication.create({
      data: {
        ...this.toData(input),
        applicationNo: refCode("ADM"),
        status: "pending",
      } as Prisma.AdmissionApplicationUncheckedCreateInput,
      select: { applicationNo: true, status: true, admissionType: true },
    });
    return { ...app, message: "Application registered. Note your application number." };
  }

  async list(query: AdmissionQuery): Promise<Paginated<unknown>> {
    const where: Prisma.AdmissionApplicationWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.admissionType) where.admissionType = query.admissionType;
    if (query.courseId) where.courseId = query.courseId;
    if (query.academicSessionId) where.academicSessionId = query.academicSessionId;
    if (query.search) {
      where.OR = [
        { applicationNo: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
        { mobile: { contains: query.search } },
      ];
    }
    const [total, data] = await this.prisma.$transaction([
      this.prisma.admissionApplication.count({ where }),
      this.prisma.admissionApplication.findMany({
        where,
        include: INCLUDE,
        orderBy: query.sort === "meritRank" ? { meritRank: query.order } : { createdAt: "desc" },
        ...skipTake(query),
      }),
    ]);
    return toPaginated(data, total, query);
  }

  async get(id: string) {
    const app = await this.prisma.admissionApplication.findUnique({ where: { id }, include: INCLUDE });
    if (!app) throw new NotFoundException({ code: "NOT_FOUND", message: "Application not found" });
    return app;
  }

  create(input: AdmissionRegisterInput) {
    return this.prisma.admissionApplication.create({
      data: {
        ...this.toData(input),
        applicationNo: refCode("ADM"),
        status: "pending",
      } as Prisma.AdmissionApplicationUncheckedCreateInput,
      include: INCLUDE,
    });
  }

  async update(id: string, input: AdmissionUpdate) {
    setAuditBefore(await this.get(id));
    return this.prisma.admissionApplication.update({
      where: { id },
      data: this.toData(input),
      include: INCLUDE,
    });
  }

  async verify(id: string, actorUserId: string) {
    setAuditBefore(await this.get(id));
    return this.prisma.admissionApplication.update({
      where: { id },
      data: { status: "verified", verifiedBy: actorUserId, verifiedAt: new Date(), deficiencyNote: null },
      include: INCLUDE,
    });
  }

  async markDeficiency(id: string, note: string) {
    setAuditBefore(await this.get(id));
    return this.prisma.admissionApplication.update({
      where: { id },
      data: { status: "deficiency", deficiencyNote: note },
      include: INCLUDE,
    });
  }

  async reject(id: string, reason?: string) {
    setAuditBefore(await this.get(id));
    return this.prisma.admissionApplication.update({
      where: { id },
      data: { status: "rejected", deficiencyNote: reason ?? null },
      include: INCLUDE,
    });
  }

  /** Rank verified applications by merit score (desc); assign meritRank 1..n.
   * Separate permission from verify (separation of duties). */
  async generateMerit(input: MeritGenerateInput) {
    const where: Prisma.AdmissionApplicationWhereInput = { status: "verified" };
    if (input.courseId) where.courseId = input.courseId;
    if (input.academicSessionId) where.academicSessionId = input.academicSessionId;
    if (input.admissionRound) where.admissionRound = input.admissionRound;

    const apps = await this.prisma.admissionApplication.findMany({
      where,
      orderBy: [{ meritScore: "desc" }, { createdAt: "asc" }],
      select: { id: true, meritScore: true },
    });

    await this.prisma.$transaction(
      apps.map((a, i) =>
        this.prisma.admissionApplication.update({ where: { id: a.id }, data: { meritRank: i + 1 } }),
      ),
    );
    return { ranked: apps.length };
  }

  /** Post-admission dashboard: counts by status. */
  async dashboard(academicSessionId?: string) {
    const where: Prisma.AdmissionApplicationWhereInput = academicSessionId ? { academicSessionId } : {};
    const grouped = await this.prisma.admissionApplication.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });
    const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
    return { counts, total: grouped.reduce((s, g) => s + g._count._all, 0) };
  }

  async approveSubjectSelection(id: string) {
    setAuditBefore(await this.get(id));
    return this.prisma.admissionApplication.update({
      where: { id },
      data: { status: "admitted" },
      include: INCLUDE,
    });
  }

  async approveCancellation(id: string) {
    setAuditBefore(await this.get(id));
    return this.prisma.admissionApplication.update({
      where: { id },
      data: { status: "cancelled" },
      include: INCLUDE,
    });
  }
}
