"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { DataTable, type Column } from "./DataTable";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label, Select } from "./ui/field";

export interface StaticOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox";
  required?: boolean;
  optionsEndpoint?: string;
  options?: StaticOption[];
  defaultValue?: unknown;
  /** false → hidden when editing (e.g. immutable natural keys). */
  editable?: boolean;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "boolean";
  optionsEndpoint?: string;
  options?: StaticOption[];
}

export interface RowAction<T> {
  label: string;
  method?: "POST" | "PATCH";
  /** Path relative to the API, e.g. (r) => `/admin/grievance/${r.id}/close`. */
  path: (row: T) => string;
  /** If set, prompt the operator for a single value sent as `{ [field]: value }`. */
  prompt?: { field: string; label: string };
  confirm?: string;
  hidden?: (row: T) => boolean;
}

export interface ResourceConfig<T> {
  title: string;
  endpoint: string;
  columns: Column<T>[];
  fields: FieldConfig[];
  filters?: FilterConfig[];
  /** Hide create/edit/delete — for action-driven modules (verify/assign/etc.). */
  readOnly?: boolean;
  /** Keep create/edit but hide delete — for modules without a DELETE endpoint. */
  noDelete?: boolean;
  /** Per-row action buttons hitting dedicated endpoints. */
  rowActions?: RowAction<T>[];
}

interface OptionRow {
  id: string;
  code?: string;
  name?: string;
}

function useOptions(endpoint?: string) {
  return useQuery({
    queryKey: ["options", endpoint],
    queryFn: () => apiFetch<{ data: OptionRow[] }>(`${endpoint}?pageSize=200`),
    enabled: Boolean(endpoint),
  });
}

const optionLabel = (o: OptionRow) => [o.code, o.name].filter(Boolean).join(" — ") || o.id;

export function ResourceManager<T extends { id: string }>({ config }: { config: ResourceConfig<T> }) {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const params = new URLSearchParams({ pageSize: "100" });
  for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);

  const { data, isLoading, error } = useQuery({
    queryKey: [config.endpoint, filters],
    queryFn: () => apiFetch<{ data: T[]; total: number }>(`${config.endpoint}?${params}`),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: [config.endpoint] });

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editing
        ? apiFetch(`${config.endpoint}/${editing.id}`, { method: "PATCH", body: payload })
        : apiFetch(config.endpoint, { method: "POST", body: payload }),
    onSuccess: () => {
      toast.success(editing ? "Updated" : "Created");
      invalidate();
      close();
    },
    onError: (e) => toast.error(e instanceof ApiRequestError ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiFetch(`${config.endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Delete failed (may be referenced)"),
  });

  const act = useMutation({
    mutationFn: ({ path, method, body }: { path: string; method: "POST" | "PATCH"; body?: unknown }) =>
      apiFetch(path, { method, body }),
    onSuccess: () => {
      toast.success("Done");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof ApiRequestError ? e.message : "Action failed"),
  });

  const runAction = (action: RowAction<T>, row: T) => {
    if (action.confirm && !confirm(action.confirm)) return;
    let body: unknown;
    if (action.prompt) {
      const value = window.prompt(action.prompt.label);
      if (value === null || value === "") return;
      body = { [action.prompt.field]: value };
    }
    act.mutate({ path: action.path(row), method: action.method ?? "POST", body });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(Object.fromEntries(config.fields.map((f) => [f.key, f.defaultValue ?? (f.type === "checkbox" ? false : "")])));
    setOpen(true);
  };
  const openEdit = (row: T) => {
    setEditing(row);
    setForm(Object.fromEntries(config.fields.map((f) => [f.key, (row as Record<string, unknown>)[f.key] ?? ""])));
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setEditing(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const f of config.fields) {
      if (editing && f.editable === false) continue;
      const raw = form[f.key];
      if (f.type === "checkbox") payload[f.key] = Boolean(raw);
      else if (raw === "" || raw == null) continue;
      else payload[f.key] = f.type === "number" ? Number(raw) : raw;
    }
    save.mutate(payload);
  };

  const hasRowUi = !config.readOnly || (config.rowActions?.length ?? 0) > 0;
  const columns: Column<T>[] = hasRowUi
    ? [
        ...config.columns,
        {
          header: "",
          cell: (row) => (
            <div className="flex flex-wrap justify-end gap-2">
              {config.rowActions
                ?.filter((a) => !a.hidden?.(row))
                .map((a) => (
                  <Button key={a.label} variant="outline" size="sm" onClick={() => runAction(a, row)}>
                    {a.label}
                  </Button>
                ))}
              {!config.readOnly && (
                <>
                  <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                    Edit
                  </Button>
                  {!config.noDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this record?")) del.mutate(row.id);
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </>
              )}
            </div>
          ),
        },
      ]
    : config.columns;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {config.title} {data ? `(${data.total})` : ""}
        </h1>
        {!config.readOnly && <Button onClick={openCreate}>+ New</Button>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search…"
          className="max-w-xs"
          value={filters.search ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        {config.filters?.map((filter) => (
          <FilterControl
            key={filter.key}
            filter={filter}
            value={filters[filter.key] ?? ""}
            onChange={(v) => setFilters((f) => ({ ...f, [filter.key]: v }))}
          />
        ))}
      </div>

      <DataTable columns={columns} rows={data?.data} isLoading={isLoading} error={error} />

      <Dialog open={open} onClose={close} title={`${editing ? "Edit" : "New"} ${config.title}`}>
        <form onSubmit={submit} className="space-y-3">
          {config.fields
            .filter((f) => !editing || f.editable !== false)
            .map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label>{field.label}</Label>
                <FieldControl
                  field={field}
                  value={form[field.key]}
                  onChange={(v) => setForm((s) => ({ ...s, [field.key]: v }))}
                />
              </div>
            ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const { data } = useOptions(field.type === "select" ? field.optionsEndpoint : undefined);

  if (field.type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    );
  }
  if (field.type === "select") {
    const staticOpts = field.options;
    return (
      <Select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} required={field.required}>
        <option value="">— select —</option>
        {staticOpts
          ? staticOpts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : data?.data.map((o) => (
              <option key={o.id} value={o.id}>
                {optionLabel(o)}
              </option>
            ))}
      </Select>
    );
  }
  return (
    <Input
      type={field.type === "number" ? "number" : "text"}
      value={String(value ?? "")}
      required={field.required}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function FilterControl({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: string;
  onChange: (v: string) => void;
}) {
  const { data } = useOptions(filter.type === "select" ? filter.optionsEndpoint : undefined);

  if (filter.type === "boolean") {
    return (
      <Select className="max-w-[12rem]" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{filter.label}: All</option>
        <option value="true">{filter.label}: Yes</option>
        <option value="false">{filter.label}: No</option>
      </Select>
    );
  }
  return (
    <Select className="max-w-[14rem]" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{filter.label}: All</option>
      {filter.options
        ? filter.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))
        : data?.data.map((o) => (
            <option key={o.id} value={o.id}>
              {optionLabel(o)}
            </option>
          ))}
    </Select>
  );
}
