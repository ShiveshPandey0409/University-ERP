import { Module } from "@nestjs/common";
import {
  academicSessionCreateSchema,
  academicSessionQuerySchema,
  academicSessionUpdateSchema,
  collegeCreateSchema,
  collegeQuerySchema,
  collegeUpdateSchema,
  courseCreateSchema,
  courseQuerySchema,
  courseUpdateSchema,
  departmentCreateSchema,
  departmentQuerySchema,
  departmentUpdateSchema,
  examSessionCreateSchema,
  examSessionQuerySchema,
  examSessionUpdateSchema,
  facultyCreateSchema,
  facultyQuerySchema,
  facultyUpdateSchema,
  programCreateSchema,
  programQuerySchema,
  programUpdateSchema,
  subjectCreateSchema,
  subjectQuerySchema,
  subjectUpdateSchema,
} from "@erp/shared";
import { createCrudController } from "../../common/crud/crud-controller.factory.js";
import {
  AcademicSessionService,
  CollegeService,
  CourseService,
  DepartmentService,
  ExamSessionService,
  FacultyService,
  ProgramService,
  SubjectService,
} from "./master-data.services.js";

const controllers = [
  createCrudController(
    {
      path: "admin/master/faculties",
      permission: "masterdata.faculty.manage",
      entityType: "faculty",
      querySchema: facultyQuerySchema,
      createSchema: facultyCreateSchema,
      updateSchema: facultyUpdateSchema,
    },
    FacultyService,
  ),
  createCrudController(
    {
      path: "admin/master/colleges",
      permission: "masterdata.college.manage",
      entityType: "college",
      querySchema: collegeQuerySchema,
      createSchema: collegeCreateSchema,
      updateSchema: collegeUpdateSchema,
    },
    CollegeService,
  ),
  createCrudController(
    {
      path: "admin/master/departments",
      permission: "masterdata.department.manage",
      entityType: "department",
      querySchema: departmentQuerySchema,
      createSchema: departmentCreateSchema,
      updateSchema: departmentUpdateSchema,
    },
    DepartmentService,
  ),
  createCrudController(
    {
      path: "admin/master/programs",
      permission: "masterdata.program.manage",
      entityType: "program",
      querySchema: programQuerySchema,
      createSchema: programCreateSchema,
      updateSchema: programUpdateSchema,
    },
    ProgramService,
  ),
  createCrudController(
    {
      path: "admin/master/courses",
      permission: "masterdata.course.manage",
      entityType: "course",
      querySchema: courseQuerySchema,
      createSchema: courseCreateSchema,
      updateSchema: courseUpdateSchema,
    },
    CourseService,
  ),
  createCrudController(
    {
      path: "admin/master/subjects",
      permission: "masterdata.subject.manage",
      entityType: "subject",
      querySchema: subjectQuerySchema,
      createSchema: subjectCreateSchema,
      updateSchema: subjectUpdateSchema,
    },
    SubjectService,
  ),
  createCrudController(
    {
      path: "admin/master/academic-sessions",
      permission: "masterdata.session.manage",
      entityType: "academic_session",
      querySchema: academicSessionQuerySchema,
      createSchema: academicSessionCreateSchema,
      updateSchema: academicSessionUpdateSchema,
    },
    AcademicSessionService,
  ),
  createCrudController(
    {
      path: "admin/master/exam-sessions",
      permission: "masterdata.session.manage",
      entityType: "exam_session",
      querySchema: examSessionQuerySchema,
      createSchema: examSessionCreateSchema,
      updateSchema: examSessionUpdateSchema,
    },
    ExamSessionService,
  ),
];

@Module({
  controllers,
  providers: [
    FacultyService,
    CollegeService,
    DepartmentService,
    ProgramService,
    CourseService,
    SubjectService,
    AcademicSessionService,
    ExamSessionService,
  ],
})
export class MasterDataModule {}
