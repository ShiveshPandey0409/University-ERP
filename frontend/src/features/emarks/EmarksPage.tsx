import { useState } from "react";

import BarChartIcon from "@mui/icons-material/BarChart";
import GroupsIcon from "@mui/icons-material/Groups";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PercentIcon from "@mui/icons-material/Percent";
import ScienceIcon from "@mui/icons-material/Science";
import { Box, Button, Card, CardContent, Chip, Stack, TextField } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";

import { entryStatus, paperList, type PaperItem } from "../../api/emarks";
import { BarChartCard, ChartCard } from "../../components/charts/Charts";
import { DataTable } from "../../components/DataTable";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { StaggerItem, StaggerRow } from "../../components/motion";
import { StatCard } from "../../components/StatCard";
import { StatCardsSkeleton, TableSkeleton } from "../../components/Skeletons";

const paperColumns: GridColDef<PaperItem>[] = [
  { field: "paper_code", headerName: "Paper Code", width: 140 },
  {
    field: "paper_type",
    headerName: "Type",
    width: 130,
    renderCell: (params) =>
      params.value ? <Chip size="small" variant="outlined" label={params.value} /> : "—",
  },
  { field: "paper_name", headerName: "Paper Name", flex: 1, minWidth: 220 },
  { field: "mm", headerName: "Max Marks", width: 120 },
  { field: "entered", headerName: "Entered", width: 120, type: "number" },
  { field: "total", headerName: "Total", width: 120, type: "number" },
];

export default function EmarksPage() {
  const [courseId, setCourseId] = useState("101");
  const [semester, setSemester] = useState("II");
  const [query, setQuery] = useState({ courseId: "101", semester: "II" });

  const status = useQuery({
    queryKey: ["entry-status", query],
    queryFn: () => entryStatus(query.courseId, query.semester),
  });
  const papers = useQuery({
    queryKey: ["papers", query],
    queryFn: () => paperList(query.courseId, query.semester),
    enabled: Boolean(query.courseId && query.semester),
  });

  const s = status.data?.[0];

  return (
    <Box>
      <PageHeader
        title="Marks Entry (Emarks)"
        subtitle={s?.course_name ? `${s.course_name} · Semester ${s.semester}` : "Track marks-entry progress by course and semester"}
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              label="Course ID"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              sx={{ width: 130 }}
            />
            <TextField
              size="small"
              label="Semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              sx={{ width: 110 }}
            />
            <Button variant="contained" onClick={() => setQuery({ courseId, semester })}>
              Load
            </Button>
          </Stack>
        }
      />

      {status.isLoading ? (
        <StatCardsSkeleton count={5} />
      ) : s ? (
        <StaggerRow>
          <StaggerItem grow>
            <StatCard label="Students" value={s.students} icon={<GroupsIcon />} color="#4f46e5" />
          </StaggerItem>
          <StaggerItem grow>
            <StatCard label="Theory" value={s.theory} suffix="%" icon={<MenuBookIcon />} color="#0ea5e9" />
          </StaggerItem>
          <StaggerItem grow>
            <StatCard label="Practical" value={s.practical} suffix="%" icon={<ScienceIcon />} color="#8b5cf6" />
          </StaggerItem>
          <StaggerItem grow>
            <StatCard label="Internal" value={s.internal} suffix="%" icon={<PercentIcon />} color="#f59e0b" />
          </StaggerItem>
          <StaggerItem grow>
            <StatCard label="Total Entered" value={s.total} suffix="%" icon={<BarChartIcon />} color="#10b981" />
          </StaggerItem>
        </StaggerRow>
      ) : (
        <Card>
          <CardContent>
            <EmptyState title="No entry status" subtitle="Load a course and semester to see progress." />
          </CardContent>
        </Card>
      )}

      {s && (
        <Box sx={{ mt: 3 }}>
          <ChartCard title="Entry Progress (%)" height={260}>
            <BarChartCard
              xLabels={["Theory", "Practical", "Internal", "Total"]}
              series={[{ data: [s.theory, s.practical, s.internal, s.total], label: "Entered %", color: "#4f46e5" }]}
            />
          </ChartCard>
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        {papers.isLoading ? (
          <TableSkeleton />
        ) : (papers.data ?? []).length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState title="No papers found" subtitle="No papers for this course and semester." />
            </CardContent>
          </Card>
        ) : (
          <DataTable
            rows={papers.data ?? []}
            columns={paperColumns}
            getRowId={(r) => `${r.paper_code}-${r.paper_type}`}
            loading={papers.isFetching}
          />
        )}
      </Box>
    </Box>
  );
}
