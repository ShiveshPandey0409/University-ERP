import { useEffect, useState } from "react";

import { Box, Button, Chip, Tab, Tabs } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type { GridColDef } from "@mui/x-data-grid";

import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import {
  admDashboard,
  admForms,
  admMerit,
  admReport,
  admVerify,
  type AdmForm,
  type CatGender,
} from "../../api/admission";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { StatCardsSkeleton, TableSkeleton } from "../../components/Skeletons";
import { StaggerItem, StaggerRow } from "../../components/motion";
import { DataTable } from "../../components/DataTable";
import { EmptyState } from "../../components/EmptyState";
import { BarChartCard, ChartCard } from "../../components/charts/Charts";
import { toast } from "../../components/toast";

function courseLabel(f: { course_name: string | null; major: string | null }) {
  return [f.course_name, f.major].filter(Boolean).join(" · ") || "—";
}

export default function AdmissionPage() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const tabParam = params.get("tab");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    setTab(tabParam === "merit" ? 1 : tabParam === "report" ? 2 : 0);
  }, [tabParam]);

  const dash = useQuery({ queryKey: ["adm-dash"], queryFn: admDashboard });
  const forms = useQuery({ queryKey: ["adm-forms"], queryFn: () => admForms({}) });
  const merit = useQuery({ queryKey: ["adm-merit"], queryFn: admMerit });
  const report = useQuery({ queryKey: ["adm-report"], queryFn: admReport });

  async function verify(reg: string) {
    await admVerify(reg);
    toast.success("Verified");
    ["adm-dash", "adm-forms", "adm-merit", "adm-report"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    );
  }

  const formCols: GridColDef<AdmForm>[] = [
    { field: "reg_no", headerName: "Reg No", width: 130 },
    { field: "student_name", headerName: "Name", flex: 1, minWidth: 180 },
    {
      field: "course_name",
      headerName: "Course",
      flex: 1,
      minWidth: 200,
      valueGetter: (_, row) => courseLabel(row),
    },
    {
      field: "category",
      headerName: "Category",
      width: 120,
      renderCell: (p) => (p.value ? <Chip size="small" label={p.value} /> : null),
    },
    {
      field: "verify",
      headerName: "Status",
      width: 130,
      renderCell: (p) =>
        p.value === "Y" ? (
          <Chip size="small" color="success" label="Verified" />
        ) : (
          <Chip size="small" color="warning" label="Pending" />
        ),
    },
    {
      field: "actions",
      headerName: "",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (p) =>
        p.row.verify !== "Y" ? (
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              verify(p.row.reg_no);
            }}
          >
            Verify
          </Button>
        ) : null,
    },
  ];

  const meritCols: GridColDef<AdmForm>[] = [
    { field: "rank", headerName: "Rank", width: 90 },
    { field: "student_name", headerName: "Name", flex: 1, minWidth: 180 },
    {
      field: "course_name",
      headerName: "Course",
      flex: 1,
      minWidth: 200,
      valueGetter: (_, row) => courseLabel(row),
    },
    { field: "merit_cgpa", headerName: "Merit CGPA", width: 130, type: "number" },
  ];

  const reportCols: GridColDef<CatGender>[] = [
    { field: "category", headerName: "Category", flex: 1, minWidth: 160 },
    { field: "male", headerName: "Male", width: 120, type: "number" },
    { field: "female", headerName: "Female", width: 120, type: "number" },
    { field: "total", headerName: "Total", width: 120, type: "number" },
  ];

  const reportRows = report.data ?? [];

  return (
    <Box>
      <PageHeader title="Admissions" subtitle="Applications, merit list and category-wise reporting." />

      {dash.isLoading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <StaggerRow>
          <StaggerItem key="received" grow>
            <StatCard
              label="Received"
              value={dash.data?.received ?? 0}
              icon={<AssignmentIndOutlinedIcon />}
              color="#3b82f6"
            />
          </StaggerItem>
          <StaggerItem key="verified" grow>
            <StatCard
              label="Verified"
              value={dash.data?.verified ?? 0}
              icon={<VerifiedOutlinedIcon />}
              color="#10b981"
            />
          </StaggerItem>
          <StaggerItem key="pending" grow>
            <StatCard
              label="Pending"
              value={dash.data?.pending ?? 0}
              icon={<HourglassEmptyOutlinedIcon />}
              color="#f59e0b"
            />
          </StaggerItem>
          <StaggerItem key="admitted" grow>
            <StatCard
              label="Admitted"
              value={dash.data?.admitted ?? 0}
              icon={<CheckCircleOutlineIcon />}
              color="#8b5cf6"
            />
          </StaggerItem>
        </StaggerRow>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 3, mb: 1 }}>
        <Tab label="Applications" />
        <Tab label="Merit List" />
        <Tab label="Category × Gender" />
      </Tabs>

      {tab === 0 && (
        <Box>
          {forms.isLoading ? (
            <TableSkeleton />
          ) : (forms.data ?? []).length ? (
            <DataTable
              rows={forms.data ?? []}
              columns={formCols}
              getRowId={(r) => r.reg_no}
              loading={forms.isFetching}
              height={560}
              pageSize={25}
            />
          ) : (
            <EmptyState title="No applications" subtitle="Applications will appear here once submitted." />
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box>
          {merit.isLoading ? (
            <TableSkeleton />
          ) : (merit.data ?? []).length ? (
            <DataTable
              rows={merit.data ?? []}
              columns={meritCols}
              getRowId={(r) => r.reg_no}
              loading={merit.isFetching}
              height={560}
              pageSize={25}
            />
          ) : (
            <EmptyState title="No merit data" />
          )}
        </Box>
      )}

      {tab === 2 && (
        <Box>
          {report.isLoading ? (
            <TableSkeleton />
          ) : reportRows.length ? (
            <>
              <DataTable
                rows={reportRows}
                columns={reportCols}
                getRowId={(r) => r.category}
                loading={report.isFetching}
                height={420}
                pageSize={25}
              />
              <Box sx={{ mt: 3 }}>
                <ChartCard title="Category × Gender">
                  <BarChartCard
                    xLabels={reportRows.map((r) => r.category)}
                    series={[
                      { data: reportRows.map((r) => r.male), label: "Male", color: "#3b82f6" },
                      { data: reportRows.map((r) => r.female), label: "Female", color: "#ec4899" },
                    ]}
                  />
                </ChartCard>
              </Box>
            </>
          ) : (
            <EmptyState title="No report data" />
          )}
        </Box>
      )}
    </Box>
  );
}
