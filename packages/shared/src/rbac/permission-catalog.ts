import type { RoleKey } from "../enums/role-keys.js";

/**
 * Canonical permission catalog. Permission keys follow `module.resource.action`.
 * This is the single source of truth imported by BOTH the API RBAC service and
 * the DB seed, so seeded roles and runtime authorization can never drift.
 *
 * Permissions may exist before their endpoints do — later milestones wire the
 * endpoints; the roles are already meaningful today.
 */

// --- System / identity ---
const SYSTEM = [
  "system.user.manage",
  "system.role.manage",
  "system.permission.read",
  "system.session.manage",
] as const;

const AUDIT = ["audit.log.read"] as const;

// --- Master data ---
const MASTERDATA = [
  "masterdata.session.manage",
  "masterdata.college.manage",
  "masterdata.department.manage",
  "masterdata.faculty.manage",
  "masterdata.program.manage",
  "masterdata.course.manage",
  "masterdata.subject.manage",
  "masterdata.scheme.manage",
] as const;

// --- Academic ---
const ACADEMIC = [
  "academic.student.read",
  "academic.student.manage",
  "academic.student.export",
  "academic.scheme.approve",
  "academic.scheme.remove",
  "academic.subjectselection.read",
] as const;

// --- Examination ---
const EXAM = [
  "exam.dashboard.read",
  "exam.form.read",
  "exam.form.manage",
  "exam.form.verify",
  "exam.form.reject",
  "exam.details.write",
] as const;

// --- Marks / results ---
const MARKS = [
  "marks.batch.read",
  "marks.batch.write",
  "marks.entry.write",
  "marks.entry.import",
  "marks.correction.approve",
  "marks.withheld.clear",
  "marks.rvrt.read",
] as const;

const RESULT = ["result.publication.read", "result.publication.approve"] as const;

// --- Admission (endpoints land in a later milestone; roles need them now) ---
const ADMISSION = [
  "admission.application.read",
  "admission.application.verify",
  "admission.application.mark-deficiency",
  "admission.application.reject",
  "admission.merit.generate",
  "admission.verificationuser.manage",
  "admission.postadm.read",
  "admission.subjectselection.approve",
  "admission.cancellation.approve",
] as const;

// --- Enrollment ---
const ENROLLMENT = [
  "enrollment.form.read",
  "enrollment.form.verify",
  "enrollment.form.reject",
  "enrollment.number.allocate",
] as const;

// --- Fees / RFT ---
const FEES = [
  "fees.transaction.read",
  "fees.master.write",
  "fees.rft.issue",
  "fees.rft.edit",
  "fees.rft.print",
  "fees.report.export",
] as const;

// --- Grievance / degree / notices ---
const GRIEVANCE = [
  "grievance.complaint.read",
  "grievance.complaint.assign",
  "grievance.complaint.reply",
  "grievance.complaint.close",
] as const;

const DEGREE = [
  "degree.application.read",
  "degree.application.deliver",
  "degree.application.export",
] as const;

const NOTICE = [
  "notice.item.read",
  "notice.item.write",
  "notice.item.publish",
  "notice.item.hide",
] as const;

// --- Self-service (student / applicant portals) ---
const SELF = [
  "student.profile.read",
  "student.document.read",
  "applicant.profile.read",
] as const;

export const PERMISSIONS = [
  ...SYSTEM,
  ...AUDIT,
  ...MASTERDATA,
  ...ACADEMIC,
  ...EXAM,
  ...MARKS,
  ...RESULT,
  ...ADMISSION,
  ...ENROLLMENT,
  ...FEES,
  ...GRIEVANCE,
  ...DEGREE,
  ...NOTICE,
  ...SELF,
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

/**
 * Role → permissions. `"*"` grants the whole catalog (super_admin only).
 * Separation-of-duties invariants encoded here:
 *  - admission_verifier can verify but NOT generate merit lists.
 *  - marks_admin can enter/correct marks but NOT approve result publication.
 *  - college_* roles get only scoped module permissions (scope enforced separately).
 */
export const ROLE_PERMISSIONS: Record<RoleKey, readonly PermissionKey[] | "*"> = {
  super_admin: "*",

  university_admin: [
    ...MASTERDATA,
    ...ACADEMIC,
    ...EXAM,
    ...MARKS,
    ...RESULT,
    ...ENROLLMENT,
    ...GRIEVANCE,
    ...DEGREE,
    ...NOTICE,
    "admission.application.read",
    "admission.postadm.read",
    "audit.log.read",
    "system.permission.read",
  ],

  admission_admin: [...ADMISSION, "masterdata.session.manage", "audit.log.read"],

  // Can verify, mark deficiency, reject — but NOT generate merit (SoD).
  admission_verifier: [
    "admission.application.read",
    "admission.application.verify",
    "admission.application.mark-deficiency",
    "admission.application.reject",
  ],

  enrollment_admin: [...ENROLLMENT, "academic.student.read"],

  academic_admin: [...ACADEMIC],

  exam_admin: [...EXAM, "marks.batch.read", "result.publication.read", "result.publication.approve"],

  // Enter/correct marks but NOT approve publication (SoD).
  marks_admin: [
    "marks.batch.read",
    "marks.batch.write",
    "marks.entry.write",
    "marks.entry.import",
    "marks.correction.approve",
    "marks.withheld.clear",
    "marks.rvrt.read",
    "result.publication.read",
  ],

  finance_admin: [...FEES],

  grievance_admin: [...GRIEVANCE],

  notice_admin: [...NOTICE],

  college_admin: [
    "exam.dashboard.read",
    "exam.form.read",
    "exam.form.verify",
    "marks.batch.read",
    "marks.entry.write",
    "marks.entry.import",
  ],

  college_exam_operator: ["exam.dashboard.read", "exam.form.read", "exam.form.verify"],

  college_marks_operator: ["marks.batch.read", "marks.entry.write", "marks.entry.import"],

  student: ["student.profile.read", "student.document.read"],

  applicant: ["applicant.profile.read"],
};
