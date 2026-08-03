# Data Model — PSNSUniversityOnline (as-is)

Reference for the rebuild. The DB has **57 tables, 184 procs, 6 views, 2 functions**,
**no foreign keys**, only 20 PKs — relationships are by naming convention. We map ORM
models onto these tables unchanged; normalization is a later track.

Full extracted DDL: `/tmp/ptsnsu_ddl.sql` (regenerate from `~/Downloads/script_backup.sql`
via `iconv` + split if missing). Source dump generated 21-07-2026 (SQL Server 2022).

## Join keys (the real relationships)
- `STUDENTS.EnrollNo` — student identity, referenced everywhere as `ENROLL_NO`/`Enroll_No`.
- `STUDENT_COURSE.PK` (identity) — target of `EXAM_FORM.STD_ID`.
- Paper grain: `COURSE_ID + SEMESTER + PAPER_CODE + PAPER_TYPE` (marks, results, scheme).
- `PAYMENTS.TOKEN` — payment id; `COLLEGE_ID` — college/exam-center.
- Access: `USERS`→`UROLLS`(UID,UROLL)→`SYSROLL`(ID); menu `MENU_ITEMS`←`MENU_ROLE_MAPPING`→role.

## Core tables the app uses (build against these — ~40)
| Group | Tables (rows) |
|---|---|
| Students | STUDENTS(7646, PK EnrollNo), STUDENT_COURSE(7872), EXAM_ATKT_PAPERS(1333) |
| Academic ref | COURSES(128), SCHEME(2607), UG1_SCHEME(407), BED_SCHEME(46), SCH_CRS_TYPE(7), COURSE_CONTROL(227), SESSIONS(1), CITY(684), COLLEGES(79) |
| Exam/Marks | EXAM_FORM(72163), EXAM_MARKS(236543), MARKS_UPLOAD(3195) |
| Results | RESULT_PUBLISHED(16311, wide P1..P20+CGPA), RESULT_SGPA(18448), RESULT_PENDING(432), RESULT_LIST(166), RESULT_PROCNF(7), RTOTAL_APPL(520) |
| Finance | PAYMENTS(12010, PK TOKEN), FEES_MASTER(1160, 5-col PK), FEES_RFT(148) |
| Degree | DEGREE_DATA(8176), DEGREE_USER(637), DEGREE_COURSES(16), DEGREE_SUBJECTS(84), DEGREE_TYPES(5), DEGREE_PHD(16) |
| Support | COMPLAINT(402), COMPLAINT_CATEG(7), NOTICEBOARD(1) |
| System | USERS(6699), USERSADMIN(17), USERSLOG(46554), UROLLS(213), SYSROLL(34), MENU_ITEMS(37), MENU_ROLE_MAPPING(43) |

Views to reimplement as queries: `EXAM_PAPER_LIST`, `EXAM_PAPER_MARKS`, `exam_form_list`,
`ENTRY_STATUS`, `result_pending_notice` (+ `z_ENTRY_STATUS_UTD`).
Functions: `FnSecCode` (marksheet checksum), `ProperCase` (title-case).

## Ad-hoc / junk tables — IGNORE now, DROP in the cleanup track (~17)
Not referenced by any page or proc; snapshots/imports left behind:
`EXAM_MARKS_ARC(54800)`, `EM_UG1D(10282)`, `xmm(110)`, `ZEMBA(118)`, `RESULT_MRKS(9)`,
`RESULT_X(1091)`, `x_MKST_PG241025(4537)`, `x_MKST_PG261025(25)`, `x_SCHEME_III(298)`,
`x_supplIII(314)`, `x_EMMM_ATKT(52)`, `Z_STD1(8918)`, `A_ENROLL_LLB(387)`, `AG_ATKT(89)`,
`DEGREE_DATA_DUP(92)`, and review the Excel imports `UG1_MRK_FNL(105786)`, `UG1_MRK_FNL_2(53414)`.

## Notes for reimplementation
- `user_login`: routes by `USERS.AUTH` (Student/College/Univ/Emarks/FrmVerify). Drop the
  hardcoded master passwords `p8715t`/`p9211t`. Passwords are plaintext → bcrypt-on-login.
- Results: SGPA/CGPA/division are pre-computed in the wide `RESULT_PUBLISHED`; generation procs
  pivot P1..P20 and sum credits. `withheld_update` has a known S4 param bug — fix on port.
- `PtsnsuAdmission` DB (admission) is NOT in the dump — Phase 7.
