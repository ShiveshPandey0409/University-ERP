import { Box, Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { GridColDef } from "@mui/x-data-grid";

import { listStudents, type StudentListItem } from "../../api/students";
import { PageHeader } from "../../components/PageHeader";
import { DataTable } from "../../components/DataTable";
import { EmptyState } from "../../components/EmptyState";
import { TableSkeleton } from "../../components/Skeletons";

const columns: GridColDef<StudentListItem>[] = [
  { field: "enroll_no", headerName: "Enrollment No", width: 170 },
  { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
  { field: "father_name", headerName: "Father's Name", flex: 1, minWidth: 160 },
  {
    field: "category",
    headerName: "Category",
    width: 120,
    renderCell: (p) => (p.value ? <Chip size="small" label={p.value} /> : null),
  },
  { field: "gender", headerName: "Gender", width: 100 },
  { field: "mobile", headerName: "Mobile", width: 140 },
];

export default function StudentsListPage() {
  const navigate = useNavigate();

  const { data = [], isLoading, isFetching } = useQuery({
    queryKey: ["students", ""],
    queryFn: () => listStudents(""),
  });

  return (
    <Box>
      <PageHeader title="Students" subtitle="Search, sort and export the student directory." />

      <Box sx={{ mt: 1 }}>
        {isLoading ? (
          <TableSkeleton />
        ) : data.length ? (
          <DataTable
            rows={data}
            columns={columns}
            getRowId={(r) => r.enroll_no}
            loading={isFetching}
            onRowClick={(p) => navigate(`/students/${encodeURIComponent(String(p.row.enroll_no))}`)}
            height={560}
            pageSize={25}
          />
        ) : (
          <EmptyState title="No students found" subtitle="Try adjusting your search." />
        )}
      </Box>
    </Box>
  );
}
