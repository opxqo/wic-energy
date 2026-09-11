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

export default function UsageChart({
  series,
  kind,
}: {
  series: UsageSeries;
  kind: string;
}) {
  const [view, setView] = useState(kind === "monthly" ? "bar" : "line");
  if (!series?.points?.length) return <StatusEmpty>所选时间暂无用电记录。</StatusEmpty>;
  // Upstream sometimes omits axis labels. Preserve order without inventing dates.
  const points = series.points.map((point, index) => ({
    ...point,
    label: point.label.trim() || `第 ${index + 1} 项`,
  }));
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
        <ToggleGroup type="single" value={view} onValueChange={(next) => next && setView(next)} variant="outline" size="sm" spacing={0} aria-label="图表样式">
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
        <MonoRoundedBarChart points={points} name={series.name} />
      ) : (
        <MonoRoundedLineChart points={points} name={series.name} />
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
            <TableHeader><TableRow>
              <TableHead scope="col">时间 / 序号</TableHead>
              <TableHead scope="col">用电量（kWh）</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {points.map((p, i) => (
                <TableRow key={i}>
                  <TableCell>{p.label}</TableCell>
                  <TableCell>{formatNumber(p.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </details>
      {series.points.some((p) => !p.label.trim()) && (
        <p className="note">学校未标注的时间点以原始数据序号显示。</p>
      )}
      </CardContent>
    </Card>
  );
}
