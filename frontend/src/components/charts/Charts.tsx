import type { ReactNode } from "react";

import { Card, CardContent, Typography } from "@mui/material";
import { BarChart, LineChart, PieChart } from "@mui/x-charts";

export function ChartCard({ title, height = 300, children }: { title: string; height?: number; children: ReactNode }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <div style={{ height, width: "100%" }}>{children}</div>
      </CardContent>
    </Card>
  );
}

export function DonutChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  return (
    <PieChart
      series={[
        {
          data: data.map((d, i) => ({ id: i, value: d.value, label: d.label, color: d.color })),
          innerRadius: 55,
          paddingAngle: 2,
          cornerRadius: 4,
        },
      ]}
      height={240}
      margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
    />
  );
}

export function BarChartCard({
  xLabels,
  series,
}: {
  xLabels: string[];
  series: { data: number[]; label?: string; color?: string }[];
}) {
  return <BarChart xAxis={[{ scaleType: "band", data: xLabels }]} series={series} height={240} borderRadius={6} />;
}

export function AreaChartCard({
  xLabels,
  data,
  label,
  color = "#4f46e5",
}: {
  xLabels: string[];
  data: number[];
  label?: string;
  color?: string;
}) {
  return (
    <LineChart
      xAxis={[{ scaleType: "point", data: xLabels }]}
      series={[{ data, label, area: true, showMark: false, color }]}
      height={240}
    />
  );
}
