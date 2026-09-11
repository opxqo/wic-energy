import { useState } from "react";
import type { UsageSeries } from "@wic-energy/core";
import { MonoRoundedBarChart } from "./monocharts/MonoRoundedBarChart";
import { MonoRoundedLineChart } from "./monocharts/MonoRoundedLineChart";
import { StatusEmpty, formatNumber } from "./ui";
import { Card, CardContent } from "./ui/card";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export interface FormattedPoint {
  label: string;
  fullLabel: string;
  value: number;
}

const CHINESE_NUMS: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
};

function formatChartData(
  series: UsageSeries,
  kind: string,
): {
  points: FormattedPoint[];
  timeColumnTitle: string;
  tickFormatter?: (value: string) => string;
} {
  const rawPoints = series.points ?? [];
  const title = (series.title || "").trim();

  if (kind === "hourly") {
    // Attempt to extract date range from title, e.g. "2026-09-09到2026-09-11"
    const rangeMatch = title.match(
      /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s*到\s*(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/,
    );
    const singleMatch =
      !rangeMatch && title.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);

    let startYear: number | null = null;
    let startMonth: number | null = null;
    let startDay: number | null = null;

    if (rangeMatch) {
      startYear = Number(rangeMatch[1]);
      startMonth = Number(rangeMatch[2]);
      startDay = Number(rangeMatch[3]);
    } else if (singleMatch) {
      const endYear = Number(singleMatch[1]);
      const endMonth = Number(singleMatch[2]);
      const endDay = Number(singleMatch[3]);
      const daysCount = Math.max(1, Math.ceil(rawPoints.length / 24));
      const startDate = new Date(
        endYear,
        endMonth - 1,
        endDay - (daysCount - 1),
      );
      startYear = startDate.getFullYear();
      startMonth = startDate.getMonth() + 1;
      startDay = startDate.getDate();
    }

    const points: FormattedPoint[] = rawPoints.map((point, index) => {
      let fullLabel: string;
      let label: string;

      if (startYear !== null && startMonth !== null && startDay !== null) {
        const dayOffset = Math.floor(index / 24);
        const hour = index % 24;
        const d = new Date(
          startYear,
          startMonth - 1,
          startDay + dayOffset,
          hour,
        );
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        fullLabel = `${yyyy}-${mm}-${dd} ${hh}:00`;
        label = `${mm}-${dd} ${hh}:00`;
      } else {
        const dayIdx = Math.floor(index / 24) + 1;
        const hour = index % 24;
        const hh = String(hour).padStart(2, "0");
        fullLabel = `第 ${dayIdx} 天 ${hh}:00`;
        label = `${dayIdx}天 ${hh}:00`;
      }

      return {
        label,
        fullLabel,
        value: point.value,
      };
    });

    const tickFormatter = (val: string) => {
      if (val.endsWith(" 00:00")) {
        return val.replace(" 00:00", "");
      }
      const parts = val.split(" ");
      return parts[1] ?? val;
    };

    return {
      points,
      timeColumnTitle: "时间",
      tickFormatter,
    };
  }

  if (kind === "daily") {
    // Extract Year & Month from title, e.g. "2026年09月日用电" or "四月用电"
    const monthMatch =
      title.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/) ||
      title.match(/(\d{4})[-/.](\d{1,2})/);
    const year = monthMatch ? Number(monthMatch[1]) : null;
    const month = monthMatch ? Number(monthMatch[2]) : null;

    const cnMatch = !monthMatch && title.match(/([一二三四五六七八九十]+)月/);
    const resolvedMonth =
      month ?? (cnMatch && cnMatch[1] ? CHINESE_NUMS[cnMatch[1]] : null);

    const points: FormattedPoint[] = rawPoints.map((point, index) => {
      const raw = point.label.trim();
      const mdMatch = raw.match(/(\d{1,2})[-/.](\d{1,2})/);
      let dayNum = index + 1;
      let mNum = resolvedMonth;

      if (mdMatch) {
        mNum = Number(mdMatch[1]);
        dayNum = Number(mdMatch[2]);
      } else {
        const dMatch = raw.match(/\d+/);
        if (dMatch) dayNum = Number(dMatch[0]);
      }

      const dayStr = String(dayNum).padStart(2, "0");
      let fullLabel: string;
      if (year && mNum) {
        fullLabel = `${year}年${String(mNum).padStart(2, "0")}月${dayStr}日`;
      } else if (mNum) {
        fullLabel = `${String(mNum).padStart(2, "0")}月${dayStr}日`;
      } else {
        fullLabel = `${dayStr}日`;
      }

      return {
        label: `${dayStr}日`,
        fullLabel,
        value: point.value,
      };
    });

    return {
      points,
      timeColumnTitle: "日期",
    };
  }

  if (kind === "monthly") {
    const yearMatch = title.match(/(\d{4})/);
    const year = yearMatch ? Number(yearMatch[1]) : null;

    const points: FormattedPoint[] = rawPoints.map((point, index) => {
      const raw = point.label.trim();
      const ymMatch = raw.match(/(\d{4})[-/.](\d{1,2})/);
      let mNum = index + 1;
      let yNum = year;

      if (ymMatch) {
        yNum = Number(ymMatch[1]);
        mNum = Number(ymMatch[2]);
      } else {
        const mMatch = raw.match(/\d+/);
        if (mMatch) mNum = Number(mMatch[0]);
      }

      const mStr = String(mNum).padStart(2, "0");
      const fullLabel = yNum ? `${yNum}年${mStr}月` : `${mNum}月`;

      return {
        label: `${mNum}月`,
        fullLabel,
        value: point.value,
      };
    });

    return {
      points,
      timeColumnTitle: "月份",
    };
  }

  // Fallback
  const points: FormattedPoint[] = rawPoints.map((point, index) => ({
    label: point.label.trim() || `第 ${index + 1} 项`,
    fullLabel: point.label.trim() || `第 ${index + 1} 项`,
    value: point.value,
  }));

  return {
    points,
    timeColumnTitle: "时间 / 序号",
  };
}

