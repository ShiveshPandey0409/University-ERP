"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Paginated {
  total: number;
}

function StatCard({ title, permission, queryKey, path }: {
  title: string;
  permission: string;
  queryKey: string;
  path: string;
}) {
  const { hasPermission } = useSession();
  const enabled = hasPermission(permission);
  const { data } = useQuery({
    queryKey: [queryKey],
    queryFn: () => apiFetch<Paginated>(path),
    enabled,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{enabled ? (data?.total ?? "…") : "—"}</div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useSession();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.displayName}.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Courses" permission="masterdata.course.manage" queryKey="dash-courses" path="/admin/master/courses?pageSize=1" />
        <StatCard title="Students" permission="academic.student.read" queryKey="dash-students" path="/admin/academic/students?pageSize=1" />
        <StatCard title="Users" permission="system.user.manage" queryKey="dash-users" path="/admin/system/users?pageSize=1" />
      </div>
    </div>
  );
}
