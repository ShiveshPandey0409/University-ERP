"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";

interface UserRow {
  id: string;
  username: string;
  displayName: string;
  userType: string;
  status: string;
}
interface Paginated<T> {
  data: T[];
  total: number;
}

const statusVariant = (s: string) =>
  s === "active" ? "success" : s === "disabled" ? "danger" : "muted";

export default function UsersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<Paginated<UserRow>>("/admin/system/users?pageSize=50"),
  });

  const columns: Column<UserRow>[] = [
    { header: "Username", cell: (r) => r.username },
    { header: "Name", cell: (r) => r.displayName },
    { header: "Type", cell: (r) => r.userType },
    { header: "Status", cell: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Users {data ? `(${data.total})` : ""}</h1>
      <DataTable columns={columns} rows={data?.data} isLoading={isLoading} error={error} />
    </div>
  );
}
