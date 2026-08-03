import { useMemo, useState } from "react";

import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { Box, Button, Card, CardContent, Stack, TextField } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";

import { feesCollection, feesDashboard, type FeesRow } from "../../api/support";
import { AreaChartCard, ChartCard } from "../../components/charts/Charts";
import { DataTable } from "../../components/DataTable";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { StaggerItem, StaggerRow } from "../../components/motion";
import { StatCard } from "../../components/StatCard";
import { StatCardsSkeleton, TableSkeleton } from "../../components/Skeletons";

const columns: GridColDef<FeesRow>[] = [
  { field: "order_id", headerName: "Order", width: 150 },
  {
    field: "student_name",
    headerName: "Student",
    flex: 1,
    minWidth: 200,
    valueGetter: (_v, row) => row.student_name || row.enroll_no || "—",
  },
  { field: "fee_for", headerName: "Particulars", width: 200 },
  {
    field: "amount",
    headerName: "Amount",
    width: 140,
    type: "number",
    renderCell: (params) => `₹${(params.value as number).toLocaleString()}`,
  },
  {
    field: "pay_date",
    headerName: "Date",
    width: 130,
    valueGetter: (_v, row) => (row.pay_date || "").slice(0, 10),
  },
];

export default function FeesReportPage() {
  const [from, setFrom] = useState("2025-06-01");
  const [to, setTo] = useState("2025-06-30");
  const [query, setQuery] = useState<{ from: string; to: string } | null>(null);

  const dash = useQuery({ queryKey: ["fees-dash"], queryFn: feesDashboard });
  const coll = useQuery({
    queryKey: ["fees-coll", query],
    queryFn: () => feesCollection(query!.from, query!.to),
    enabled: Boolean(query),
  });

  const daily = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of coll.data ?? []) {
      const day = (r.pay_date || "").slice(0, 10);
      if (!day) continue;
      map.set(day, (map.get(day) ?? 0) + r.amount);
    }
    const xLabels = [...map.keys()].sort();
    return { xLabels, data: xLabels.map((d) => map.get(d) ?? 0) };
  }, [coll.data]);

  return (
    <Box>
      <PageHeader
        title="Fees Collection"
        subtitle="Daily collection dashboard and date-range reports."
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              type="date"
              size="small"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <Button variant="contained" onClick={() => setQuery({ from, to })}>
              Report
            </Button>
          </Stack>
        }
      />

      {dash.isLoading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <StaggerRow>
          <StaggerItem grow>
            <StatCard
              label="Today Collection"
              value={dash.data?.today.amount ?? 0}
              prefix="₹"
              icon={<PaymentsIcon />}
              color="#10b981"
            />
          </StaggerItem>
          <StaggerItem grow>
            <StatCard
              label="Today Txns"
              value={dash.data?.today.count ?? 0}
              icon={<ReceiptLongIcon />}
              color="#4f46e5"
            />
          </StaggerItem>
          <StaggerItem grow>
            <StatCard
              label="Yesterday Collection"
              value={dash.data?.yesterday.amount ?? 0}
              prefix="₹"
              icon={<PaymentsIcon />}
              color="#0ea5e9"
            />
          </StaggerItem>
          <StaggerItem grow>
            <StatCard
              label="Yesterday Txns"
              value={dash.data?.yesterday.count ?? 0}
              icon={<ReceiptLongIcon />}
              color="#f59e0b"
            />
          </StaggerItem>
        </StaggerRow>
      )}

      {query && daily.xLabels.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <ChartCard title="Daily Collection" height={260}>
            <AreaChartCard xLabels={daily.xLabels} data={daily.data} label="Amount (₹)" color="#10b981" />
          </ChartCard>
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        {!query ? (
          <Card>
            <CardContent>
              <EmptyState title="Run a report" subtitle="Pick a date range and click Report to load collections." />
            </CardContent>
          </Card>
        ) : coll.isLoading ? (
          <TableSkeleton />
        ) : (coll.data ?? []).length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState title="No collections" subtitle="No fee transactions in this date range." />
            </CardContent>
          </Card>
        ) : (
          <DataTable
            rows={coll.data ?? []}
            columns={columns}
            getRowId={(r) => r.order_id}
            loading={coll.isFetching}
          />
        )}
      </Box>
    </Box>
  );
}
