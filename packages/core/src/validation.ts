import { z } from "zod";
import { ValidationError } from "./errors.js";
import type { EnergyQuery } from "./types.js";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(value + "T00:00:00Z");
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "日期不存在");
export const monthSchema = z
  .object({ monthId: z.coerce.number().int().positive().safe().optional() })
  .strict();
export const hourlySchema = z.object({ date: date.optional() }).strict();
export const rangeSchema = z
  .object({ from: date.optional(), to: date.optional() })
  .strict()
  .refine((v) => Boolean(v.from) === Boolean(v.to), "from 和 to 必须同时提供")
  .refine((v) => !v.from || !v.to || v.from <= v.to, "from 不能晚于 to");
export const overviewSchema = z
  .object({
    monthsCount: z.coerce.number().int().positive().max(36).optional(),
    monthId: z.coerce.number().int().positive().safe().optional(),
  })
  .strict();
export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new ValidationError(
      "查询参数无效",
      result.error.issues.map((i) => i.message),
    );
  return result.data;
}
export function validateQuery(query: EnergyQuery): EnergyQuery {
  const { kind, ...params } = query;
  switch (kind) {
    case "monthly":
    case "daily":
      return { kind, ...validate(monthSchema, params) };
    case "hourly":
      return { kind, ...validate(hourlySchema, params) };
    case "payments":
    case "subsidies":
      return { kind, ...validate(rangeSchema, params) };
    case "overview":
      return { kind, ...validate(overviewSchema, params) };
    case "account":
    case "months":
      validate(z.object({}).strict(), params);
      return { kind };
    default:
      throw new ValidationError("未知查询");
  }
}
