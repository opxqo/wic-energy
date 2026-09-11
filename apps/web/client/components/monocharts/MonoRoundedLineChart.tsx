// Adapted from Subhan-code/Monocharts, MIT. See README.md and LICENSE in this folder.
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useReducedMotion } from "motion/react";
import type { UsagePoint } from "@wic-energy/core";

export function MonoRoundedLineChart({
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
      aria-label={`${name}折线图，详细数值见下方数据明细`}
    >
      <ResponsiveContainer width="100%" height={260} minWidth={0}>
        <LineChart
          data={points}
          margin={{ top: 20, right: 16, left: -16, bottom: 8 }}
          accessibilityLayer
        >
          <CartesianGrid
            strokeDasharray="3 3"
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
          />
          <Line
            type="monotone"
            dataKey="value"
            name={name}
            stroke="#414a52"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={
              points.length > 12
                ? false
                : { r: 3, fill: "#414a52", stroke: "#fff", strokeWidth: 2 }
            }
            activeDot={{
              r: 5,
              fill: "#414a52",
              stroke: "#fff",
              strokeWidth: 2,
            }}
            isAnimationActive={!reduced}
            animationDuration={250}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
