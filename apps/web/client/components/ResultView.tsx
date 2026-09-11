import { lazy, Suspense } from "react";
import type { Result } from "../api";
import { StatusEmpty, formatNumber, PulsatingDots } from "./ui";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
const UsageChart = lazy(() => import("./UsageChart"));
const OverviewChart = lazy(() =>
  import("./OverviewChart").then((m) => ({ default: m.OverviewChart })),
);

export function ResultView({ result }: { result: Result }) {
  switch (result.kind) {
    case "account": {
      const a = result.response.data;
      return (
        <div>
          <div className="stats-grid">
            {[
              ["账户总余额", a.totalBalance, "元"],
              ["基本账户", a.basicBalance, "元"],
              ["补助账户", a.subsidyBalance, "元"],
              ["电表读数", a.meterReadingKwh, "kWh"],
            ].map(([label, value, unit]) => (
              <Card className="stat-card" key={String(label)} size="sm">
                <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
                <CardContent><p>
                  <strong>{formatNumber(value as number | null)}</strong>
                  <span>{unit}</span>
                </p></CardContent>
              </Card>
            ))}
          </div>
          <dl className="account-details">
            {[
              ["电表号", a.meterNumber],
              ["抄表时间", a.readAt],
              ["通信状态", a.communicationStatus],
              ["照明通道", a.lightingStatus],
              ["空调通道", a.airConditioningStatus],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="note">— 表示学校暂未提供该数据。</p>
        </div>
      );
    }
    case "monthly":
    case "daily":
    case "hourly":
      return (
        <Suspense
          fallback={
            <StatusEmpty loading loader={<PulsatingDots />}>
              正在加载图表…
            </StatusEmpty>
          }
        >
          <UsageChart
            key={result.response.meta.fetchedAt}
            series={result.response.data}
            kind={result.kind}
          />
        </Suspense>
      );
    case "overview":
      return (
        <Suspense
          fallback={
            <StatusEmpty loading loader={<PulsatingDots />}>
              正在加载总览图表…
            </StatusEmpty>
          }
        >
          <OverviewChart overview={result.response.data} />
        </Suspense>
      );
    case "months":
      return result.response.data.length ? (
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="可用月份"
        >
          <Table>
            <TableHeader><TableRow>
              <TableHead scope="col">月份</TableHead>
              <TableHead scope="col">月份 ID</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {result.response.data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.label}</TableCell>
                  <TableCell>{m.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <StatusEmpty>学校暂无可用月份。</StatusEmpty>
      );
    case "payments":
    case "subsidies": {
      const records = result.response.data;
      return records.length ? (
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="记录明细"
        >
          <Table>
            <TableHeader><TableRow>
              <TableHead scope="col">时间</TableHead>
              <TableHead scope="col">金额（元）</TableHead>
              <TableHead scope="col">操作人员</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {records.map((record, i) => (
                <TableRow key={i}>
                  <TableCell>
                    {"paidAt" in record ? record.paidAt : record.grantedAt}
                  </TableCell>
                  <TableCell>{formatNumber(record.amount)}</TableCell>
                  <TableCell>{record.operator || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <StatusEmpty>
          所选时间暂无{result.kind === "payments" ? "缴费" : "月补"}记录。
        </StatusEmpty>
      );
    }
  }
}