export default function UsageChart({
  series,
  kind,
}: {
  series: UsageSeries;
  kind: string;
}) {
  const [view, setView] = useState(kind === "monthly" ? "bar" : "line");
  if (!series?.points?.length)
    return <StatusEmpty>所选时间暂无用电记录。</StatusEmpty>;

  const { points, timeColumnTitle, tickFormatter } = formatChartData(
    series,
    kind,
  );
  const total = series.points.reduce((sum, p) => sum + p.value, 0);
  const peak = Math.max(...series.points.map((p) => p.value));

  return (
    <Card className="mono-card">
      <CardContent>
        <header className="chart-header">
          <div>
            <h3>{series.title || series.name}</h3>
            <p className="note">{series.name} · kWh</p>
          </div>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(next) => next && setView(next)}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="图表样式"
          >
            <ToggleGroupItem value="bar">柱状</ToggleGroupItem>
            <ToggleGroupItem value="line">折线</ToggleGroupItem>
          </ToggleGroup>
        </header>
        <div className="chart-metrics">
          <div>
            <span>合计用电</span>
            <strong>
              {formatNumber(total)} <small>kWh</small>
            </strong>
          </div>
          <div>
            <span>单项峰值</span>
            <strong>
              {formatNumber(peak)} <small>kWh</small>
            </strong>
          </div>
          <div>
            <span>数据点</span>
            <strong>
              {points.length} <small>项</small>
            </strong>
          </div>
        </div>
        {view === "bar" ? (
          <MonoRoundedBarChart
            points={points}
            name={series.name}
            tickFormatter={tickFormatter}
          />
        ) : (
          <MonoRoundedLineChart
            points={points}
            name={series.name}
            tickFormatter={tickFormatter}
          />
        )}
        <details className="data-details">
          <summary>数据明细 · {points.length} 项</summary>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="用电数据明细"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{timeColumnTitle}</TableHead>
                  <TableHead scope="col">用电量（kWh）</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {points.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>{p.fullLabel}</TableCell>
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
