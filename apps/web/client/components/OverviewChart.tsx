import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
  const [activeMonthId, setActiveMonthId] = React.useState<number | undefined>(
    months[0]?.monthId,
  );

  const activeMonth =
    months.find((m) => m.monthId === activeMonthId) ?? months[0];

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      kwh: {
        label: "日用电量",
        color: "var(--primary)",
      },
    };
    months.forEach((m) => {
      config[`m_${m.monthId}`] = {
        label: m.label,
        color: "var(--primary)",
      };
    });
    return config;
  }, [months]);

  if (!months.length || !activeMonth || !activeMonth.points.length) {
    return <StatusEmpty>暂无用电记录。</StatusEmpty>;
  }

  const chartData = activeMonth.points.map((p, idx) => ({
    date: p.label.trim() || `第 ${idx + 1} 日`,
    kwh: p.value,
  }));

  const peak = Math.max(...activeMonth.points.map((p) => p.value));
  const avg = activeMonth.points.length
    ? Number((activeMonth.totalKwh / activeMonth.points.length).toFixed(2))
    : 0;

  return (
    <Card className="py-0 overflow-hidden">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>用电总览</CardTitle>
          <CardDescription>
            以日为基本单位查看用电趋势，上方卡片显示各月用电总量
          </CardDescription>
        </div>
        <div className="flex flex-wrap border-t sm:border-t-0 sm:border-l">
          {months.map((m) => {
            const isActive = activeMonth.monthId === m.monthId;
            return (
              <button
                key={m.monthId}
                type="button"
                data-active={isActive}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 px-5 py-4 text-left even:border-l data-[active=true]:bg-muted/50 data-[active=true]:font-semibold sm:px-6 sm:py-5"
                onClick={() => setActiveMonthId(m.monthId)}
              >
                <span className="text-xs text-muted-foreground">
                  {m.label}
                </span>
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
            <span>当月用电总量</span>
            <strong>
              {formatNumber(activeMonth.totalKwh)} <small>kWh</small>
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
              {activeMonth.points.length} <small>天</small>
            </strong>
          </div>
        </div>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
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
              minTickGap={16}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[140px]"
                  nameKey="kwh"
                  labelFormatter={(value) => `${value} 用电`}
                />
              }
            />
            <Bar dataKey="kwh" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
        <details className="data-details mt-4">
          <summary>
            {activeMonth.label} 数据明细 · {activeMonth.points.length} 天
          </summary>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label={`${activeMonth.label} 用电数据明细`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">日期</TableHead>
                  <TableHead scope="col">用电量（kWh）</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeMonth.points.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>{p.label.trim() || `第 ${i + 1} 日`}</TableCell>
                    <TableCell>{formatNumber(p.value)}</TableCell>
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
