import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";
import type { UsageOverview } from "@wic-energy/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart";
import { StatusEmpty, formatNumber } from "./ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export function OverviewChart({ overview }: { overview: UsageOverview }) {
  const months = overview.months;

  // Sort months in chronological order (e.g. 2026-01 -> 2026-02 -> 2026-03)
  const sortedMonths = React.useMemo(() => {
    return [...months].sort((a, b) => {
      if (a.year && b.year && a.year !== b.year) return a.year - b.year;
      if (a.month && b.month && a.month !== b.month) return a.month - b.month;
      return a.monthId - b.monthId;
    });
  }, [months]);

  // Combine all days into one single continuous timeline across months
  const allPoints = React.useMemo(() => {
    return sortedMonths.flatMap((m, mIndex) => {
      const monthPrefix = m.month
        ? `${String(m.month).padStart(2, "0")}/`
        : "";
      return m.points.map((p, pIndex) => {
        const raw = p.label.trim();
        const numMatch = raw.match(/\d+/);
        const dayStr = numMatch
          ? numMatch[0].padStart(2, "0")
          : String(pIndex + 1).padStart(2, "0");
        const shortDate = monthPrefix
          ? `${monthPrefix}${dayStr}`
          : raw || `第${pIndex + 1}日`;
        const fullDate = `${m.label}${dayStr}日`;
        return {
          key: `${m.monthId}-${pIndex}`,
          date: shortDate,
          fullDate,
          monthId: m.monthId,
          monthLabel: m.label,
          monthIndex: mIndex,
          kwh: p.value,
        };
      });
    });
  }, [sortedMonths]);

  const totalKwh = React.useMemo(() => {
    return Number(
      sortedMonths.reduce((sum, m) => sum + m.totalKwh, 0).toFixed(2),
    );
  }, [sortedMonths]);

  const peak = React.useMemo(() => {
    if (!allPoints.length) return 0;
    return Math.max(...allPoints.map((p) => p.kwh));
  }, [allPoints]);

  const avg = React.useMemo(() => {
    if (!allPoints.length) return 0;
    return Number((totalKwh / allPoints.length).toFixed(2));
  }, [allPoints.length, totalKwh]);

  const dateRangeText = React.useMemo(() => {
    if (!sortedMonths.length) return "";
    if (sortedMonths.length === 1) return sortedMonths[0]!.label;
    return `${sortedMonths[0]!.label} ～ ${sortedMonths[sortedMonths.length - 1]!.label}`;
  }, [sortedMonths]);

  const chartConfig: ChartConfig = React.useMemo(
    () => ({
      kwh: {
        label: "日用电量",
        color: "var(--primary)",
      },
    }),
    [],
  );

  if (!months.length || !allPoints.length) {
    return <StatusEmpty>暂无用电记录。</StatusEmpty>;
  }

  return (
    <Card className="py-0 overflow-hidden">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>用电总览</CardTitle>
          <CardDescription>
            以日为基本单位连续展示全部数据（{dateRangeText} · 共 {sortedMonths.length} 个月）
          </CardDescription>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y border-t sm:flex sm:divide-y-0 sm:divide-x sm:border-t-0 sm:border-l">
          <div className="flex flex-col justify-center gap-1 px-5 py-4 text-left sm:px-6 sm:py-5">
            <span className="text-xs text-muted-foreground">全部用电总量</span>
            <span className="text-base font-bold leading-none sm:text-2xl">
              {formatNumber(totalKwh)}{" "}
              <small className="text-xs font-normal text-muted-foreground">
                kWh
              </small>
            </span>
          </div>
          <div className="flex flex-col justify-center gap-1 px-5 py-4 text-left sm:px-6 sm:py-5">
            <span className="text-xs text-muted-foreground">日用电峰值</span>
            <span className="text-base font-bold leading-none sm:text-2xl">
              {formatNumber(peak)}{" "}
              <small className="text-xs font-normal text-muted-foreground">
                kWh
              </small>
            </span>
          </div>
          <div className="flex flex-col justify-center gap-1 px-5 py-4 text-left sm:px-6 sm:py-5">
            <span className="text-xs text-muted-foreground">日均用电</span>
            <span className="text-base font-bold leading-none sm:text-2xl">
              {formatNumber(avg)}{" "}
              <small className="text-xs font-normal text-muted-foreground">
                kWh
              </small>
            </span>
          </div>
          <div className="flex flex-col justify-center gap-1 px-5 py-4 text-left sm:px-6 sm:py-5">
            <span className="text-xs text-muted-foreground">统计天数</span>
            <span className="text-base font-bold leading-none sm:text-2xl">
              {allPoints.length}{" "}
              <small className="text-xs font-normal text-muted-foreground">
                天
              </small>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-6 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={allPoints}
            margin={{
              left: 8,
              right: 8,
              top: 8,
              bottom: 8,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[160px]"
                  nameKey="kwh"
                  labelFormatter={(_value, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullDate ?? _value;
                  }}
                />
              }
            />
            <Bar dataKey="kwh" radius={[3, 3, 0, 0]}>
              {allPoints.map((entry) => (
                <Cell
                  key={entry.key}
                  fill="var(--primary)"
                  fillOpacity={entry.monthIndex % 2 === 0 ? 1 : 0.82}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <details className="data-details mt-4">
          <summary>
            全部用电数据明细 · 共 {allPoints.length} 天
          </summary>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="用电数据明细"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">日期</TableHead>
                  <TableHead scope="col">所属月份</TableHead>
                  <TableHead scope="col">用电量（kWh）</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPoints.map((p) => (
                  <TableRow key={p.key}>
                    <TableCell>{p.fullDate}</TableCell>
                    <TableCell>{p.monthLabel}</TableCell>
                    <TableCell>{formatNumber(p.kwh)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
