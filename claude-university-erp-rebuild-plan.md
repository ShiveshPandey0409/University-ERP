# Claude Implementation Prompt: University ERP Rebuild

Use this as the concrete implementation plan for rebuilding the observed PTSNSU-style university ERP as a modern, scalable system. Do not recreate the old ASP.NET WebForms architecture. Build a clean, modular, secure platform that preserves the same business capability: student UiMS, admissions, grievance, university admin, college/FC workflows, exams, marks, fees, degree, notices, users, and roles.

## 1. Mission

Build a production-grade University ERP with these portals:

1. Public Portal
2. Student UiMS Portal
3. Admission Applicant Portal
4. Public Grievance Portal
5. University Admin Portal
6. College / FC Portal
7. Reporting / Download / Print Center

The system must support multiple login levels, role-based permissions, audit logging, secure data access, exports, printable documents, file uploads, payment/refund tracking, and high-volume reporting.

## 2. Recommended Stack

Use a modern scalable architecture:

- Frontend: Next.js with TypeScript
- Backend API: Node.js with NestJS or Fastify, TypeScript
- Database: PostgreSQL
- Cache/session/rate-limit: Redis
- Object storage: S3-compatible storage for documents, uploads, PDFs, receipts
- Queue: BullMQ, RabbitMQ, or Kafka-compatible worker queue
- Search: PostgreSQL full-text first; OpenSearch later if needed
- Auth: JWT access tokens plus refresh tokens, or secure server sessions
- Authorization: RBAC + permission policies
- Background jobs: exports, report generation, email/SMS/OTP, mark-sheet generation
- Observability: structured logs, OpenTelemetry traces, audit events

Do not hardcode role logic in the UI. Every API must enforce authorization server-side.

## 3. Core User Levels

Implement these account levels from day one:

| Level | Example Role | Main Area | Purpose |
|---|---|---|---|
| Public | No login | Public pages | Results, notices, grievance registration, admission info |
| Student | Student | Student UiMS | Profile, exam forms, fees, results, grievance, subject selection |
| Applicant | Admission Applicant | Admission Portal | Registration, merit/admission steps, admission fees |
| University Admin | Admin / Registrar / Exam Cell / Finance / Academic | University Admin | Full university operations |
| Verification User | Admission/Enrollment verifier | University Admin scoped | Verify forms/documents |
| College / FC User | College operator | College Portal | Exam form verification, marks upload, private admission verification |
| Grievance Officer | Complaint resolver | Admin / Grievance | Assign/reply/close grievances |
| Super Admin | System owner | System Settings | Users, roles, permissions, sessions, global settings |

## 4. Authentication Plan

### 4.1 Login Types

Create separate login experiences but one identity system:

- `/login/student`
- `/login/applicant`
- `/login/admin`
- `/login/college`

