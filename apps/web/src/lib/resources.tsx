import type { ResourceConfig } from "@/components/ResourceManager";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const PROGRAM_LEVELS = [
  { value: "ug", label: "UG" },
  { value: "pg", label: "PG" },
  { value: "phd", label: "PhD" },
  { value: "diploma", label: "Diploma" },
];

const SUBJECT_TYPES = [
  { value: "theory", label: "Theory" },
  { value: "practical", label: "Practical" },
  { value: "cce", label: "CCE" },
  { value: "project", label: "Project" },
];

const code = { key: "code", label: "Code", type: "text" as const, required: true, editable: false };
const name = { key: "name", label: "Name", type: "text" as const, required: true };

export const facultiesConfig: ResourceConfig<Row> = {
  title: "Faculties",
  endpoint: "/admin/master/faculties",
  columns: [
    { header: "Code", cell: (r) => r.code },
    { header: "Name", cell: (r) => r.name },
  ],
  fields: [code, name],
};

export const collegesConfig: ResourceConfig<Row> = {
  title: "Colleges",
  endpoint: "/admin/master/colleges",
  columns: [
    { header: "Code", cell: (r) => r.code },
    { header: "Name", cell: (r) => r.name },
    { header: "Faculty", cell: (r) => r.faculty?.name ?? "—" },
    { header: "Active", cell: (r) => (r.isActive ? "Yes" : "No") },
  ],
  fields: [
    code,
    name,
    { key: "facultyId", label: "Faculty", type: "select", optionsEndpoint: "/admin/master/faculties" },
    { key: "isActive", label: "Active", type: "checkbox", defaultValue: true },
  ],
  filters: [
    { key: "facultyId", label: "Faculty", type: "select", optionsEndpoint: "/admin/master/faculties" },
    { key: "isActive", label: "Active", type: "boolean" },
  ],
};

export const departmentsConfig: ResourceConfig<Row> = {
  title: "Departments",
  endpoint: "/admin/master/departments",
  columns: [
    { header: "Code", cell: (r) => r.code },
    { header: "Name", cell: (r) => r.name },
    { header: "Faculty", cell: (r) => r.faculty?.name ?? "—" },
  ],
  fields: [
    code,
    name,
    { key: "facultyId", label: "Faculty", type: "select", optionsEndpoint: "/admin/master/faculties" },
  ],
  filters: [
    { key: "facultyId", label: "Faculty", type: "select", optionsEndpoint: "/admin/master/faculties" },
  ],
};

export const programsConfig: ResourceConfig<Row> = {
  title: "Programs",
  endpoint: "/admin/master/programs",
  columns: [
    { header: "Code", cell: (r) => r.code },
    { header: "Name", cell: (r) => r.name },
    { header: "Level", cell: (r) => String(r.level).toUpperCase() },
    { header: "Department", cell: (r) => r.department?.name ?? "—" },
  ],
  fields: [
    code,
    name,
    { key: "level", label: "Level", type: "select", required: true, options: PROGRAM_LEVELS },
    { key: "departmentId", label: "Department", type: "select", optionsEndpoint: "/admin/master/departments" },
    { key: "facultyId", label: "Faculty", type: "select", optionsEndpoint: "/admin/master/faculties" },
  ],
  filters: [
    { key: "level", label: "Level", type: "select", options: PROGRAM_LEVELS },
    { key: "departmentId", label: "Department", type: "select", optionsEndpoint: "/admin/master/departments" },
  ],
};

export const coursesConfig: ResourceConfig<Row> = {
  title: "Courses",
  endpoint: "/admin/master/courses",
  columns: [
    { header: "Code", cell: (r) => r.code },
    { header: "Name", cell: (r) => r.name },
    { header: "Program", cell: (r) => r.program?.name ?? "—" },
    { header: "Semesters", cell: (r) => r.totalSemesters },
  ],
  fields: [
    code,
    name,
    { key: "programId", label: "Program", type: "select", required: true, optionsEndpoint: "/admin/master/programs" },
    { key: "durationYears", label: "Duration (years)", type: "number", defaultValue: 3 },
    { key: "totalSemesters", label: "Total semesters", type: "number", defaultValue: 6 },
  ],
  filters: [
    { key: "programId", label: "Program", type: "select", optionsEndpoint: "/admin/master/programs" },
  ],
};

