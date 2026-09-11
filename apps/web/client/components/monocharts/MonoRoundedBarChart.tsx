// Adapted from Subhan-code/Monocharts, MIT. See README.md and LICENSE in this folder.
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useReducedMotion } from "motion/react";
import type { UsagePoint } from "@wic-energy/core";

export function MonoRoundedBarChart({
  points,
  name,
  tickFormatter,
}: {
  points: Array<{ label: string; fullLabel?: string; value: number }>;
  name: string;
  tickFormatter?: (value: string) => string;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      className="mono-stage"
      role="group"
      aria-label={`${name}柱状图，详细数值见下方数据明细`}
    >
      <ResponsiveContainer width="100%" height={260} minWidth={0}>
        <BarChart
          data={points}
          margin={{ top: 20, right: 16, left: -16, bottom: 8 }}
          accessibilityLayer
        >
          <CartesianGrid
            strokeDasharray="2 2"
            vertical={false}
            stroke="rgba(0,0,0,0.06)"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            tickFormatter={tickFormatter}
            tick={{ fontSize: 11, fill: "#687580" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#687580" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e6e9",
              fontSize: 12,
            }}
            labelFormatter={(_label, payload) => {
              const item = payload?.[0]?.payload;
              return item?.fullLabel ?? _label;
            }}
            formatter={(value) => [`${value} kWh`, name]}
            cursor={{ fill: "rgba(0,0,0,0.035)" }}
          />
          <Bar
            dataKey="value"
            name={name}
            fill="#414a52"
            radius={[8, 8, 8, 8]}
            maxBarSize={22}
            isAnimationActive={!reduced}
            animationDuration={250}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
