import { Injectable } from "@nestjs/common";
import type {
  AcademicSessionQuery,
  CollegeQuery,
  CourseQuery,
  DepartmentQuery,
  ExamSessionQuery,
  FacultyQuery,
  ProgramQuery,
  SubjectQuery,
} from "@erp/shared";
import { PrismaService } from "../../prisma/prisma.service.js";
import { BaseCrudService, type CrudDelegate } from "../../common/crud/base-crud.service.js";

const asDelegate = (d: unknown) => d as CrudDelegate;

@Injectable()
export class FacultyService extends BaseCrudService<FacultyQuery> {
  protected readonly delegate: CrudDelegate;
  protected override readonly searchFields = ["name", "code"];
  protected override readonly sortableFields = ["name", "code", "createdAt"];
  protected override readonly defaultSort = "code";
  constructor(private readonly prisma: PrismaService) {
    super();
    this.delegate = asDelegate(prisma.faculty);
  }
}

@Injectable()
export class CollegeService extends BaseCrudService<CollegeQuery> {
  protected readonly delegate: CrudDelegate;
  protected override readonly searchFields = ["name", "code"];
  protected override readonly sortableFields = ["name", "code", "createdAt"];
  protected override readonly defaultSort = "code";
  protected override readonly include = { faculty: { select: { name: true, code: true } } };
  constructor(private readonly prisma: PrismaService) {
    super();
    this.delegate = asDelegate(prisma.college);
  }
  protected override buildWhere(q: CollegeQuery): Record<string, unknown> {
    const where = super.buildWhere(q);
    if (q.facultyId) where.facultyId = q.facultyId;
    if (q.isActive !== undefined) where.isActive = q.isActive;
    return where;
  }
}

@Injectable()
export class DepartmentService extends BaseCrudService<DepartmentQuery> {
  protected readonly delegate: CrudDelegate;
  protected override readonly searchFields = ["name", "code"];
  protected override readonly sortableFields = ["name", "code", "createdAt"];
  protected override readonly defaultSort = "code";
  protected override readonly include = { faculty: { select: { name: true, code: true } } };
  constructor(private readonly prisma: PrismaService) {
    super();
    this.delegate = asDelegate(prisma.department);
  }
  protected override buildWhere(q: DepartmentQuery): Record<string, unknown> {
    const where = super.buildWhere(q);
    if (q.facultyId) where.facultyId = q.facultyId;
    return where;
  }
}

@Injectable()
export class ProgramService extends BaseCrudService<ProgramQuery> {
  protected readonly delegate: CrudDelegate;
  protected override readonly searchFields = ["name", "code"];
  protected override readonly sortableFields = ["name", "code", "level", "createdAt"];
  protected override readonly defaultSort = "code";
  protected override readonly include = {
    department: { select: { name: true, code: true } },
    faculty: { select: { name: true, code: true } },
  };
  constructor(private readonly prisma: PrismaService) {
    super();
    this.delegate = asDelegate(prisma.program);
  }
  protected override buildWhere(q: ProgramQuery): Record<string, unknown> {
    const where = super.buildWhere(q);
    if (q.level) where.level = q.level;
    if (q.departmentId) where.departmentId = q.departmentId;
    if (q.facultyId) where.facultyId = q.facultyId;
    return where;
  }
}

@Injectable()
export class CourseService extends BaseCrudService<CourseQuery> {
  protected readonly delegate: CrudDelegate;
  protected override readonly searchFields = ["name", "code"];
  protected override readonly sortableFields = ["name", "code", "createdAt"];
  protected override readonly defaultSort = "code";
  protected override readonly include = {
    program: { select: { name: true, code: true, level: true } },
  };
  constructor(private readonly prisma: PrismaService) {
    super();
    this.delegate = asDelegate(prisma.course);
  }
  protected override buildWhere(q: CourseQuery): Record<string, unknown> {
    const where = super.buildWhere(q);
    if (q.programId) where.programId = q.programId;
    return where;
  }
}

@Injectable()
export class SubjectService extends BaseCrudService<SubjectQuery> {
  protected readonly delegate: CrudDelegate;
  protected override readonly searchFields = ["name", "code"];
  protected override readonly sortableFields = ["name", "code", "type", "createdAt"];
  protected override readonly defaultSort = "code";
  constructor(private readonly prisma: PrismaService) {
    super();
    this.delegate = asDelegate(prisma.subject);
  }
  protected override buildWhere(q: SubjectQuery): Record<string, unknown> {
    const where = super.buildWhere(q);
    if (q.type) where.type = q.type;
    return where;
  }
}

@Injectable()
export class AcademicSessionService extends BaseCrudService<AcademicSessionQuery> {
  protected readonly delegate: CrudDelegate;
  protected override readonly searchFields = ["name", "code"];
  protected override readonly sortableFields = ["name", "code", "createdAt"];
  protected override readonly defaultSort = "code";
  constructor(private readonly prisma: PrismaService) {
    super();
    this.delegate = asDelegate(prisma.academicSession);
  }
  protected override buildWhere(q: AcademicSessionQuery): Record<string, unknown> {
    const where = super.buildWhere(q);
    if (q.isCurrent !== undefined) where.isCurrent = q.isCurrent;
    return where;
  }
}

@Injectable()
export class ExamSessionService extends BaseCrudService<ExamSessionQuery> {
  protected readonly delegate: CrudDelegate;
  protected override readonly searchFields = ["name", "code"];
  protected override readonly sortableFields = ["name", "code", "createdAt"];
  protected override readonly defaultSort = "code";
  protected override readonly include = {
    academicSession: { select: { name: true, code: true } },
  };
  constructor(private readonly prisma: PrismaService) {
    super();
    this.delegate = asDelegate(prisma.examSession);
  }
  protected override buildWhere(q: ExamSessionQuery): Record<string, unknown> {
    const where = super.buildWhere(q);
    if (q.academicSessionId) where.academicSessionId = q.academicSessionId;
    if (q.isOpen !== undefined) where.isOpen = q.isOpen;
    return where;
  }
}
