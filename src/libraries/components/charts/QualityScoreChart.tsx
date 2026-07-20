"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const data = [
  { month: "Jan", target: 78, actual: 71 },
  { month: "Feb", target: 78, actual: 74 },
  { month: "Mar", target: 80, actual: 77 },
  { month: "Apr", target: 80, actual: 79 },
  { month: "May", target: 82, actual: 81 },
  { month: "Jun", target: 82, actual: 83 },
  { month: "Jul", target: 85, actual: 84 },
  { month: "Aug", target: 85, actual: 86 },
  { month: "Sep", target: 87, actual: 85 },
  { month: "Oct", target: 87, actual: 88 },
  { month: "Nov", target: 88, actual: 90 },
  { month: "Dec", target: 90, actual: 91 },
];

interface QualityScoreChartProps {
  loading?: boolean;
}

export function QualityScoreChart({ loading = false }: QualityScoreChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor   = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor   = isDark ? "rgba(255,255,255,0.4)"  : "rgba(0,0,0,0.4)";
  const tooltipBg   = isDark ? "#1c1c1c" : "#ffffff";
  const tooltipBorder = isDark ? "#333" : "#e5e5e5";
  const actualColor = isDark ? "#f5c77e" : "#92642a";
  const targetColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)";

  return (
    <Card className="p-2">
      <CardHeader>
        <CardTitle>Quality Trends</CardTitle>
        <CardDescription>Monthly appraisal scores vs targets</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[65, 95]}
                  tick={{ fontSize: 11, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                  tickCount={5}
                />
                <ReferenceLine y={80} stroke={gridColor} strokeDasharray="6 3" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: `1px solid ${tooltipBorder}`,
                    backgroundColor: tooltipBg,
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  labelStyle={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)", fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: tickColor }}
                  cursor={{ stroke: gridColor, strokeWidth: 1 }}
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke={actualColor}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: actualColor, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: actualColor }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke={targetColor}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0, fill: targetColor }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-5 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: actualColor }} />
                <span className="text-xs text-muted-foreground">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 border-t border-dashed" style={{ borderColor: targetColor }} />
                <span className="text-xs text-muted-foreground">Target</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
