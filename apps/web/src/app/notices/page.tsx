"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Notice {
  id: string;
  title: string;
  body: string;
  category: string | null;
  pinned: boolean;
  publishedAt: string | null;
}

export default function NoticesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-notices"],
    queryFn: () => apiFetch<Notice[]>("/public/notices"),
  });

  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Back to portal
        </Link>
        <h1 className="text-2xl font-semibold">Notice Board</h1>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">No notices published yet.</p>
        )}

        <div className="space-y-3">
          {data?.map((n) => (
            <Card key={n.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {n.pinned && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Pinned</span>}
                  {n.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                <p className="text-xs text-muted-foreground">
                  {n.category ? `${n.category} · ` : ""}
                  {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
