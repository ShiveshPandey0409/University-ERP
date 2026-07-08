# PTSNSU Online System Map

Generated: 2026-07-04

Scope: `https://ptsnsuonline.com/`, public pages, the supplied `admin` and `brc` UiMS accounts, and reachable `/Univ/` and `/College/` areas. This was a read-only crawl: no records were created, changed, deleted, uploaded, assigned, paid, or submitted beyond login.

## Executive Summary

- The site is a classic ASP.NET WebForms ERP running on Microsoft IIS 10 / ASP.NET 4.0.30319.
- The main authenticated university back office is under `/Univ/`.
- Both supplied accounts log into the same `/Univ/` area:
  - `admin` displays as `Administrator(admin)`.
  - `brc` displays as `BR Computers(brc)`.
- I found no meaningful permission/menu difference between those two accounts. Both reached the same 40 university routes with the same visible actions and tables.
- The workspace at `/Users/mason/Documents/University-ERP` is empty, so there is no local source code to inspect or connect to the live behavior.
- Important access-control finding: several `/Univ/` administrator URLs returned `200 OK` even when requested without an observed authenticated cookie/session. This should be treated as urgent until the server-side authorization model is confirmed and fixed.

## Technology And Architecture

Observed stack:

- Hosting: Microsoft IIS 10.
- Framework: ASP.NET WebForms, ASP.NET 4.0.30319.
- Page model: `.aspx` pages with WebForms postbacks.
- State model: `__VIEWSTATE`, `__EVENTVALIDATION`, `__EVENTTARGET`, `__EVENTARGUMENT`.
- AJAX model: ASP.NET `ScriptResource.axd`, `WebResource.axd`, `UpdatePanel` partial postbacks.
- Frontend libraries:
  - jQuery 1.11.x / 1.12.x, jQuery UI.
  - Bootstrap.
  - DataTables.
  - Chart.js / amCharts.
  - Google reCAPTCHA on the public grievance/admission side.
- API style:
  - Mostly page-level form posts back to the same `.aspx` route.
  - I did not find a REST API surface.
  - One explicit AJAX method was visible in admission scripts: `default.aspx/VerifyCaptcha`.

Likely backend shape:

- WebForms pages call server-side code-behind methods.
- The database is not directly visible from the deployed HTML. Given the IIS/WebForms stack and ERP structure, SQL Server is likely, but that cannot be verified without source code or server access.

## Public Site Hierarchy

Root portal:

- `/` or `/default.aspx`
  - Notice board.
  - UiMS login.
  - Links to Results, Admission Portal, Grievance Portal, university website.
- `/results.aspx`
  - Public result search by enrollment number and roll number.
  - Published-results table.
- `/UserNew.aspx`
  - New student UiMS registration.
  - Enrollment number plus date of birth lookup.
- `/FgPWD.aspx`
  - UiMS forgot password.
  - Username/enrollment plus CAPTCHA.
- `/UiMSInstruction.pdf`
  - Registration instruction PDF.

Admission portal:

- `/admission/`
  - Applicant login.
  - Notice board, merit-list notices, admission guidelines.
  - Registration links for regular, private, agriculture entrance, and Ph.D.
- `/admission/decl.aspx`
  - Declaration/terms gate before regular admission registration.
- `/admission/RegPHD.aspx`
  - Ph.D. registration via name, father name, mobile, email, OTP.
- `/admission/registerPvtUG.aspx`
  - Private admission registration with course/college, name, mobile, email, OTP.
- `/admission/ForgetPass.aspx`
  - Admission-form password recovery.
- `/admission/seats.aspx`
  - Linked from the portal but returned 404 during the crawl.

Grievance portal:

- `/uims/Grievance/`
  - Public complaint registration.
  - Complaint category, enrollment/roll/name/father/mobile, optional upload, complaint text, CAPTCHA/reCAPTCHA.
  - Search complaint and register complaint actions.

## University Admin Area: `/Univ/`