Backend endpoints:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`

Login request:

```json
{
  "loginType": "student|applicant|admin|college",
  "username": "string",
  "password": "string",
  "captchaToken": "string optional",
  "otpCode": "string optional"
}
```

Login response:

```json
{
  "user": {
    "id": "uuid",
    "displayName": "string",
    "userType": "admin|student|applicant|college",
    "roles": ["role_key"],
    "permissions": ["permission_key"],
    "activeContext": {
      "collegeId": "uuid optional",
      "departmentId": "uuid optional",
      "sessionId": "uuid optional"
    }
  },
  "accessToken": "jwt",
  "refreshToken": "opaque"
}
```

### 4.2 Security Requirements

- Passwords must use Argon2id or bcrypt with strong parameters.
- Add rate limiting per username and IP.
- Add CAPTCHA only after suspicious attempts or on public forms.
- Add MFA/OTP support for admins and finance users.
- Sessions must expire and be revocable.
- Every privileged action must create an audit log.
- Never expose admin pages without authentication.
- Never rely on frontend menu hiding for permissions.

## 5. Authorization Model

Create these tables/entities:

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `user_scopes`
- `audit_logs`

Permission format:

```text
module.resource.action
```

Examples:

- `admission.application.read`
- `admission.application.verify`
- `admission.merit.generate`
- `enrollment.form.verify`
- `exam.form.read`
- `exam.form.verify`
- `marks.entry.write`
- `marks.correction.approve`
- `fees.transaction.read`
- `fees.rft.issue`
- `grievance.assign`
- `system.user.manage`
- `system.role.manage`

Every API endpoint must declare required permissions.

## 6. Main Product Modules

### 6.1 Public Portal

Routes:

- `/`
- `/notices`
- `/results`
- `/new-uims-account`
- `/forgot-password`
- `/admission`
- `/grievance`

Features:

- Notice board
- Public result lookup
- New student UiMS account registration
- Forgot password
- Admission links/guidelines
- Grievance registration/search

APIs:

- `GET /api/public/notices`
- `GET /api/public/results/published`
- `POST /api/public/results/search`
- `POST /api/public/uims-registration/lookup`
- `POST /api/public/grievances`
- `GET /api/public/grievances/:trackingNo`

### 6.2 Student UiMS Portal

Routes:

- `/student/dashboard`
- `/student/profile`
- `/student/admission`
- `/student/subjects`
- `/student/exam-forms`
- `/student/fees`
- `/student/results`
- `/student/grievances`
- `/student/documents`

Features:

- Student profile
- Enrollment/admission status
- Subject selection
- Exam form application
- Fee payment history
- Result and marksheet downloads
- Grievance creation/tracking
- Document downloads

APIs:

- `GET /api/student/me`
- `GET /api/student/profile`
- `PATCH /api/student/profile`
- `GET /api/student/subjects`
- `POST /api/student/subject-selection`
- `GET /api/student/exam-forms`
- `POST /api/student/exam-forms`
- `GET /api/student/fees`
- `GET /api/student/results`
- `GET /api/student/documents`

### 6.3 Admission Applicant Portal

Routes:

- `/admission`
- `/admission/login`
- `/admission/register`
- `/admission/register/phd`
- `/admission/register/private`
- `/admission/application`
- `/admission/payment`
- `/admission/merit`
- `/admission/status`

Features:

- Applicant registration
- OTP verification
- Course/college/program selection
- Document upload
- Application submission
- Application status
- Merit list status
- Admission fee payment
- Admission cancellation/change request

APIs:

- `POST /api/admission/applicants`
- `POST /api/admission/applicants/:id/verify-otp`
- `GET /api/admission/sessions`
- `GET /api/admission/programs`
- `GET /api/admission/seat-matrix`
- `POST /api/admission/applications`
- `PATCH /api/admission/applications/:id`
- `POST /api/admission/applications/:id/submit`
- `POST /api/admission/applications/:id/documents`
- `GET /api/admission/applications/:id/status`
- `GET /api/admission/merit-lists/public`

### 6.4 University Admin Portal

Routes:

- `/admin/dashboard`
- `/admin/pre-admission`
- `/admin/post-admission`
- `/admin/enrollment`
- `/admin/academic`
- `/admin/examination`
- `/admin/marks`
- `/admin/fees`
- `/admin/degree`
- `/admin/grievances`
- `/admin/notices`
- `/admin/system/users`
- `/admin/system/roles`
- `/admin/system/sessions`

All admin pages must use layout-level permission guards and endpoint-level authorization.

## 7. University Admin Modules In Detail

### 7.1 Pre Admission

Pages:

- Dashboard
- Form Verification
- Ph.D. Form Verification
- Merit List Generation
- Verification Users
- Admission Sessions

Features:

- Session-wise dashboard
- Course/category/status filters
- Application verification
- Document deficiency marking
- Application rejection
- Merit list generation
- Verification user assignment
- Export to Excel

APIs:

- `GET /api/admin/pre-admission/dashboard`
- `GET /api/admin/pre-admission/applications`
- `GET /api/admin/pre-admission/applications/:id`
- `POST /api/admin/pre-admission/applications/:id/verify`
- `POST /api/admin/pre-admission/applications/:id/mark-deficiency`
- `POST /api/admin/pre-admission/applications/:id/reject`
- `POST /api/admin/pre-admission/merit-lists/generate`
- `GET /api/admin/pre-admission/verification-users`
- `POST /api/admin/pre-admission/verification-users`
- `PATCH /api/admin/pre-admission/verification-users/:id`
- `GET /api/admin/pre-admission/export`

### 7.2 Post Admission

Pages:

- Dashboard
- Admission List
- Subject Selection
- Subject Change List
- Cancellation List
- Report Format-1

Features:

- Admitted student dashboard
- Fees-paid status
- Subject allocation
- Subject change workflow
- Admission cancellation workflow
- Category/gender/department reports

APIs:

- `GET /api/admin/post-admission/dashboard`
- `GET /api/admin/post-admission/admissions`
- `GET /api/admin/post-admission/admissions/:id`
- `GET /api/admin/post-admission/subject-selections`
- `POST /api/admin/post-admission/subject-selections/:id/approve`
- `GET /api/admin/post-admission/subject-change-requests`
- `POST /api/admin/post-admission/subject-change-requests/:id/approve`
- `POST /api/admin/post-admission/subject-change-requests/:id/reject`
- `GET /api/admin/post-admission/cancellations`
- `POST /api/admin/post-admission/cancellations/:id/approve`
- `GET /api/admin/post-admission/reports/format-1`

### 7.3 Enrollment

Pages:

- Dashboard
- Enrollment Verification
- Ph.D. Enrollment

Features:

- Enrollment dashboard
- Enrollment application verification
- Enrollment number allocation
- Ph.D. enrollment workflow
- Export to Excel

APIs:

- `GET /api/admin/enrollment/dashboard`
- `GET /api/admin/enrollment/forms`
- `GET /api/admin/enrollment/forms/:id`
- `POST /api/admin/enrollment/forms/:id/verify`
- `POST /api/admin/enrollment/forms/:id/reject`
- `POST /api/admin/enrollment/forms/:id/allocate-number`
- `GET /api/admin/enrollment/export`

### 7.4 Academic

Pages:

- Dashboard
- Student List
- Scheme Verification
- UG Subject Selection

Features:

- Student list by session/course/semester
- Scheme verification
- Scheme approval/removal
- UG subject selection tracking

APIs:

- `GET /api/admin/academic/dashboard`
- `GET /api/admin/academic/students`
- `GET /api/admin/academic/students/:id`
- `GET /api/admin/academic/schemes`
- `POST /api/admin/academic/schemes/:id/approve`
- `POST /api/admin/academic/schemes/:id/remove`
- `GET /api/admin/academic/subject-selections`

### 7.5 Examination

Pages:

- Dashboard
- Examination Forms
- Examination Details Uploaded

Features:

- Exam form counts
- Exam form reports
- Exam detail upload/status
- Student type filters: regular, private, ex-regular, ATKT/supplementary
- Payment status filters

APIs:

- `GET /api/admin/exam/dashboard`
- `GET /api/admin/exam/forms`
- `GET /api/admin/exam/forms/:id`
- `POST /api/admin/exam/forms/:id/verify`
- `POST /api/admin/exam/forms/:id/reject`
- `GET /api/admin/exam/details`
- `POST /api/admin/exam/details`

### 7.6 Marks / Results

Pages:

- Marks Entry Dashboard
- Unpublished Corrections
- Marks Correction
- Withheld Clear
- RV/RT Print

Features:

- Marks entry batches
- CCE/practical/project mark entry
- Correction workflow
- Withheld result clearing
- Revaluation/retotal print
- Result publication state

APIs:

- `GET /api/admin/marks/dashboard`
- `GET /api/admin/marks/batches`
- `GET /api/admin/marks/batches/:id/students`
- `POST /api/admin/marks/entries`
- `POST /api/admin/marks/entries/import`
- `GET /api/admin/marks/corrections`
- `POST /api/admin/marks/corrections/:id/approve`
- `POST /api/admin/marks/withheld/:id/clear`
- `GET /api/admin/marks/rvrt-print`

### 7.7 Fees / RFT

Pages:

- Fees Dashboard
- Fees Master
- Issue RFT
- Issue RFT Old
- RFT Report
- Fees Report

Features:

- Transaction dashboard
- Fees master configuration
- Transaction search
- Refund/RFT issue
- Old transaction RFT support
- RFT print
- Excel export

APIs:

- `GET /api/admin/fees/dashboard`
- `GET /api/admin/fees/master`
- `POST /api/admin/fees/master`
- `PATCH /api/admin/fees/master/:id`
- `GET /api/admin/fees/transactions`
- `GET /api/admin/fees/transactions/:id`
- `POST /api/admin/fees/rft`
- `GET /api/admin/fees/rft`
- `GET /api/admin/fees/rft/:id`
- `PATCH /api/admin/fees/rft/:id`
- `GET /api/admin/fees/rft/:id/print`
- `GET /api/admin/fees/export`

### 7.8 Degree

Pages:

- Degree Dashboard
- Degree List

Features:

- Degree application/search
- Delivery tracking
- Print/export lists

APIs:

- `GET /api/admin/degrees`
- `GET /api/admin/degrees/:id`
- `POST /api/admin/degrees/:id/mark-delivered`
- `GET /api/admin/degrees/export`

### 7.9 Grievance Manager

Pages:

- Complaint Manager
- Complaint Detail
- Assignment Queue

Features:

- Complaint table
- Assign complaint
- Reply to complaint
- Close complaint
- Status tracking

APIs:

- `GET /api/admin/grievances`
- `GET /api/admin/grievances/:id`
- `POST /api/admin/grievances/:id/assign`
- `POST /api/admin/grievances/:id/reply`
- `POST /api/admin/grievances/:id/close`

### 7.10 Notice Board

Pages:

- Notice Board Manager
- Add/Edit Notice

Features:

- Add notice
- Hide/unhide notice
- Attach document/link
- Notice category and publish date

APIs:

- `GET /api/admin/notices`
- `POST /api/admin/notices`
- `PATCH /api/admin/notices/:id`
- `POST /api/admin/notices/:id/hide`
- `POST /api/admin/notices/:id/publish`

### 7.11 System Settings

Pages:

- Users
- Roles
- Permissions
- Sessions
- Colleges
- Departments
- Programs
- Courses
- Subjects

Features:

- Create/edit users
- Assign roles
- Assign scopes
- Create roles
- Assign permissions
- Manage sessions
- Manage colleges/departments/programs/subjects

APIs:

- `GET /api/admin/system/users`
- `POST /api/admin/system/users`
- `PATCH /api/admin/system/users/:id`
- `POST /api/admin/system/users/:id/disable`
- `POST /api/admin/system/users/:id/roles`
- `GET /api/admin/system/roles`
- `POST /api/admin/system/roles`
- `PATCH /api/admin/system/roles/:id`
- `GET /api/admin/system/permissions`
- `POST /api/admin/system/roles/:id/permissions`

## 8. College / FC Portal In Detail

Routes:

- `/college/dashboard`
- `/college/exam/dashboard`
- `/college/exam/forms`
- `/college/marks`
- `/college/private-admission`
- `/college/profile`

Features:

- Exam form summary
- Exam form list and verification
- CCE/practical/project marks upload
- Private admission verification
- College profile
- Password change

APIs:

- `GET /api/college/dashboard`
- `GET /api/college/exam/dashboard`
- `GET /api/college/exam/forms`
- `GET /api/college/exam/forms/:id`
- `POST /api/college/exam/forms/:id/verify`
- `GET /api/college/marks/batches`
- `GET /api/college/marks/batches/:id/students`
- `POST /api/college/marks/entries`
- `POST /api/college/marks/import`
- `GET /api/college/private-admissions`
- `POST /api/college/private-admissions/:id/verify`

College users must be scoped to their own college/department. They must not see university-wide data unless explicitly permitted.

## 9. Data Model

Implement at minimum these entities.

Identity:

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `user_scopes`
- `sessions`
- `login_attempts`
- `refresh_tokens`

Academic master data:

- `academic_sessions`
- `admission_sessions`
- `exam_sessions`
- `colleges`
- `departments`
- `faculties`
- `programs`
- `courses`
- `subjects`
- `schemes`
- `course_subjects`
- `seat_matrix`

People:

- `students`
- `applicants`
- `guardians`
- `student_documents`
- `applicant_documents`

Admission:

- `admission_applications`
- `admission_application_status_history`
- `admission_verifications`
- `merit_lists`
- `merit_list_entries`
- `admissions`
- `subject_selections`
- `subject_change_requests`
- `admission_cancellations`

Enrollment:

- `enrollment_forms`
- `enrollment_verifications`
- `enrollment_numbers`

Examination:

- `exam_forms`
- `exam_form_status_history`
- `exam_form_subjects`
- `exam_details_uploads`

Marks/results:

- `marks_batches`
- `marks_entries`
- `marks_imports`
- `marks_corrections`
- `withheld_results`
- `result_publications`
- `rvrt_requests`

Fees:

- `fee_heads`
- `fee_structures`
- `payment_orders`
- `payment_transactions`
- `refund_transactions`
- `rft_requests`
- `rft_status_history`

Degree:

- `degree_applications`
- `degree_delivery_events`

Grievance:

- `grievances`
- `grievance_assignments`
- `grievance_replies`
- `grievance_attachments`
- `grievance_status_history`

Content/reporting:

- `notices`
- `notice_attachments`
- `export_jobs`
- `generated_reports`
- `audit_logs`
- `files`

## 10. Database Rules

Use these conventions:

- Every table has `id uuid primary key`.
- Every mutable business table has:
  - `created_at`
  - `updated_at`
  - `created_by`
  - `updated_by`
  - `deleted_at` where soft delete is needed
- Status changes must create history records.
- Financial records must never be hard-deleted.
- Marks/results changes must be auditable.
- Use database constraints for uniqueness:
  - enrollment number
  - application number
  - roll number per exam session
  - transaction order number
  - RFT number

## 11. UI Architecture

Use separate layouts:

- `PublicLayout`
- `StudentLayout`
- `ApplicantLayout`
- `AdminLayout`
- `CollegeLayout`

Build reusable components:

- Data table with server-side pagination
- Filter panel
- Export button
- Status badge
- Document upload
- Audit timeline
- Form verification panel
- Confirmation modal
- Print/download actions
- Role-protected navigation

Admin/College dashboards should be dense operational tools, not marketing pages.

## 12. Reporting And Export Architecture

Do not generate heavy Excel/PDF reports inside the request cycle.

Use:

- `POST /api/reports/jobs`
- background worker
- `export_jobs` table
- object storage for generated file
- notification when ready

Report job request:

```json
{
  "reportType": "fees_report|rft_report|admission_list|exam_form_list",
  "filters": {},
  "format": "xlsx|pdf|csv"
}
```

Report job response:

```json
{
  "jobId": "uuid",
  "status": "queued"
}
```

## 13. File Uploads

All uploaded files go through a file service:

- validate MIME type
- validate size
- virus scan hook
- store in S3-compatible storage
- write metadata to `files`
- never serve private files directly by public object URL
- generate signed URLs after permission check

APIs:

- `POST /api/files`
- `GET /api/files/:id/download-url`

## 14. Audit Logging

Audit these events:

- login/logout
- password reset
- user creation/update/disable
- role/permission changes
- application verification/rejection
- enrollment verification
- scheme approval/removal
- exam form verification
- marks entry/import/correction
- withheld clear
- fee master changes
- refund/RFT creation/edit/print
- grievance assignment/reply/close
- notice publish/hide
- report export

Audit record:

```json
{
  "actorUserId": "uuid",
  "action": "fees.rft.issue",
  "entityType": "rft_request",
  "entityId": "uuid",
  "before": {},
  "after": {},
  "ipAddress": "string",
  "userAgent": "string",
  "createdAt": "timestamp"
}
```

## 15. Implementation Phases

### Phase 1: Foundation

Deliver:

- monorepo setup
- database schema/migrations
- auth/login/logout
- RBAC/permissions
- admin layout
- public layout
- audit logging
- seed roles and permissions

Acceptance:

- unauthenticated users cannot access admin/college/student APIs
- role-protected routes reject missing permissions
- audit logs are written for login and user changes

### Phase 2: Master Data

Deliver:

- sessions
- colleges
- departments
- programs/courses
- subjects
- schemes
- fee heads
- notice categories

Acceptance:

- admin can manage master data
- all list pages have pagination/filtering
- all writes are audited

### Phase 3: Public + Student UiMS

Deliver:

- public notices
- result lookup
- student registration lookup
- student dashboard
- student profile
- student fees/results/documents

Acceptance:

- students only see their own records
- public result lookup is rate-limited
- private documents require signed URL after permission check

### Phase 4: Admission

Deliver:

- applicant registration
- OTP
- application form
- document upload
- pre-admission verification
- merit generation
- post-admission dashboard/list
- admission cancellation/subject change

Acceptance:

- application status history is complete
- verifier actions are permission-checked and audited
- merit generation is reproducible

### Phase 5: Enrollment + Academic

Deliver:

- enrollment forms
- enrollment verification
- enrollment number allocation
- student list
- scheme verification
- subject selection

Acceptance:

- no duplicate enrollment numbers
- academic users can filter and export lists
- scheme approvals are auditable

### Phase 6: Examination

Deliver:

- exam sessions
- exam form opening rules
- student exam form application
- college verification
- university exam dashboards
- exam details upload

Acceptance:

- college users see only scoped college data
- university users see permitted global data
- exam-form status history is complete

### Phase 7: Marks / Results

Deliver:

- marks batch creation
- college marks upload
- marks entry
- correction workflow
- withheld clear
- result publication
- RV/RT print

Acceptance:

- marks changes are audited
- imports validate rows before commit
- result publication has explicit approval

### Phase 8: Fees / RFT

Deliver:

- fee structures
- transaction reports
- payment history
- RFT issue workflow
- RFT report
- print/download

Acceptance:

- financial records are immutable except controlled status updates
- refund/RFT actions require finance permission
- exported reports are generated by background jobs

### Phase 9: Grievance + Degree + Notices

Deliver:

- public grievance registration
- complaint assignment/reply/close
- degree list/delivery tracking
- notice board manager

Acceptance:

- complaints have tracking numbers
- every reply/assignment is logged
- notices can be published/hidden safely

### Phase 10: Hardening And Launch

Deliver:

- full permission review
- rate limiting
- monitoring
- backup strategy
- migration/import scripts
- load test
- security test
- deployment runbook

Acceptance:

- no admin/college API is accessible unauthenticated
- no cross-tenant college data leakage
- reports work asynchronously
- audit logs are complete
- backups restore successfully in staging

## 16. Verification Checklist For Coding Agent

For every module, implement and test:

- route guard
- API permission guard
- list pagination
- filters
- empty state
- loading state
- error state
- create/update validation
- audit log on write
- export if required
- file access permission if files exist
- role-specific visibility

For every login level, test:

- correct login succeeds
- wrong password fails
- locked/disabled user fails
- role menu matches permissions
- direct URL access without permission fails
- API access without permission fails
- logout invalidates session

For every report:

- filters are validated
- large reports run in background
- generated file has permission checks
- export job status can be tracked

## 17. Minimum Seed Roles

Create these seed roles:

- `super_admin`
- `university_admin`
- `admission_admin`
- `admission_verifier`
- `enrollment_admin`
- `academic_admin`
- `exam_admin`
- `marks_admin`
- `finance_admin`
- `grievance_admin`
- `notice_admin`
- `college_admin`
- `college_exam_operator`
- `college_marks_operator`
- `student`
- `applicant`

## 18. Final Deliverable Expected From Claude

Claude should produce:

1. Complete project scaffold.
2. Database schema and migrations.
3. Seed roles/permissions.
4. Auth and RBAC.
5. Public portal.
6. Student portal.
7. Applicant portal.
8. Admin portal with all modules.
9. College portal.
10. Report/export job system.
11. Audit logging.
12. File upload/download service.
13. Automated tests for auth, RBAC, and core workflows.
14. Deployment instructions.
15. A README explaining module structure, environment variables, and run commands.

Do not skip security. The original observed system appeared to expose some admin routes without reliable session enforcement. The rebuilt system must fix that at the architecture level.
