import { Box, Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { GridColDef } from "@mui/x-data-grid";

import { myExamForms, type EnrollmentDetail } from "../../api/student";
import { PageHeader } from "../../components/PageHeader";
import { DataTable } from "../../components/DataTable";
import { TableSkeleton } from "../../components/Skeletons";

const columns: GridColDef<EnrollmentDetail>[] = [
  { field: "session", headerName: "Session", width: 130, valueGetter: (v) => v || "—" },
  {
    field: "course_name",
    headerName: "Course",
    flex: 1,
    minWidth: 200,
    valueGetter: (_v, row) => row.course_name || row.course_id || "—",
  },
  { field: "semester", headerName: "Semester", width: 120, valueGetter: (v) => v || "—" },
  { field: "roll_no", headerName: "Roll No", width: 130, valueGetter: (v) => v || "—" },
  {
    field: "acd_fee",
    headerName: "Academic Fee",
    width: 140,
    renderCell: (p) =>
      p.value === "Y" ? <Chip size="small" color="success" label="Paid" /> : <span>—</span>,
  },
  {
    field: "form_status",
    headerName: "Form Status",
    width: 150,
    renderCell: (p) => <Chip size="small" label={p.value || "—"} />,
  },
];

export default function MyExamFormsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["my-exam-forms"], queryFn: myExamForms });

  return (
    <Box>
      <PageHeader title="Exam Forms" subtitle="Your enrolment and exam form status." />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable rows={data} columns={columns} getRowId={(r) => r.pk} />
      )}
    </Box>
  );
}
