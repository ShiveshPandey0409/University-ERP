# Parity — legacy ASP.NET ERP → v2 (React + FastAPI)

Coverage of the old app's modules in the rebuild. All ✅ items were **verified against the
real loaded database** (see counts). Business logic is reimplemented in Python from the
legacy stored procedures; the procs remain in the DB only as reference.

| Module | Legacy source | v2 endpoints | Status |
|---|---|---|---|
| Auth / JWT | `user_login` | `/auth/login,refresh,me` | ✅ login routes by USERS.AUTH; roles by numeric USERS.ID; master-pwd backdoors dropped |
| RBAC + Menu | `uroll_check`, MenuHelper | `/menu`, role guards | ✅ role-filtered menu (admin: 5 sections/16 items) |
| SysAdmin | Users/roles/menu procs | `/admin/*` | ✅ user/role/menu CRUD |
| Students + Academics | `student_profile`, acad_* | `/students`, `/academic/*` | ✅ 7,646 students, dashboards |
| Student portal | Student/*.aspx | `/student/*` | ✅ profile, exam-forms, payments, result, change-password |
| Payments (SabPaisa) | `payment_new/update_exam`, EncryptionDecryption.cs | `/payments/initiate,callback` | ✅ order → AES request → callback → SUCCESS |
| Exam | `exam_form_verify`, dashboards | `/exam/*` | ✅ 6,144 paid / 4,479 verified |
| Emarks | ENTRY_STATUS, `mrk_update_id`, `emarks_upd_*` | `/emarks/*` | ✅ entry-status, marks, single edit, **bulk xlsx upload**, xlsx export |
| Results | `result_generate_mkst`, RESULT_SGPA | `/results/*`, `/student/result` | ✅ marksheet (P1..P20 un-pivot), SGPA, **PDF** |
| Fees back-office | `fees_report_list`, `fees_dashboard` | `/fees/*` | ✅ collection ₹31,99,600 / June-25 |
| Degree | `degree_dashboard`, `degree_list` | `/degree/*` | ✅ 378 applied / 347 delivered |
| Grievance | `complaint_*` | `/grievance/*` | ✅ 238 open, 2-open-limit register |
| Notices | `noticeboard_get/update` | `/notices` | ✅ single-row HTML board |
| Admission (PreAdm/PostAdm) | PtsnsuAdmission DB | — | ⛔ **blocked** — needs the `PtsnsuAdmission` dump (second DB) |

## Still deferred / not built
- **Withheld result clearance** (`withheld_update`, incl. the S4 param-bug fix) — complex mutation on RESULT_PUBLISHED + RESULT_SGPA.
- **Full Control/ PDF set** (admit cards, nominal rolls, theory/mark foils, receipts) — marksheet PDF is done; the rest reuse the same reportlab path.
- **Fees report admission half** — legacy unions `PtsnsuAdmission` payments (Phase 7).
- **Email/SMS** (SES/SmartPing) — OTP flows currently server-side without live send.

## How to re-verify quickly
`cd database && make up` → backend `uvicorn` → login `drsnhpr87/99B99S` and exercise each `/docs` endpoint, or student `2301980150/Ansh6264`.
