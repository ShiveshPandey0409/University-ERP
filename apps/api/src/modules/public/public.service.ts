import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

export interface ResultSearchResult {
  found: boolean;
  student?: { name: string; enrollmentNumber: string; course: string };
  rollNumber?: string;
  examSession?: string;
  marks?: { subject: string; code: string; total: number | null; max: number | null; grade: string | null }[];
}

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished() {
    return this.prisma.resultPublication.findMany({
      where: { status: "published" },
      select: {
        id: true,
        semester: true,
        resultType: true,
        publishedAt: true,
        course: { select: { name: true, code: true } },
        examSession: { select: { name: true, code: true } },
      },
      orderBy: { publishedAt: "desc" },
    });
  }

  /** Public result lookup by enrollment + roll number. Only returns marks for
   * results that have been PUBLISHED. */
  async searchResult(enrollmentNumber: string, rollNumber: string): Promise<ResultSearchResult> {
    const student = await this.prisma.student.findUnique({
      where: { enrollmentNumber },
      include: { course: { select: { name: true } } },
    });
    if (!student) return { found: false };

    const form = await this.prisma.examForm.findFirst({
      where: { studentId: student.id, rollNumber },
    });
    if (!form) return { found: false };

    const publication = await this.prisma.resultPublication.findFirst({
      where: {
        examSessionId: form.examSessionId,
        courseId: form.courseId,
        semester: form.semester,
        status: "published",
      },
      include: { examSession: { select: { name: true } } },
    });
    if (!publication) return { found: false };

    const entries = await this.prisma.marksEntry.findMany({
      where: {
        studentId: student.id,
        batch: { examSessionId: form.examSessionId, semester: form.semester },
      },
      include: { batch: { include: { subject: { select: { name: true, code: true } } } } },
    });

    return {
      found: true,
      student: {
        name: student.name,
        enrollmentNumber: student.enrollmentNumber,
        course: student.course.name,
      },
      rollNumber,
      examSession: publication.examSession.name,
      marks: entries.map((e) => ({
        subject: e.batch.subject.name,
        code: e.batch.subject.code,
        total: e.totalMarks ? Number(e.totalMarks) : null,
        max: e.maxMarks ? Number(e.maxMarks) : null,
        grade: e.grade,
      })),
    };
  }
}
