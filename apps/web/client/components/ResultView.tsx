import { lazy, Suspense } from "react";
import {
  Wallet,
  CreditCard,
  Gift,
  Zap,
  Hash,
  Clock,
  Radio,
  Lightbulb,
  Snowflake,
  Calendar,
  Coins,
  User,
} from "lucide-react";
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
      const statItems: Array<{
        label: string;
        value: number | null;
        unit: string;
        icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
        iconClass: string;
      }> = [
        {
          label: "账户总余额",
          value: a.totalBalance,
          unit: "元",
          icon: Wallet,
          iconClass: "text-primary",
        },
        {
          label: "基本账户",
          value: a.basicBalance,
          unit: "元",
          icon: CreditCard,
          iconClass: "text-muted-foreground",
        },
        {
          label: "补助账户",
          value: a.subsidyBalance,
          unit: "元",
          icon: Gift,
          iconClass: "text-emerald-600",
        },
        {
          label: "电表读数",
          value: a.meterReadingKwh,
          unit: "kWh",
          icon: Zap,
          iconClass: "text-amber-500",
        },
      ];

      const detailItems: Array<{
        label: string;
        value: string | number | null;
        icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
        iconClass?: string;
      }> = [
        { label: "电表号", value: a.meterNumber, icon: Hash },
        { label: "抄表时间", value: a.readAt, icon: Clock },
        { label: "通信状态", value: a.communicationStatus, icon: Radio },
        {
          label: "照明通道",
          value: a.lightingStatus,
          icon: Lightbulb,
          iconClass: "text-amber-500",
        },
        {
          label: "空调通道",
          value: a.airConditioningStatus,
          icon: Snowflake,
          iconClass: "text-sky-500",
        },
      ];

      return (
        <div>
          <div className="stats-grid">
            {statItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card className="stat-card" key={item.label} size="sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Icon className={`size-3.5 shrink-0 ${item.iconClass}`} aria-hidden="true" />
                      <span>{item.label}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      <strong>{formatNumber(item.value)}</strong>
                      <span>{item.unit}</span>
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <dl className="account-details">
            {detailItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label}>
                  <dt className="flex items-center gap-1">
                    <Icon className={`size-3 shrink-0 ${item.iconClass ?? "text-muted-foreground"}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </dt>
                  <dd>{item.value ?? "—"}</dd>
                </div>
              );
            })}
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
              <TableHead scope="col"><span className="inline-flex items-center gap-1.5"><Calendar className="size-3.5" aria-hidden="true" />月份</span></TableHead>
              <TableHead scope="col"><span className="inline-flex items-center gap-1.5"><Hash className="size-3.5" aria-hidden="true" />月份 ID</span></TableHead>
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
              <TableHead scope="col"><span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" aria-hidden="true" />时间</span></TableHead>
              <TableHead scope="col"><span className="inline-flex items-center gap-1.5"><Coins className="size-3.5" aria-hidden="true" />金额（元）</span></TableHead>
              <TableHead scope="col"><span className="inline-flex items-center gap-1.5"><User className="size-3.5" aria-hidden="true" />操作人员</span></TableHead>
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
