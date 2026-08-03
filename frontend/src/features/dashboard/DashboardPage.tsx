import { Box, Button, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";

import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";

import { admDashboard } from "../../api/admission";
import { degreeDashboard, feesDashboard, grievanceStatus } from "../../api/support";
import { useAuth } from "../../app/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { StatCardsSkeleton } from "../../components/Skeletons";
import { StaggerItem, StaggerRow } from "../../components/motion";
import { ChartCard, DonutChart } from "../../components/charts/Charts";

const staffLinks: [string, string][] = [
  ["Admissions", "/admission"],
  ["Students", "/students"],
  ["Marks Entry", "/emarks"],
  ["Results", "/results"],
  ["Grievances", "/grievance"],
  ["Fees", "/fees"],
  ["Degree", "/degree"],
  ["Notices", "/notices"],
];

const studentLinks: [string, string][] = [
  ["My Profile", "/me/profile"],
  ["My Payments", "/me/payments"],
  ["My Result", "/me/result"],
];

export default function DashboardPage() {
  const { me } = useAuth();
  const isStaff = me?.auth !== "Student";

  const adm = useQuery({ queryKey: ["adm-dash"], queryFn: admDashboard, enabled: isStaff });
  const fees = useQuery({ queryKey: ["fees-dash"], queryFn: feesDashboard, enabled: isStaff });
  const degree = useQuery({ queryKey: ["degree-dash"], queryFn: degreeDashboard, enabled: isStaff });
  const grievance = useQuery({ queryKey: ["grievance-status"], queryFn: grievanceStatus, enabled: isStaff });

  if (!isStaff) {
    return (
      <Box>
        <PageHeader
          title={`Welcome, ${me?.username ?? ""}`}
          subtitle="Your student portal at a glance."
        />
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {studentLinks.map(([label, to], i) => (
            <Button key={to} component={RouterLink} to={to} variant={i === 0 ? "contained" : "outlined"}>
              {label}
            </Button>
          ))}
        </Stack>
      </Box>
    );
  }

  const isLoading = adm.isLoading || fees.isLoading || degree.isLoading || grievance.isLoading;
  const g = grievance.data;

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${me?.username ?? ""}`}
        subtitle={`Portal: ${me?.auth || "—"}`}
      />

      {isLoading ? (
        <StatCardsSkeleton count={5} />
      ) : (
        <StaggerRow>
          <StaggerItem key="received" grow>
            <StatCard
              label="Admissions Received"
              value={adm.data?.received ?? 0}
              icon={<AssignmentIndOutlinedIcon />}
              color="#3b82f6"
            />
          </StaggerItem>
          <StaggerItem key="verified" grow>
            <StatCard
              label="Verified"
              value={adm.data?.verified ?? 0}
              icon={<VerifiedOutlinedIcon />}
              color="#10b981"
            />
          </StaggerItem>
          <StaggerItem key="fees" grow>
            <StatCard
              label="Today's Fees"
              value={fees.data?.today.amount ?? 0}
              icon={<CurrencyRupeeOutlinedIcon />}
              color="#f59e0b"
              prefix="₹"
              subtext={`${fees.data?.today.count ?? 0} transactions today`}
            />
          </StaggerItem>
          <StaggerItem key="grievance" grow>
            <StatCard
              label="Open Grievances"
              value={g?.opened ?? 0}
              icon={<SupportAgentOutlinedIcon />}
              color="#ef4444"
            />
          </StaggerItem>
          <StaggerItem key="degree" grow>
            <StatCard
              label="Degrees Applied"
              value={degree.data?.applied ?? 0}
              icon={<WorkspacePremiumOutlinedIcon />}
              color="#8b5cf6"
            />
          </StaggerItem>
        </StaggerRow>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 3 }}>
        <Box sx={{ flex: 1, minWidth: 280 }}>
          <ChartCard title="Grievances">
            <DonutChart
              data={[
                { label: "Open", value: g?.opened ?? 0, color: "#ef4444" },
                { label: "Assigned", value: g?.assigned ?? 0, color: "#f59e0b" },
                { label: "Closed", value: g?.closed ?? 0, color: "#10b981" },
              ]}
            />
          </ChartCard>
        </Box>
        <Box sx={{ flex: 1, minWidth: 280 }}>
          <ChartCard title="Quick Links">
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ pt: 1 }}>
              {staffLinks.map(([label, to]) => (
                <Button
                  key={to}
                  component={RouterLink}
                  to={to}
                  variant="outlined"
                  startIcon={
                    to === "/students" ? (
                      <PersonOutlineOutlinedIcon />
                    ) : to === "/results" ? (
                      <SchoolOutlinedIcon />
                    ) : undefined
                  }
                >
                  {label}
                </Button>
              ))}
            </Stack>
          </ChartCard>
        </Box>
      </Stack>
    </Box>
  );
}
