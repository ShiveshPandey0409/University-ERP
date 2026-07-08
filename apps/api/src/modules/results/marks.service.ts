import { Injectable } from "@nestjs/common";
import type { MarksEntryUpsertInput } from "@erp/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { setAuditEntityId } from "../../common/context/audit-context.js";

@Injectable()
export class MarksService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertEntry(input: MarksEntryUpsertInput, actorId: string) {
    const total =
      (input.cceMarks ?? 0) +
      (input.theoryMarks ?? 0) +
      (input.practicalMarks ?? 0) +
      (input.projectMarks ?? 0);

    const entry = await this.prisma.marksEntry.upsert({
      where: { batchId_studentId: { batchId: input.batchId, studentId: input.studentId } },
      update: {
        cceMarks: input.cceMarks,
        theoryMarks: input.theoryMarks,
        practicalMarks: input.practicalMarks,
        projectMarks: input.projectMarks,
        totalMarks: total,
        maxMarks: input.maxMarks,
        status: "entered",
        updatedAt: new Date(),
      },
      create: {
        batchId: input.batchId,
        studentId: input.studentId,
        cceMarks: input.cceMarks,
        theoryMarks: input.theoryMarks,
        practicalMarks: input.practicalMarks,
        projectMarks: input.projectMarks,
        totalMarks: total,
        maxMarks: input.maxMarks,
        status: "entered",
        createdBy: actorId,
      },
    });
    setAuditEntityId(entry.id);
    return entry;
  }

  async listBatchEntries(batchId: string) {
    return this.prisma.marksEntry.findMany({
      where: { batchId },
      include: { student: { select: { name: true, enrollmentNumber: true } } },
      orderBy: { student: { enrollmentNumber: "asc" } },
    });
  }
}
