import { Card } from "@mui/material";
import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  type GridColDef,
  type GridRowIdGetter,
  type GridRowParams,
  type GridValidRowModel,
} from "@mui/x-data-grid";

function Toolbar() {
  return (
    <GridToolbarContainer sx={{ p: 1.25, gap: 1, borderBottom: 1, borderColor: "divider" }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      <div style={{ flex: 1 }} />
      <GridToolbarQuickFilter debounceMs={250} placeholder="Search…" />
    </GridToolbarContainer>
  );
}

export function DataTable<T extends GridValidRowModel>({
  rows,
  columns,
  getRowId,
  loading,
  onRowClick,
  height = 560,
  pageSize = 25,
}: {
  rows: T[];
  columns: GridColDef<T>[];
  getRowId?: GridRowIdGetter<T>;
  loading?: boolean;
  onRowClick?: (params: GridRowParams<T>) => void;
  height?: number;
  pageSize?: number;
}) {
  return (
    <Card sx={{ height, overflow: "hidden" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        loading={loading}
        onRowClick={onRowClick}
        slots={{ toolbar: Toolbar }}
        slotProps={{ toolbar: { showQuickFilter: true } }}
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize } } }}
        disableRowSelectionOnClick
        sx={{
          border: 0,
          "& .MuiDataGrid-columnHeaders": { fontWeight: 700 },
          "& .MuiDataGrid-row:hover": { cursor: onRowClick ? "pointer" : "default" },
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
        }}
      />
    </Card>
  );
}
