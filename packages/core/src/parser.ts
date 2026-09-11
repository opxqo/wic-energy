import { parse } from "node-html-parser";

import { ParseError } from "./errors.js";
import type {
  AccountSummary,
  MonthOption,
  PaymentRecord,
  SubsidyRecord,
  UsageSeries,
} from "./types.js";

function numberFrom(value?: string): number | null {
  if (!value) return null;
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function tableRows(html: string): string[][] {
  const doc = parse(html);
  return doc
    .querySelectorAll("table tr")
    .map((row) =>
      row
        .querySelectorAll("th,td")
        .map((cell) => cell.textContent.replace(/\u00a0/g, " ").trim()),
    )
    .filter((row) => row.length > 0);
}

export function parseAccountSummary(html: string): AccountSummary {
  const fields = new Map<string, string>();
  for (const row of tableRows(html)) {
    for (let index = 0; index + 1 < row.length; index += 2) {
      const key = row[index];
      const value = row[index + 1];
      if (key && value !== undefined) fields.set(key, value);
    }
  }
  if (
    !["基本账户", "总余额", "电表读数", "电表号"].some((key) => fields.has(key))
  )
    throw new ParseError("信息总揽页面中没有找到账户数据表格");

  return {
    basicBalance: numberFrom(fields.get("基本账户")),
    subsidyBalance: numberFrom(
      fields.get("电补账户") ?? fields.get("补助账户"),
    ),
    totalBalance: numberFrom(fields.get("总余额")),
    meterReadingKwh: numberFrom(fields.get("电表读数")),
    communicationStatus: fields.get("电表通讯") ?? null,
    lightingStatus: fields.get("照明通道") ?? null,
    airConditioningStatus: fields.get("空调通道") ?? null,
    meterNumber: fields.get("电表号") ?? null,
    readAt: fields.get("抄表时间") ?? null,
  };
}

export function parseMonthOptions(body: string): MonthOption[] {
  let value: unknown;
  try {
    value = JSON.parse(body.replace(/^\uFEFF/, "").trim());
  } catch {
    throw new ParseError("月份接口没有返回有效 JSON");
  }
  if (!Array.isArray(value)) throw new ParseError("月份接口返回结构不是数组");

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const id = Number(record.id);
    const label = typeof record.text === "string" ? record.text.trim() : "";
    if (!Number.isInteger(id) || id <= 0 || !label) return [];
    const match = label.match(/(\d{4})年(\d{1,2})月/);
    return [
      {
        id,
        label,
        year: match?.[1] ? Number(match[1]) : null,
        month: match?.[2] ? Number(match[2]) : null,
      },
    ];
  });
}

function extractBalanced(source: string, marker: string): string | null {
  const markerIndex = source.search(new RegExp(marker.replace(":", "\\s*:")));
  if (markerIndex < 0) return null;
  const start = source.indexOf("[", markerIndex + marker.length);
  if (start < 0) return null;
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (!char) continue;
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') quote = char;
    else if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return null;
}

function splitArray(raw: string): string[] {
  const content = raw.slice(1, -1);
  const values: string[] = [];
  let start = 0;
  let quote: string | null = null;
  let escaped = false;
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
    } else if (char === "'" || char === '"') quote = char;
    else if (char === ",") {
      values.push(content.slice(start, index).trim());
      start = index + 1;
    }
  }
  const tail = content.slice(start).trim();
  if (tail) values.push(tail);
  return values;
}

function parseArrayValue(value: string): string | number {
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1).replace(
      /\\([\\'"nrt])/g,
      (_match, char: string) =>
        ({
          n: "\n",
          r: "\r",
          t: "\t",
          "\\": "\\",
          "'": "'",
          '"': '"',
        })[char] ?? char,
    );
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric))
    throw new ParseError(`图表中出现无法解析的数值：${value}`);
  return numeric;
}

export function parseUsageSeries(html: string): UsageSeries {
  const source = parse(html)
    .querySelectorAll("script")
    .map((script) => script.textContent)
    .find(
      (script) =>
        script.includes("Highcharts.Chart") && /series\s*:/.test(script),
    );
  if (!source) throw new ParseError("页面中没有找到 Highcharts 数据");

  const title =
    source.match(/title\s*:\s*\{\s*text\s*:\s*(["'])([\s\S]*?)\1/)?.[2] ?? "";
  const name =
    source.match(/series\s*:\s*\[\s*\{\s*name\s*:\s*(["'])([\s\S]*?)\1/)?.[2] ??
    "";
  const categoryRaw = extractBalanced(source, "categories:");
  const seriesMatches = [...source.matchAll(/series\s*:\s*\[/g)];
  const seriesStart = seriesMatches.at(-1)?.index ?? -1;
  const dataRaw = extractBalanced(
    seriesStart >= 0 ? source.slice(seriesStart) : source,
    "data:",
  );
  if (!dataRaw) throw new ParseError("Highcharts 配置中没有找到 series.data");

  const labels = categoryRaw
    ? splitArray(categoryRaw).map(parseArrayValue).map(String)
    : [];
  const values = splitArray(dataRaw)
    .map(parseArrayValue)
    .map((value) => {
      if (typeof value !== "number")
        throw new ParseError("Highcharts series.data 包含非数值内容");
      return value;
    });

  return {
    title,
    name,
    unit: "kWh",
    points: values.map((value, index) => ({
      label: labels[index] ?? String(index),
      value,
    })),
  };
}

export function parsePaymentRecords(html: string): PaymentRecord[] {
  const rows = tableRows(html);
  if (!rows.length) throw new ParseError("缴费页面中没有找到数据表格");
  return rows
    .slice(1)
    .map((row) => ({
      amount: numberFrom(row[0]),
      operator: row[1] ?? "",
      paidAt: row[2] ?? "",
    }))
    .filter(
      (record) => record.amount !== null || record.operator || record.paidAt,
    );
}

export function parseSubsidyRecords(html: string): SubsidyRecord[] {
  const rows = tableRows(html);
  if (!rows.length) throw new ParseError("月补页面中没有找到数据表格");
  return rows
    .slice(1)
    .map((row) => ({
      amount: numberFrom(row[0]),
      operator: row[1] ?? "",
      grantedAt: row[2] ?? "",
    }))
    .filter(
      (record) => record.amount !== null || record.operator || record.grantedAt,
    );
}

export function isLoginPage(html: string): boolean {
  return (
    /name=["']j_username["']/i.test(html) &&
    /name=["']j_kxiotdata["']/i.test(html) &&
    /请输入用户名|手机管理平台登录/i.test(html)
  );
}