export const subjectsConfig: ResourceConfig<Row> = {
  title: "Subjects",
  endpoint: "/admin/master/subjects",
  columns: [
    { header: "Code", cell: (r) => r.code },
    { header: "Name", cell: (r) => r.name },
    { header: "Type", cell: (r) => r.type },
    { header: "Max", cell: (r) => r.maxMarks },
  ],
  fields: [
    code,
    name,
    { key: "type", label: "Type", type: "select", options: SUBJECT_TYPES, defaultValue: "theory" },
    { key: "credits", label: "Credits", type: "number", defaultValue: 4 },
    { key: "maxMarks", label: "Max marks", type: "number", defaultValue: 100 },
  ],
  filters: [{ key: "type", label: "Type", type: "select", options: SUBJECT_TYPES }],
};

export const academicSessionsConfig: ResourceConfig<Row> = {
  title: "Academic Sessions",
  endpoint: "/admin/master/academic-sessions",
  columns: [
    { header: "Code", cell: (r) => r.code },
    { header: "Name", cell: (r) => r.name },
    { header: "Current", cell: (r) => (r.isCurrent ? "Yes" : "No") },
  ],
  fields: [code, name, { key: "isCurrent", label: "Current", type: "checkbox", defaultValue: false }],
  filters: [{ key: "isCurrent", label: "Current", type: "boolean" }],
};

export const examSessionsConfig: ResourceConfig<Row> = {
  title: "Exam Sessions",
  endpoint: "/admin/master/exam-sessions",
  columns: [
    { header: "Code", cell: (r) => r.code },
    { header: "Name", cell: (r) => r.name },
    { header: "Academic Session", cell: (r) => r.academicSession?.name ?? "—" },
    { header: "Open", cell: (r) => (r.isOpen ? "Yes" : "No") },
  ],
  fields: [
    code,
    name,
    {
      key: "academicSessionId",
      label: "Academic Session",
      type: "select",
      required: true,
      optionsEndpoint: "/admin/master/academic-sessions",
    },
    { key: "isOpen", label: "Open", type: "checkbox", defaultValue: false },
  ],
  filters: [
    {
      key: "academicSessionId",
      label: "Academic Session",
      type: "select",
      optionsEndpoint: "/admin/master/academic-sessions",
    },
    { key: "isOpen", label: "Open", type: "boolean" },
  ],
};

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const STUDENT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
  { value: "passed_out", label: "Passed out" },
  { value: "suspended", label: "Suspended" },
];
const EXAM_STUDENT_TYPES = [
  { value: "regular", label: "Regular" },
  { value: "private", label: "Private" },
  { value: "ex_regular", label: "Ex-regular" },
  { value: "atkt", label: "ATKT" },
  { value: "supplementary", label: "Supplementary" },
];
const EXAM_FORM_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "applied", label: "Applied" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];
const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];
const BATCH_STATUSES = [
  { value: "open", label: "Open" },
  { value: "submitted", label: "Submitted" },
  { value: "locked", label: "Locked" },
];

export const studentsConfig: ResourceConfig<Row> = {
  title: "Students",
  endpoint: "/admin/academic/students",
  columns: [
    { header: "Enrollment", cell: (r) => r.enrollmentNumber },
    { header: "Name", cell: (r) => r.name },
    { header: "Course", cell: (r) => r.course?.code ?? "—" },
    { header: "College", cell: (r) => r.college?.name ?? "—" },
    { header: "Sem", cell: (r) => r.currentSemester },
    { header: "Status", cell: (r) => r.status },
  ],
  fields: [
    { key: "enrollmentNumber", label: "Enrollment No.", type: "text", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "dob", label: "Date of birth", type: "text" },
    { key: "gender", label: "Gender", type: "select", options: GENDERS },
    { key: "category", label: "Category", type: "text" },
    { key: "collegeId", label: "College", type: "select", required: true, optionsEndpoint: "/admin/master/colleges" },
    { key: "programId", label: "Program", type: "select", required: true, optionsEndpoint: "/admin/master/programs" },
    { key: "courseId", label: "Course", type: "select", required: true, optionsEndpoint: "/admin/master/courses" },
    { key: "academicSessionId", label: "Academic Session", type: "select", required: true, optionsEndpoint: "/admin/master/academic-sessions" },
    { key: "currentSemester", label: "Current semester", type: "number", defaultValue: 1 },
    { key: "status", label: "Status", type: "select", options: STUDENT_STATUSES, defaultValue: "active" },
  ],
  filters: [
    { key: "collegeId", label: "College", type: "select", optionsEndpoint: "/admin/master/colleges" },
    { key: "courseId", label: "Course", type: "select", optionsEndpoint: "/admin/master/courses" },
    { key: "status", label: "Status", type: "select", options: STUDENT_STATUSES },
  ],
};

