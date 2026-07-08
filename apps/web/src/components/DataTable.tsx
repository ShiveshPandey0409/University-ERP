"use client";

import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  isLoading?: boolean;
  error?: unknown;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  error,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load data.
      </div>
    );
  }
  return (
    <Table>
      <THead>
        <TR>
          {columns.map((c) => (
            <TH key={c.header}>{c.header}</TH>
          ))}
        </TR>
      </THead>
      <TBody>
        {isLoading ? (
          <TR>
            <TD colSpan={columns.length} className="py-8 text-center text-muted-foreground">
              Loading…
            </TD>
          </TR>
        ) : rows && rows.length > 0 ? (
          rows.map((row, i) => (
            <TR key={i}>
              {columns.map((c) => (
                <TD key={c.header}>{c.cell(row)}</TD>
              ))}
            </TR>
          ))
        ) : (
          <TR>
            <TD colSpan={columns.length} className="py-8 text-center text-muted-foreground">
              {emptyMessage}
            </TD>
          </TR>
        )}
      </TBody>
    </Table>
  );
}
