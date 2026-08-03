"""PDF generation (reportlab, pure-Python) — replaces the legacy iText7 Control/ outputs."""
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

UNIVERSITY = "Pandit Shambhu Nath Shukla Vishwavidyalaya, Shahdol (M.P.)"


def marksheet_pdf(marksheets: list[dict]) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=14 * mm, bottomMargin=14 * mm,
                            leftMargin=14 * mm, rightMargin=14 * mm)
    styles = getSampleStyleSheet()
    story: list = []

    for i, m in enumerate(marksheets):
        if i:
            story.append(Spacer(1, 14))
        story.append(Paragraph(UNIVERSITY, styles["Title"]))
        story.append(Paragraph(
            f"Statement of Marks &mdash; {m.get('course_name') or ''} &middot; {m.get('semester') or ''}",
            styles["Heading3"],
        ))
        story.append(Paragraph(
            f"<b>Name:</b> {m.get('name') or ''} &nbsp; <b>Roll No:</b> {m.get('rollno') or ''} "
            f"&nbsp; <b>Enrollment:</b> {m.get('enroll_no') or ''}", styles["Normal"],
        ))
        story.append(Paragraph(
            f"<b>Father:</b> {m.get('father_name') or ''} &nbsp; <b>Exam:</b> {m.get('exam_month') or ''} "
            f"&nbsp; <b>Marksheet No:</b> {m.get('marksheet_no') or ''}", styles["Normal"],
        ))
        story.append(Spacer(1, 6))

        data = [["Code", "Paper", "Max", "Total", "Grade", "Status"]]
        for p in m.get("papers", []):
            data.append([
                p.get("code"), (p.get("name") or "")[:46], p.get("max"),
                p.get("total"), p.get("grade") or "-", p.get("status") or "-",
            ])
        table = Table(data, repeatRows=1, colWidths=[60, 230, 40, 45, 45, 45])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(table)
        story.append(Spacer(1, 8))
        story.append(Paragraph(
            f"<b>SGPA:</b> {m.get('sgpa') or '-'} &nbsp;&nbsp; <b>CGPA:</b> {m.get('grand_cgpa') or '-'} "
            f"&nbsp;&nbsp; <b>Division:</b> {m.get('grand_division') or '-'} "
            f"&nbsp;&nbsp; <b>Result:</b> {m.get('result') or m.get('grand_result') or '-'}",
            styles["Heading4"],
        ))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()
