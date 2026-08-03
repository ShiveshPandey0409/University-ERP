import { useState } from "react";

import { Box, Card, CardContent, Chip, MenuItem, Stack, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { GridColDef } from "@mui/x-data-grid";

import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";

import { grievanceCategories, grievanceComplaints, grievanceStatus, type Complaint } from "../../api/support";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { StatCardsSkeleton, TableSkeleton } from "../../components/Skeletons";
import { StaggerItem, StaggerRow } from "../../components/motion";
import { ChartCard, DonutChart } from "../../components/charts/Charts";
import { DataTable } from "../../components/DataTable";
import { EmptyState } from "../../components/EmptyState";

export default function GrievancePage() {
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const counts = useQuery({ queryKey: ["grievance-status"], queryFn: grievanceStatus });
  const cats = useQuery({ queryKey: ["grievance-cats"], queryFn: grievanceCategories });
  const list = useQuery({
    queryKey: ["grievance-list", status, category],
    queryFn: () => grievanceComplaints({ status: status || undefined, category: category || undefined }),
  });

  const c = counts.data;
  const rows = list.data ?? [];

  const columns: GridColDef<Complaint>[] = [
    { field: "id", headerName: "#", width: 80 },
    { field: "category", headerName: "Category", width: 180, valueGetter: (v) => v || "—" },
    {
      field: "details",
      headerName: "Details",
      flex: 1,
      minWidth: 260,
      sortable: false,
      renderCell: (p) => (
        <span dangerouslySetInnerHTML={{ __html: String(p.value || "").slice(0, 140) }} />
      ),
    },
    { field: "assign", headerName: "Assigned", width: 160, valueGetter: (v) => v || "—" },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.value || "Open"}
          color={p.value === "Closed" ? "success" : "warning"}
        />
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Grievances"
        subtitle="Track and resolve student complaints."
        actions={
          <Stack direction="row" spacing={1.5}>
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ width: 150 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Open">Open</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
              <MenuItem value="Replied">Replied</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              sx={{ width: 200 }}
            >
              <MenuItem value="">All</MenuItem>
              {(cats.data ?? []).map((cat) => (
                <MenuItem key={cat.id} value={cat.categ ?? ""}>
                  {cat.categ}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
      />

      {counts.isLoading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <StaggerRow>
          <StaggerItem key="open" grow>
            <StatCard label="Open" value={c?.opened ?? 0} icon={<HelpOutlineOutlinedIcon />} color="#f59e0b" />
          </StaggerItem>
          <StaggerItem key="not_assigned" grow>
            <StatCard
              label="Not Assigned"
              value={c?.not_assigned ?? 0}
              icon={<ReportProblemOutlinedIcon />}
              color="#ef4444"
            />
          </StaggerItem>
          <StaggerItem key="assigned" grow>
            <StatCard
              label="Assigned"
              value={c?.assigned ?? 0}
              icon={<AssignmentIndOutlinedIcon />}
              color="#3b82f6"
            />
          </StaggerItem>
          <StaggerItem key="closed" grow>
            <StatCard label="Closed" value={c?.closed ?? 0} icon={<DoneAllOutlinedIcon />} color="#10b981" />
          </StaggerItem>
        </StaggerRow>
      )}

      <Box sx={{ mt: 3, mb: 3, maxWidth: 420 }}>
        <ChartCard title="Complaints Breakdown">
          <DonutChart
            data={[
              { label: "Open", value: c?.opened ?? 0, color: "#f59e0b" },
              { label: "Assigned", value: c?.assigned ?? 0, color: "#3b82f6" },
              { label: "Closed", value: c?.closed ?? 0, color: "#10b981" },
            ]}
          />
        </ChartCard>
      </Box>

      {list.isLoading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="No complaints found" subtitle="Adjust the filters to see more results." />
          </CardContent>
        </Card>
      ) : (
        <DataTable rows={rows} columns={columns} getRowId={(r) => r.id} />
      )}
    </Box>
  );
}
