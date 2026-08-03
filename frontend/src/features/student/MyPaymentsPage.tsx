import { Box, Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import type { GridColDef } from "@mui/x-data-grid";

import { myPayments, type PaymentOut } from "../../api/student";
import { PageHeader } from "../../components/PageHeader";
import { DataTable } from "../../components/DataTable";
import { TableSkeleton } from "../../components/Skeletons";

function statusColor(s: string | null): "success" | "error" | "warning" {
  const v = (s || "Incomplete").toUpperCase();
  if (v === "SUCCESS") return "success";
  if (v.includes("FAIL")) return "error";
  return "warning";
}

const columns: GridColDef<PaymentOut>[] = [
  { field: "token", headerName: "Order / Token", width: 160 },
  { field: "fee_for", headerName: "Particulars", flex: 1, minWidth: 200, valueGetter: (v) => v || "—" },
  {
    field: "total_amt",
    headerName: "Amount",
    width: 130,
    valueGetter: (_v, row) => Number(row.total_amt || row.fee_total || row.fee || 0),
    renderCell: (p) => `₹${p.value}`,
  },
  { field: "transaction_no", headerName: "Txn No.", width: 170, valueGetter: (v) => v || "—" },
  {
    field: "payment_date",
    headerName: "Date",
    width: 190,
    valueGetter: (_v, row) => (row.payment_date || row.created || "").slice(0, 19).replace("T", " "),
  },
  {
    field: "status",
    headerName: "Status",
    width: 140,
    renderCell: (p) => (
      <Chip size="small" label={p.value || "Incomplete"} color={statusColor(p.value as string | null)} />
    ),
  },
];

export default function MyPaymentsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["my-payments"], queryFn: myPayments });

  return (
    <Box>
      <PageHeader title="My Payments" subtitle="History of your fee transactions." />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable rows={data} columns={columns} getRowId={(r) => r.token} />
      )}
    </Box>
  );
}