export const examFormsConfig: ResourceConfig<Row> = {
  title: "Exam Forms",
  endpoint: "/admin/exam/forms",
  columns: [
    { header: "Roll", cell: (r) => r.rollNumber ?? "—" },
    { header: "Student", cell: (r) => r.student?.name ?? "—" },
    { header: "Enrollment", cell: (r) => r.student?.enrollmentNumber ?? "—" },
    { header: "Course", cell: (r) => r.course?.code ?? "—" },
    { header: "Status", cell: (r) => r.status },
    { header: "Payment", cell: (r) => r.paymentStatus },
  ],
  fields: [
    { key: "studentId", label: "Student", type: "select", required: true, optionsEndpoint: "/admin/academic/students" },
    { key: "examSessionId", label: "Exam Session", type: "select", required: true, optionsEndpoint: "/admin/master/exam-sessions" },
    { key: "courseId", label: "Course", type: "select", required: true, optionsEndpoint: "/admin/master/courses" },
    { key: "collegeId", label: "College", type: "select", required: true, optionsEndpoint: "/admin/master/colleges" },
    { key: "semester", label: "Semester", type: "number", required: true, defaultValue: 1 },
    { key: "rollNumber", label: "Roll number", type: "text" },
    { key: "studentType", label: "Student type", type: "select", options: EXAM_STUDENT_TYPES, defaultValue: "regular" },
    { key: "status", label: "Status", type: "select", options: EXAM_FORM_STATUSES, defaultValue: "applied" },
    { key: "paymentStatus", label: "Payment status", type: "select", options: PAYMENT_STATUSES, defaultValue: "pending" },
  ],
  filters: [
    { key: "examSessionId", label: "Exam Session", type: "select", optionsEndpoint: "/admin/master/exam-sessions" },
    { key: "status", label: "Status", type: "select", options: EXAM_FORM_STATUSES },
    { key: "paymentStatus", label: "Payment", type: "select", options: PAYMENT_STATUSES },
  ],
};

export const marksBatchesConfig: ResourceConfig<Row> = {
  title: "Marks Batches",
  endpoint: "/admin/marks/batches",
  columns: [
    { header: "Exam Session", cell: (r) => r.examSession?.code ?? "—" },
    { header: "Course", cell: (r) => r.course?.code ?? "—" },
    { header: "Subject", cell: (r) => r.subject?.code ?? "—" },
    { header: "Sem", cell: (r) => r.semester },
    { header: "Status", cell: (r) => r.status },
  ],
  fields: [
    { key: "examSessionId", label: "Exam Session", type: "select", required: true, optionsEndpoint: "/admin/master/exam-sessions" },
    { key: "courseId", label: "Course", type: "select", required: true, optionsEndpoint: "/admin/master/courses" },
    { key: "subjectId", label: "Subject", type: "select", required: true, optionsEndpoint: "/admin/master/subjects" },
    { key: "semester", label: "Semester", type: "number", required: true, defaultValue: 1 },
    { key: "status", label: "Status", type: "select", options: BATCH_STATUSES, defaultValue: "open" },
  ],
  filters: [
    { key: "examSessionId", label: "Exam Session", type: "select", optionsEndpoint: "/admin/master/exam-sessions" },
    { key: "courseId", label: "Course", type: "select", optionsEndpoint: "/admin/master/courses" },
    { key: "status", label: "Status", type: "select", options: BATCH_STATUSES },
  ],
};

// ===========================================================================
// Milestone 2 modules: notices, grievance, admission, enrollment, fees, degree
// ===========================================================================

