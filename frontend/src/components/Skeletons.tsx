import { Card, CardContent, Skeleton, Stack } from "@mui/material";

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="rounded" height={40} />
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={34} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={104} sx={{ flex: 1, minWidth: 190 }} />
      ))}
    </Stack>
  );
}

export function CardSkeleton({ height = 240 }: { height?: number }) {
  return <Skeleton variant="rounded" height={height} />;
}
