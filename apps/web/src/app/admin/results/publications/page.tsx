"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { DataTable, type Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";

interface PublicationRow {
  id: string;
  semester: number;
  status: string;
  resultType: string;
  publishedAt: string | null;
  course: { name: string; code: string };
  examSession: { name: string; code: string };
}

const statusVariant = (s: string) =>
  s === "published" ? "success" : s === "pending_approval" ? "warning" : "muted";

export default function PublicationsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["publications"],
    queryFn: () => apiFetch<PublicationRow[]>("/admin/results/publications"),
  });

  const columns: Column<PublicationRow>[] = [
    { header: "Exam Session", cell: (r) => r.examSession.name },
    { header: "Course", cell: (r) => r.course.code },
    { header: "Sem", cell: (r) => r.semester },
    { header: "Type", cell: (r) => r.resultType },
    { header: "Status", cell: (r) => <Badge variant={statusVariant(r.status)}>{r.status.replace("_", " ")}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Result Publications</h1>
      <p className="text-sm text-muted-foreground">
        Publications move through draft → pending approval → published. Only an approver can publish.
      </p>
      <DataTable columns={columns} rows={data} isLoading={isLoading} error={error} />
    </div>
  );
}
