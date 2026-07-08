"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORIES = [
  ["admission_form", "Admission Form Problem"],
  ["admission_payment", "Admission Payment"],
  ["admitcard_withheld", "AdmitCard Withheld"],
  ["result", "Result"],
  ["degree", "Degree"],
  ["marksheet", "Marksheet"],
  ["other", "Others"],
] as const;

interface RegisterResponse {
  ticketNo: string;
  status: string;
  message: string;
}
interface TrackResponse {
  found: boolean;
  ticketNo?: string;
  status?: string;
  category?: string;
  replies?: { message: string; createdAt: string }[];
}

export default function GrievancePage() {
  const [form, setForm] = useState({
    category: "other",
    name: "",
    fatherName: "",
    mobile: "",
    enrollmentNo: "",
    rollNo: "",
    subject: "",
    body: "",
  });
  const [registered, setRegistered] = useState<RegisterResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [ticketNo, setTicketNo] = useState("");
  const [tracked, setTracked] = useState<TrackResponse | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
      const res = await apiFetch<RegisterResponse>("/public/grievance/register", { method: "POST", body });
      setRegistered(res);
    } catch (e) {
      setErr(e instanceof ApiRequestError ? e.message : "Could not register complaint");
    } finally {
      setBusy(false);
    }
  };

  const track = async (e: React.FormEvent) => {
    e.preventDefault();
    setTracked(await apiFetch<TrackResponse>("/public/grievance/search", { method: "POST", body: { ticketNo } }));
  };

  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Back to portal
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Register a Grievance</CardTitle>
            <CardDescription>Submit a complaint and track it with the ticket number you receive.</CardDescription>
          </CardHeader>
          <CardContent>
            {registered ? (
              <div className="space-y-2 rounded-md bg-emerald-50 p-4 text-sm">
                <p className="font-medium text-emerald-900">{registered.message}</p>
                <p>
                  Your ticket number is <span className="font-mono font-semibold">{registered.ticketNo}</span>.
                </p>
                <Button variant="outline" size="sm" onClick={() => setRegistered(null)}>
                  Register another
                </Button>
              </div>
            ) : (
              <form onSubmit={register} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
                    {CATEGORIES.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Your Name" required value={form.name} onChange={(v) => set("name", v)} />
                  <Field label="Father's Name" value={form.fatherName} onChange={(v) => set("fatherName", v)} />
                  <Field label="Mobile No." required value={form.mobile} onChange={(v) => set("mobile", v)} />
                  <Field label="Enroll/Reg/Adm No." value={form.enrollmentNo} onChange={(v) => set("enrollmentNo", v)} />
                  <Field label="Roll No." value={form.rollNo} onChange={(v) => set("rollNo", v)} />
                  <Field label="Subject" value={form.subject} onChange={(v) => set("subject", v)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Your Query / Complaint</label>
                  <textarea
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={4}
                    required
                    value={form.body}
                    onChange={(e) => set("body", e.target.value)}
                  />
                </div>
                {err && <p className="text-sm text-red-600">{err}</p>}
                <Button type="submit" disabled={busy}>
                  {busy ? "Submitting…" : "Register Your Complaint"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Track a Complaint</CardTitle>
            <CardDescription>Enter your ticket number to see status and replies.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={track} className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium">Ticket Number</label>
                <Input value={ticketNo} onChange={(e) => setTicketNo(e.target.value)} placeholder="GRV-XXXXXXXX" required />
              </div>
              <Button type="submit">Search Your Complaint</Button>
            </form>
            {tracked && !tracked.found && (
              <p className="mt-4 text-sm text-muted-foreground">No complaint found for that ticket number.</p>
            )}
            {tracked?.found && (
              <div className="mt-4 space-y-3 text-sm">
                <p>
                  Status: <span className="font-semibold uppercase">{tracked.status}</span> · Category: {tracked.category}
                </p>
                {tracked.replies && tracked.replies.length > 0 ? (
                  <div className="space-y-2">
                    {tracked.replies.map((r, i) => (
                      <div key={i} className="rounded-md border bg-white p-3">
                        <p>{r.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No replies yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Input value={value} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
