"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

interface ResultResponse {
  found: boolean;
  student?: { name: string; enrollmentNumber: string; course: string };
  rollNumber?: string;
  examSession?: string;
  marks?: { subject: string; code: string; total: number | null; max: number | null; grade: string | null }[];
}

export default function ResultsPage() {
  const [enrollmentNumber, setEnrollment] = useState("");
  const [rollNumber, setRoll] = useState("");
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await apiFetch<ResultResponse>("/public/results/search", {
        method: "POST",
        body: { enrollmentNumber, rollNumber },
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Back to portal
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Result Lookup</CardTitle>
            <CardDescription>Enter your enrollment number and roll number.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Enrollment No.</label>
                <Input value={enrollmentNumber} onChange={(e) => setEnrollment(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Roll No.</label>
                <Input value={rollNumber} onChange={(e) => setRoll(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Searching…" : "Search"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && !result.found && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No published result found for that enrollment and roll number.
            </CardContent>
          </Card>
        )}

        {result?.found && result.student && (
          <Card>
            <CardHeader>
              <CardTitle>{result.student.name}</CardTitle>
              <CardDescription>
                {result.student.enrollmentNumber} · {result.student.course} · Roll {result.rollNumber} ·{" "}
                {result.examSession}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Subject</TH>
                    <TH>Code</TH>
                    <TH>Marks</TH>
                    <TH>Grade</TH>
                  </TR>
                </THead>
                <TBody>
                  {result.marks?.map((m) => (
                    <TR key={m.code}>
                      <TD>{m.subject}</TD>
                      <TD>{m.code}</TD>
                      <TD>
                        {m.total ?? "—"} / {m.max ?? "—"}
                      </TD>
                      <TD>{m.grade ?? "—"}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