Main dashboard:

- `/Univ/` and `/Univ/default.aspx`
  - Header identity.
  - Search student by enrollment/roll.
  - Search admission by registration/application number.
  - Open grievance alert.

Visible modules and routes:

| Module | Route | Purpose / Visible Actions |
|---|---|---|
| Pre Admission 2026 | `/Univ/PreAdm/default.aspx` | Dashboard by session/course/status; download Excel; filter |
| Pre Admission 2026 | `/Univ/PreAdm/FrmList.aspx` | Form verification; candidate search; download Excel |
| Pre Admission 2026 | `/Univ/PreAdm/PhdFrmList.aspx` | Ph.D. form verification; candidate search; download Excel |
| Pre Admission 2026 | `/Univ/PreAdm/MeritList.aspx` | Generate merit list |
| Pre Admission 2026 | `/Univ/PreAdm/VeriUsers.aspx` | Verification-user management; update; download Excel |
| Pre Admission 2026 | `/Univ/PreAdm/sessions.aspx` | Academic session management; new session; submit |
| Post Admission 2026 | `/Univ/PostAdm/default.aspx` | Dashboard by pending/admitted/fees/gender |
| Post Admission 2026 | `/Univ/PostAdm/AdmList.aspx` | Admission list report generation |
| Post Admission 2026 | `/Univ/PostAdm/Subselect.aspx` | MDC/VOC/VAC subject selection; search/download |
| Post Admission 2026 | `/Univ/PostAdm/SubChangeList.aspx` | Subject-change requests list |
| Post Admission 2026 | `/Univ/PostAdm/AdmCnlList.aspx` | Admission-cancellation list |
| Post Admission 2026 | `/Univ/PostAdm/RptCMF.aspx` | Category/gender/report format summary; download Excel |
| Enrollment | `/Univ/Enroll/default.aspx` | Enrollment dashboard by admission/applied/verified/pending |
| Enrollment | `/Univ/Enroll/FrmList.aspx` | Enrollment verification |
| Enrollment | `/Univ/Enroll/FrmListPHD.aspx` | Ph.D. enrollment verification |
| Academic | `/Univ/Acad/default.aspx` | Academic dashboard by course/year/students |
| Academic | `/Univ/Acad/StdList.aspx` | Student/admission list |
| Academic | `/Univ/Acad/SchList.aspx` | Scheme verification; generate/remove/approve scheme |
| Academic | `/Univ/Acad/SubSelect.aspx` | UG subject selection |
| Examination | `/Univ/Exam/default.aspx` | Exam dashboard by student/form/payment counts |
| Examination | `/Univ/Exam/ExamList.aspx` | Exam form reports |
| Examination | `/Univ/Exam/ExcDetails.aspx` | Exam details upload page |
| Results / Emarks | `/Univ/Emarks/listcor.aspx` | Unpublished corrections |
| Results / Emarks | `/Univ/Emarks/default.aspx` | Marks entry dashboard |
| Results / Emarks | `/Univ/Emarks/MrkEdit.aspx` | Marks correction search |
| Results / Emarks | `/Univ/Emarks/Withheld.aspx` | Withheld-clear search |
| Results / Emarks | `/Univ/Emarks/RtotalPrint.aspx` | RV/RT print list |
| Fees | `/Univ/Fees/default.aspx` | Fees dashboard by transaction count/amount |
| Fees | `/Univ/Fees/FeesMaster.aspx` | Fees master search |
| Fees | `/Univ/Fees/RftNew.aspx` | Create/issue RFT from transactions |
| Fees | `/Univ/Fees/RftIssueOld.aspx` | Old transaction RFT issue form |
| Fees | `/Univ/Fees/RftList.aspx` | RFT report list |
| Fees | `/Univ/Fees/FeesList.aspx` | Fees report list |
| Degree | `/Univ/Degree/default.aspx` | Degree portal search |
| Grievance | `/Univ/Grievance/default.aspx` | Complaint manager, assign complaint |
| Web / Notices | `/Univ/Web/news.aspx` | Notice board management, add/hide notice |
| System Settings | `/Univ/SysAdmin/Users.aspx` | User manager, new/edit users |
| System Settings | `/Univ/SysAdmin/SysRolls.aspx` | Role/roll manager, add/edit rolls |