const GRIEVANCE_STATUSES = [
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "replied", label: "Replied" },
  { value: "closed", label: "Closed" },
];
const GRIEVANCE_CATEGORIES = [
  { value: "admission_form", label: "Admission Form" },
  { value: "admission_payment", label: "Admission Payment" },
  { value: "admitcard_withheld", label: "AdmitCard Withheld" },
  { value: "result", label: "Result" },
  { value: "degree", label: "Degree" },
  { value: "marksheet", label: "Marksheet" },
  { value: "other", label: "Others" },
];
const ADMISSION_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "deficiency", label: "Deficiency" },
  { value: "rejected", label: "Rejected" },
  { value: "admitted", label: "Admitted" },
  { value: "cancelled", label: "Cancelled" },
];
const ADMISSION_TYPES = [
  { value: "regular", label: "Regular" },
  { value: "private", label: "Private" },
  { value: "phd", label: "PhD" },
  { value: "agriculture", label: "Agriculture" },
];
const ENROLLMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];
const RFT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "printed", label: "Printed" },
  { value: "cancelled", label: "Cancelled" },
];
const DEGREE_STATUSES = [
  { value: "applied", label: "Applied" },
  { value: "approved", label: "Approved" },
  { value: "printed", label: "Printed" },
  { value: "delivered", label: "Delivered" },
];

export const noticesConfig: ResourceConfig<Row> = {
  title: "Notices",
  endpoint: "/admin/notices",
  columns: [
    { header: "Title", cell: (r) => r.title },
    { header: "Category", cell: (r) => r.category ?? "—" },
    { header: "Pinned", cell: (r) => (r.pinned ? "Yes" : "No") },
    { header: "Published", cell: (r) => (r.isPublished ? "Yes" : "No") },
  ],
  fields: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "body", label: "Body", type: "text", required: true },
    { key: "category", label: "Category", type: "text" },
    { key: "pinned", label: "Pinned", type: "checkbox", defaultValue: false },
  ],
  filters: [{ key: "published", label: "Published", type: "boolean" }],
  rowActions: [
    { label: "Publish", path: (r) => `/admin/notices/${r.id}/publish`, hidden: (r) => Boolean(r.isPublished) },
    { label: "Hide", path: (r) => `/admin/notices/${r.id}/hide`, hidden: (r) => !r.isPublished },
  ],
};

export const grievancesConfig: ResourceConfig<Row> = {
  title: "Grievances",
  endpoint: "/admin/grievance",
  readOnly: true,
  columns: [
    { header: "Ticket", cell: (r) => r.ticketNo },
    { header: "Category", cell: (r) => r.category },
    { header: "Name", cell: (r) => r.name },
    { header: "Mobile", cell: (r) => r.mobile },
    { header: "Status", cell: (r) => r.status },
  ],
  fields: [],
  filters: [
    { key: "status", label: "Status", type: "select", options: GRIEVANCE_STATUSES },
    { key: "category", label: "Category", type: "select", options: GRIEVANCE_CATEGORIES },
  ],
  rowActions: [
    { label: "Assign", path: (r) => `/admin/grievance/${r.id}/assign`, prompt: { field: "assignedTo", label: "Assign to user id (UUID)" } },
    { label: "Reply", path: (r) => `/admin/grievance/${r.id}/reply`, prompt: { field: "message", label: "Reply message (public)" } },
    { label: "Close", path: (r) => `/admin/grievance/${r.id}/close`, confirm: "Close this grievance?" },
  ],
};

export const admissionsConfig: ResourceConfig<Row> = {
  title: "Admission Applications",
  endpoint: "/admin/admission/applications",
  readOnly: true,
  columns: [
    { header: "Appl. No.", cell: (r) => r.applicationNo },
    { header: "Name", cell: (r) => r.name },
    { header: "Type", cell: (r) => r.admissionType },
    { header: "Course", cell: (r) => r.course?.code ?? "—" },
    { header: "Merit", cell: (r) => r.meritRank ?? "—" },
    { header: "Status", cell: (r) => r.status },
  ],
  fields: [],
  filters: [
    { key: "status", label: "Status", type: "select", options: ADMISSION_STATUSES },
    { key: "admissionType", label: "Type", type: "select", options: ADMISSION_TYPES },
    { key: "courseId", label: "Course", type: "select", optionsEndpoint: "/admin/master/courses" },
  ],
  rowActions: [
    { label: "Verify", path: (r) => `/admin/admission/applications/${r.id}/verify`, hidden: (r) => r.status !== "pending" && r.status !== "deficiency" },
    { label: "Deficiency", path: (r) => `/admin/admission/applications/${r.id}/deficiency`, prompt: { field: "note", label: "Deficiency note" } },
    { label: "Reject", path: (r) => `/admin/admission/applications/${r.id}/reject`, prompt: { field: "reason", label: "Reject reason (optional)" } },
  ],
};

