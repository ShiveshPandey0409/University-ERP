import { Injectable, NotFoundException } from "@nestjs/common";
import type { PublicationTargetInput } from "@erp/shared";
import { PrismaService } from "../../prisma/prisma.service.js";

const uniqueWhere = (t: PublicationTargetInput) => ({
  examSessionId_courseId_semester_resultType: {
    examSessionId: t.examSessionId,
    courseId: t.courseId,
    semester: t.semester,
    resultType: t.resultType,
  },
});

/**
 * Result publication state machine: draft → pending_approval → published.
 * Separation of duties is enforced at the controller (submit requires
 * marks.entry.write; approve requires the distinct result.publication.approve).
 */
@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitForApproval(target: PublicationTargetInput, actorId: string) {
    return this.prisma.resultPublication.upsert({
      where: uniqueWhere(target),
      update: { status: "pending_approval", submittedBy: actorId },
      create: {
        examSessionId: target.examSessionId,
        courseId: target.courseId,
        semester: target.semester,
        resultType: target.resultType,
        status: "pending_approval",
        submittedBy: actorId,
      },
    });
  }

  async approveAndPublish(target: PublicationTargetInput, actorId: string) {
    const existing = await this.prisma.resultPublication.findUnique({ where: uniqueWhere(target) });
    if (!existing) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "No submission to approve" });
    }
    return this.prisma.resultPublication.update({
      where: uniqueWhere(target),
      data: { status: "published", approvedBy: actorId, publishedAt: new Date() },
    });
  }

  async listPublications() {
    return this.prisma.resultPublication.findMany({
      include: {
        course: { select: { name: true, code: true } },
        examSession: { select: { name: true, code: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }
}
