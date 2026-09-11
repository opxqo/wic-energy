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

  const allTotal = React.useMemo(() => {
    return Number(
      sortedMonths.reduce((sum, m) => sum + m.totalKwh, 0).toFixed(2),
    );
  }, [sortedMonths]);

  // Default to "all": show the entire dataset continuously in ONE chart
  const [activeSelection, setActiveSelection] = React.useState<string>("all");

  const displayedPoints = React.useMemo(() => {
    if (activeSelection === "all") return allPoints;
    return allPoints.filter((p) => String(p.monthId) === activeSelection);
  }, [activeSelection, allPoints]);

  const selectedMonthObj = sortedMonths.find(
    (m) => String(m.monthId) === activeSelection,
  );

  const totalKwh = React.useMemo(() => {
    if (activeSelection === "all") return allTotal;
    return selectedMonthObj?.totalKwh ?? 0;
  }, [activeSelection, allTotal, selectedMonthObj]);

  const peak = React.useMemo(() => {
    if (!displayedPoints.length) return 0;
    return Math.max(...displayedPoints.map((p) => p.kwh));
  }, [displayedPoints]);

  const avg = React.useMemo(() => {
    if (!displayedPoints.length) return 0;
    return Number((totalKwh / displayedPoints.length).toFixed(2));
  }, [displayedPoints.length, totalKwh]);

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
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>用电总览</CardTitle>
          <CardDescription>
            以日为基本单位连续展示全部数据，上方卡片显示各月用电总量
          </CardDescription>
        </div>
        <div className="flex flex-wrap border-t sm:border-t-0 sm:border-l">
          <button
            type="button"
            data-active={activeSelection === "all"}
            className="relative z-30 flex flex-1 flex-col justify-center gap-1 px-5 py-4 text-left even:border-l data-[active=true]:bg-muted/50 data-[active=true]:font-semibold sm:px-6 sm:py-5"
            onClick={() => setActiveSelection("all")}
          >
            <span className="text-xs text-muted-foreground">全部月份</span>
            <span className="text-base leading-none font-bold sm:text-2xl">
              {formatNumber(allTotal)}{" "}
              <small className="text-xs font-normal text-muted-foreground">
                kWh
              </small>
            </span>
          </button>
          {sortedMonths.map((m) => {
            const isActive = activeSelection === String(m.monthId);
            return (
              <button
                key={m.monthId}
                type="button"
                data-active={isActive}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 px-5 py-4 text-left border-l data-[active=true]:bg-muted/50 data-[active=true]:font-semibold sm:px-6 sm:py-5"
                onClick={() =>
                  setActiveSelection((curr) =>
                    curr === String(m.monthId) ? "all" : String(m.monthId),
                  )
                }
              >
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className="text-base leading-none font-bold sm:text-2xl">
                  {formatNumber(m.totalKwh)}{" "}
                  <small className="text-xs font-normal text-muted-foreground">
                    kWh
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-6 sm:p-6">
        <div className="chart-metrics mb-4">
          <div>
            <span>
              {activeSelection === "all" ? "全部用电总量" : "当月用电总量"}
            </span>
            <strong>
              {formatNumber(totalKwh)} <small>kWh</small>
            </strong>
          </div>
          <div>
            <span>日用电峰值</span>
            <strong>
              {formatNumber(peak)} <small>kWh</small>
            </strong>
          </div>
          <div>
            <span>日均用电</span>
            <strong>
              {formatNumber(avg)} <small>kWh</small>
            </strong>
          </div>
          <div>
            <span>统计天数</span>
            <strong>
              {displayedPoints.length} <small>天</small>
            </strong>
          </div>
        </div>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={displayedPoints}
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
              {displayedPoints.map((entry) => (
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
            {activeSelection === "all" ? "全部月份" : selectedMonthObj?.label}{" "}
            数据明细 · {displayedPoints.length} 天
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
                {displayedPoints.map((p) => (
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