export const enrollmentsConfig: ResourceConfig<Row> = {
  title: "Enrollment Forms",
  endpoint: "/admin/enrollment/forms",
  noDelete: true,
  columns: [
    { header: "Name", cell: (r) => r.name },
    { header: "Course", cell: (r) => r.course?.code ?? "—" },
    { header: "Enrollment No.", cell: (r) => r.enrollmentNumber ?? "—" },
    { header: "Status", cell: (r) => r.status },
  ],
  fields: [
    { key: "name", label: "Candidate Name", type: "text", required: true },
    { key: "mobile", label: "Mobile", type: "text" },
    { key: "courseId", label: "Course", type: "select", optionsEndpoint: "/admin/master/courses" },
    { key: "academicSessionId", label: "Academic Session", type: "select", optionsEndpoint: "/admin/master/academic-sessions" },
  ],
  filters: [
    { key: "status", label: "Status", type: "select", options: ENROLLMENT_STATUSES },
    { key: "courseId", label: "Course", type: "select", optionsEndpoint: "/admin/master/courses" },
  ],
  rowActions: [
    { label: "Verify", path: (r) => `/admin/enrollment/forms/${r.id}/verify`, hidden: (r) => r.status === "verified" },
    { label: "Reject", path: (r) => `/admin/enrollment/forms/${r.id}/reject`, prompt: { field: "reason", label: "Reject reason (optional)" } },
    { label: "Allocate No.", path: (r) => `/admin/enrollment/forms/${r.id}/allocate-number`, prompt: { field: "enrollmentNumber", label: "Enrollment number" }, hidden: (r) => r.status !== "verified" },
  ],
};

export const feesRftConfig: ResourceConfig<Row> = {
  title: "Refunds (RFT)",
  endpoint: "/admin/fees/rft",
  noDelete: true,
  columns: [
    { header: "RFT No.", cell: (r) => r.rftNo },
    { header: "Enrollment No.", cell: (r) => r.enrollmentNo ?? "—" },
    { header: "Student", cell: (r) => r.studentName ?? "—" },
    { header: "Amount", cell: (r) => r.amount },
    { header: "Status", cell: (r) => r.status },
  ],
  fields: [
    { key: "enrollmentNo", label: "Enrollment No.", type: "text" },
    { key: "studentName", label: "Student Name", type: "text" },
    { key: "amount", label: "Amount", type: "number", required: true },
    { key: "reason", label: "Reason", type: "text" },
    { key: "bankDetails", label: "Bank Details", type: "text" },
  ],
  filters: [{ key: "status", label: "Status", type: "select", options: RFT_STATUSES }],
};

export const degreesConfig: ResourceConfig<Row> = {
  title: "Degree Applications",
  endpoint: "/admin/degree/applications",
  noDelete: true,
  columns: [
    { header: "Appl. No.", cell: (r) => r.applicationNo },
    { header: "Student", cell: (r) => r.studentName },
    { header: "Course", cell: (r) => r.course?.code ?? "—" },
    { header: "Convocation", cell: (r) => r.convocationYear ?? "—" },
    { header: "Status", cell: (r) => r.status },
  ],
  fields: [
    { key: "studentName", label: "Student Name", type: "text", required: true },
    { key: "enrollmentNo", label: "Enrollment No.", type: "text" },
    { key: "courseId", label: "Course", type: "select", optionsEndpoint: "/admin/master/courses" },
    { key: "convocationYear", label: "Convocation Year", type: "number" },
  ],
  filters: [
    { key: "status", label: "Status", type: "select", options: DEGREE_STATUSES },
    { key: "courseId", label: "Course", type: "select", optionsEndpoint: "/admin/master/courses" },
  ],
  rowActions: [
    { label: "Deliver", path: (r) => `/admin/degree/applications/${r.id}/deliver`, confirm: "Mark degree delivered?", hidden: (r) => r.status === "delivered" },
  ],
};
