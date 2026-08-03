import AssignmentIcon from "@mui/icons-material/Assignment";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PrintIcon from "@mui/icons-material/Print";
import { Box, Card, CardContent, Chip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";

import { degreeDashboard, degreeList, type DegreeRow } from "../../api/support";
import { ChartCard, DonutChart } from "../../components/charts/Charts";
import { DataTable } from "../../components/DataTable";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { StaggerItem, StaggerRow } from "../../components/motion";
import { StatCard } from "../../components/StatCard";
import { StatCardsSkeleton, TableSkeleton } from "../../components/Skeletons";

const columns: GridColDef<DegreeRow>[] = [
  { field: "enroll_no", headerName: "Enrollment", width: 160 },
  { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
  { field: "course", headerName: "Course", width: 160 },
  {
    field: "division",
    headerName: "Division",
    width: 130,
    valueGetter: (_v, row) => row.division || "—",
  },
  {
    field: "verified",
    headerName: "Verified",
    width: 120,
    renderCell: (params) =>
      params.value === "Y" ? <Chip size="small" color="success" label="Yes" /> : <Chip size="small" variant="outlined" label="No" />,
  },
  {
    field: "delivered",
    headerName: "Delivered",
    width: 120,
    renderCell: (params) =>
      params.value === "Y" ? <Chip size="small" color="success" label="Yes" /> : <Chip size="small" variant="outlined" label="No" />,
  },
];

export default function DegreePage() {
  const dash = useQuery({ queryKey: ["deg-dash"], queryFn: degreeDashboard });
  const list = useQuery({ queryKey: ["deg-list"], queryFn: () => degreeList({}) });

  const d = dash.data;

  return (
    <Box>
      <PageHeader title="Degree / Convocation" subtitle="Application, printing and delivery status of degrees." />

      {dash.isLoading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <StaggerRow>
          <StaggerItem grow>
            <StatCard label="Applied" value={d?.applied ?? 0} icon={<AssignmentIcon />} color="#3b82f6" />
          </StaggerItem>
          <StaggerItem grow>
            <StatCard label="Pending" value={d?.pending ?? 0} icon={<HourglassEmptyIcon />} color="#f59e0b" />
          </StaggerItem>
          <StaggerItem grow>
            <StatCard label="Under Printing" value={d?.printing ?? 0} icon={<PrintIcon />} color="#8b5cf6" />
          </StaggerItem>
          <StaggerItem grow>
            <StatCard label="Delivered" value={d?.delivered ?? 0} icon={<LocalShippingIcon />} color="#10b981" />
          </StaggerItem>
        </StaggerRow>
      )}

      {d && (
        <Box sx={{ mt: 3, maxWidth: 480 }}>
          <ChartCard title="Degree Status" height={260}>
            <DonutChart
              data={[
                { label: "Pending", value: d.pending, color: "#f59e0b" },
                { label: "Printing", value: d.printing, color: "#8b5cf6" },
                { label: "Delivered", value: d.delivered, color: "#10b981" },
              ]}
            />
          </ChartCard>
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        {list.isLoading ? (
          <TableSkeleton />
        ) : (list.data ?? []).length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState title="No degree records" subtitle="No degree applications found." />
            </CardContent>
          </Card>
        ) : (
          <DataTable
            rows={list.data ?? []}
            columns={columns}
            getRowId={(r) => r.id}
            loading={list.isFetching}
          />
        )}
      </Box>
    </Box>
  );
}