Notable live counts observed during crawl:

- Grievance manager listed 402 open grievances from the dashboard, and the complaint table had 403 rows including header.
- System users table had 21 rows including header.
- System rolls table had 28 rows including header.
- Fees report table had around 174-175 rows during crawl; this changed between account crawls, likely due to live data.

## Account / Role Comparison

`admin` account:

- Displayed identity: `Administrator(admin)`.
- Reached 40 `/Univ/` routes.
- Full menu visible: admissions, enrollment, academic, examination, marks/results, fees, degree, grievances, notices, users, roles.

`brc` account:

- Displayed identity: `BR Computers(brc)`.
- Reached the same 40 `/Univ/` routes.
- Same visible module tree, actions, table headers, and page structure as `admin`.

Observed difference:

- Only one dynamic table row count differed on the fees report. This appears to be live data changing, not a role restriction.

Conclusion:

- Based on visible UI and GET-accessible pages, `admin` and `brc` behave as the same effective university-administrator level.
- If these accounts are expected to have different permissions, authorization is either not reflected in the menu/pages or is not being enforced on the routes I checked.

## College / FC Area

The site also has a separate college/facilitation-center area under `/College/`.

Routes observed:

| Route | Purpose |
|---|---|
| `/College/default.aspx` | FC dashboard; exam form verification/modification search; subject-change admission search |
| `/College/exam/default.aspx` | Exam form summary dashboard |
| `/College/exam/ExamList.aspx` | Exam form list/report filters |
| `/College/Emarks/default.aspx` | CCE/practical/project marks upload dashboard |
| `/College/admsn/default.aspx` | Private admission verification list |

This area appears intended for college/facilitation-center users, separate from `/Univ/`.

## Access-Control Findings

Important observations:

- Fresh requests without an observed login cookie returned `200 OK` for:
  - `/Univ/`
  - `/Univ/SysAdmin/Users.aspx`
  - `/Univ/Fees/FeesList.aspx`
- These pages did not redirect to login during the check.
- The unauthenticated layout showed a generic `Label` in the header instead of a username, but still served administrator pages.
- Response headers did not show an observed `Set-Cookie` during the login flow or dashboard access from the HTTP crawl.

Risk:

- If server-side authorization is not enforced, admin pages, user lists, fee reports, grievances, and operational dashboards may be accessible without authentication.
- Even if write operations have server-side checks, exposing the pages and table data is still a serious data/privacy issue.

Recommended immediate checks:

1. Confirm in a private/incognito browser with no cookies that `/Univ/SysAdmin/Users.aspx` redirects to login. During my crawl it returned `200`.
2. Add `Session` / forms-auth checks in a base page or master-page guard for every `/Univ/*` and `/College/*` route.
3. Enforce role checks server-side per action, not only by hiding menu items.
4. Disable direct unauthenticated GET access to list/report pages.
5. Review all WebForms postback handlers for authorization before data read/write.
6. Remove or restrict `x-aspnet-version` and `x-powered-by` headers.
7. Put no-cache/private data headers on authenticated pages.

## Missing Local Codebase

The local folder `/Users/mason/Documents/University-ERP` is empty and is not a git repository. Because of that, I could not map live pages to source files, controllers/code-behind classes, database tables, or deployment settings.

To complete source-level architecture, provide the actual project files. For this WebForms app, the important files would likely include:

- `.aspx` pages.
- `.aspx.cs` or `.aspx.vb` code-behind files.
- `web.config`.
- Master pages.
- DAL/BLL classes.
- SQL scripts or stored procedure definitions.
- Authentication/session/role helper classes.
