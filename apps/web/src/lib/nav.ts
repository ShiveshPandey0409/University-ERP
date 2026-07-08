export interface NavItem {
  label: string;
  href: string;
  permission?: string;
}

/** Admin nav. Items are filtered by the user's permissions (UX only — the API
 * remains the enforcement boundary). */
export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Faculties", href: "/admin/master/faculties", permission: "masterdata.faculty.manage" },
  { label: "Colleges", href: "/admin/master/colleges", permission: "masterdata.college.manage" },
  { label: "Departments", href: "/admin/master/departments", permission: "masterdata.department.manage" },
  { label: "Programs", href: "/admin/master/programs", permission: "masterdata.program.manage" },
  { label: "Courses", href: "/admin/master/courses", permission: "masterdata.course.manage" },
  { label: "Subjects", href: "/admin/master/subjects", permission: "masterdata.subject.manage" },
  { label: "Academic Sessions", href: "/admin/master/academic-sessions", permission: "masterdata.session.manage" },
  { label: "Exam Sessions", href: "/admin/master/exam-sessions", permission: "masterdata.session.manage" },
  { label: "Students", href: "/admin/academic/students", permission: "academic.student.read" },
  { label: "Admissions", href: "/admin/admission/applications", permission: "admission.application.read" },
  { label: "Enrollment", href: "/admin/enrollment/forms", permission: "enrollment.form.read" },
  { label: "Exam Forms", href: "/admin/exam/forms", permission: "exam.form.read" },
  { label: "Marks Batches", href: "/admin/marks/batches", permission: "marks.batch.read" },
  { label: "Results", href: "/admin/results/publications", permission: "result.publication.read" },
  { label: "Refunds (RFT)", href: "/admin/fees/rft", permission: "fees.transaction.read" },
  { label: "Degrees", href: "/admin/degree/applications", permission: "degree.application.read" },
  { label: "Grievances", href: "/admin/grievance", permission: "grievance.complaint.read" },
  { label: "Notices", href: "/admin/notices", permission: "notice.item.read" },
  { label: "Users", href: "/admin/system/users", permission: "system.user.manage" },
];

export function visibleNav(permissions: string[]): NavItem[] {
  return ADMIN_NAV.filter((item) => !item.permission || permissions.includes(item.permission));
}
