"""Marks (Emarks) — reimplemented from ENTRY_STATUS view, emarks_paper_list,
mrk_search_rollno, and mrk_update_id."""
from sqlalchemy import and_, case, func, select, text
from sqlalchemy.orm import Session

from app.models.exam import ExamMark


def _pct(entered: int, total: int) -> float:
    return round(entered * 100 / total, 2) if total else 0.0


def entry_status(db: Session, *, course_id=None, semester=None) -> list[dict]:
    """Marks-entry progress per course+semester (reimpl of the ENTRY_STATUS view)."""
    theory = ExamMark.paper_type == "THEORY"
    prac = ExamMark.paper_type.in_(["PRACTICAL", "PROJECT"])
    internal = ExamMark.paper_type == "INTERNAL"
    entered = ExamMark.mark1.isnot(None)

    stmt = select(
        ExamMark.course_id,
        func.max(ExamMark.course_name).label("course_name"),
        ExamMark.semester,
        func.count(func.distinct(ExamMark.rollno)).label("students"),
        func.sum(case((theory, 1), else_=0)).label("th_tot"),
        func.sum(case((and_(theory, entered), 1), else_=0)).label("th_ent"),
        func.sum(case((prac, 1), else_=0)).label("pr_tot"),
        func.sum(case((and_(prac, entered), 1), else_=0)).label("pr_ent"),
        func.sum(case((internal, 1), else_=0)).label("it_tot"),
        func.sum(case((and_(internal, entered), 1), else_=0)).label("it_ent"),
        func.count().label("tot"),
        func.sum(case((entered, 1), else_=0)).label("ent"),
    ).group_by(ExamMark.course_id, ExamMark.semester)

    conds = []
    if course_id:
        conds.append(ExamMark.course_id == course_id)
    if semester:
        conds.append(ExamMark.semester == semester)
    if conds:
        stmt = stmt.where(*conds)

    out = []
    for r in db.execute(stmt).all():
        out.append({
            "course_id": r.course_id, "course_name": r.course_name, "semester": r.semester,
            "students": r.students,
            "theory": _pct(r.th_ent, r.th_tot),
            "practical": _pct(r.pr_ent, r.pr_tot),
            "internal": _pct(r.it_ent, r.it_tot),
            "total": _pct(r.ent, r.tot),
        })
    out.sort(key=lambda x: (x["course_id"] or "", x["semester"] or ""))
    return out


def paper_list(db: Session, *, course_id: str, semester: str) -> list[dict]:
    entered = ExamMark.mark1.isnot(None)
    rows = db.execute(
        select(
            ExamMark.paper_code, ExamMark.paper_type,
            func.max(ExamMark.paper_name).label("paper_name"),
            func.max(ExamMark.mm).label("mm"), func.max(ExamMark.pm).label("pm"),
            func.count().label("total"),
            func.sum(case((entered, 1), else_=0)).label("entered"),
        )
        .where(ExamMark.course_id == course_id, ExamMark.semester == semester)
        .group_by(ExamMark.paper_code, ExamMark.paper_type)
        .order_by(ExamMark.paper_type, ExamMark.paper_code)
    ).all()
    return [
        {
            "paper_code": r.paper_code, "paper_type": r.paper_type, "paper_name": r.paper_name,
            "mm": r.mm, "pm": r.pm, "total": r.total, "entered": int(r.entered or 0),
        }
        for r in rows
    ]


def marks_by_paper(db: Session, *, course_id: str, semester: str, paper_code: str,
                   paper_type: str, limit: int = 2000) -> list[dict]:
    rows = db.execute(
        select(ExamMark).where(
            ExamMark.course_id == course_id, ExamMark.semester == semester,
            ExamMark.paper_code == paper_code, ExamMark.paper_type == paper_type,
        ).order_by(ExamMark.rollno).limit(limit)
    ).scalars()
    return [
        {
            "id": m.id, "rollno": m.rollno, "enroll_no": m.enroll_no, "name": m.name,
            "mm": m.mm, "pm": m.pm, "mark1": m.mark1, "mark2": m.mark2,
            "locked": bool(m.mrk_lock or m.lock),
        }
        for m in rows
    ]


def search_by_roll(db: Session, rollno: str) -> list[dict]:
    rows = db.execute(
        select(ExamMark).where(ExamMark.rollno == rollno).order_by(ExamMark.paper_type, ExamMark.paper_code)
    ).scalars()
    return [
        {
            "id": m.id, "course_id": m.course_id, "semester": m.semester,
            "paper_code": m.paper_code, "paper_name": m.paper_name, "paper_type": m.paper_type,
            "mm": m.mm, "pm": m.pm, "mark1": m.mark1, "locked": bool(m.mrk_lock or m.lock),
        }
        for m in rows
    ]


def update_mark(db: Session, *, mark_id: int, marks: str, by: str) -> int:
    """Reimpl mrk_update_id: correct a single mark, keeping the old value (audit)."""
    res = db.execute(
        text("UPDATE EXAM_MARKS SET MrkOld=MARK1, MARK1=:m, CorBy=:by, "
             "CorAt=SWITCHOFFSET(SYSDATETIMEOFFSET(),'+05:30'), COADING=NULL WHERE ID=:id"),
        {"m": marks, "by": by, "id": mark_id},
    )
    db.commit()
    return res.rowcount


def apply_bulk_marks(db: Session, *, course_id: str, semester: str, paper_code: str,
                     paper_type: str, rows: list[dict], dry_run: bool, by: str) -> dict:
    """Bulk marks upload (reimpl emarks_upd_* pipeline): match rows to EXAM_MARKS by
    roll no for the given paper, skip locked, apply MARK1 (audited) unless dry_run."""
    existing: dict[str, tuple[int, bool]] = {}
    for m in db.execute(
        select(ExamMark.id, ExamMark.rollno, ExamMark.mrk_lock, ExamMark.lock).where(
            ExamMark.course_id == course_id, ExamMark.semester == semester,
            ExamMark.paper_code == paper_code, ExamMark.paper_type == paper_type,
        )
    ).all():
        existing[str(m.rollno).strip()] = (m.id, bool(m.mrk_lock or m.lock))

    matched = updated = locked = 0
    unmatched: list[str] = []
    for r in rows:
        roll = str(r.get("rollno", "")).strip()
        mark = str(r.get("mark", "")).strip()
        if not roll:
            continue
        if roll not in existing:
            unmatched.append(roll)
            continue
        matched += 1
        mark_id, is_locked = existing[roll]
        if is_locked:
            locked += 1
            continue
        if not dry_run and mark != "":
            db.execute(
                text("UPDATE EXAM_MARKS SET MrkOld=MARK1, MARK1=:m, CorBy=:by, "
                     "CorAt=SWITCHOFFSET(SYSDATETIMEOFFSET(),'+05:30') WHERE ID=:id"),
                {"m": mark, "by": by, "id": mark_id},
            )
            updated += 1
    if not dry_run:
        db.commit()
    return {
        "total": len(rows), "matched": matched, "updated": updated, "locked": locked,
        "unmatched_count": len(unmatched), "unmatched_sample": unmatched[:20], "dry_run": dry_run,
    }
