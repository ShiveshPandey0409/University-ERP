import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useParams } from "react-router-dom";
import type { GridColDef } from "@mui/x-data-grid";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { getStudent, type EnrollmentOut } from "../../api/students";
import { PageHeader } from "../../components/PageHeader";
import { DataTable } from "../../components/DataTable";
import { EmptyState } from "../../components/EmptyState";
import { CardSkeleton } from "../../components/Skeletons";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box sx={{ minWidth: 180, flex: "1 1 180px" }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Box>
  );
}

const enrollCols: GridColDef<EnrollmentOut>[] = [
  { field: "session", headerName: "Session", width: 120 },
  {
    field: "course_name",
    headerName: "Course",
    flex: 1,
    minWidth: 200,
    valueGetter: (_, row) => row.course_name || row.course_id || "—",
  },
  { field: "semester", headerName: "Semester", width: 110 },
  { field: "roll_no", headerName: "Roll No", width: 130 },
  {
    field: "status",
    headerName: "Status",
    width: 130,
    renderCell: (p) => (p.value ? <Chip size="small" label={p.value} color="primary" /> : null),
  },
  {
    field: "form_status",
    headerName: "Form",
    width: 130,
    renderCell: (p) => (p.value ? <Chip size="small" label={p.value} variant="outlined" /> : null),
  },
];

export default function StudentProfilePage() {
  const { enroll = "" } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["student", enroll],
    queryFn: () => getStudent(enroll),
  });

  const backLink = (
    <Typography
      component={RouterLink}
      to="/students"
      variant="body2"
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mb: 2, textDecoration: "none" }}
    >
      <ArrowBackIcon fontSize="small" /> Back to students
    </Typography>
  );

  if (isLoading) {
    return (
      <Box>
        {backLink}
        <CardSkeleton height={200} />
        <Box sx={{ mt: 3 }}>
          <CardSkeleton height={360} />
        </Box>
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box>
        {backLink}
        <EmptyState title="Student not found" subtitle="This enrollment number does not exist." />
      </Box>
    );
  }

  return (
    <Box>
      {backLink}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              src={data.photo_url ?? undefined}
              sx={{ width: 84, height: 100 }}
              variant="rounded"
            />
            <Box>
              <Typography variant="h6">{data.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {data.enroll_no}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                {data.category && <Chip size="small" label={data.category} />}
                {data.gender && <Chip size="small" label={data.gender} />}
                {data.prof_status && <Chip size="small" color="primary" label={data.prof_status} />}
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          <Stack direction="row" flexWrap="wrap" gap={2.5}>
            <Field label="Father's Name" value={data.father_name} />
            <Field label="Mother's Name" value={data.mother_name} />
            <Field label="Date of Birth" value={data.dob} />
            <Field label="Mobile" value={data.mobile} />
            <Field label="Email" value={data.email} />
            <Field label="Address" value={data.address1} />
            <Field label="City" value={data.city1} />
            <Field label="State" value={data.state1} />
            <Field label="EWS" value={data.ews} />
          </Stack>
        </CardContent>
      </Card>

      <PageHeader title="Enrollments" />

      {data.enrollments.length ? (
        <DataTable
          rows={data.enrollments}
          columns={enrollCols}
          getRowId={(r) => `${r.session}-${r.course_id}-${r.semester}`}
          height={420}
          pageSize={25}
        />
      ) : (
        <EmptyState title="No enrollments" subtitle="This student has no enrollment records." />
      )}
    </Box>
  );
}
