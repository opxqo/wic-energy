import type { EnergyQuery, EnergyResult } from "@wic-energy/core";

export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export interface QueryResponse<K extends EnergyQuery["kind"]> {
  data: EnergyResult<Extract<EnergyQuery, { kind: K }>>;
  meta: { source: string; fetchedAt: string; query: EnergyQuery };
}
export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new RequestError("服务响应异常，请稍后重试。", response.status);
  }
  if (!response.ok)
    throw new RequestError(
      body.error?.message ?? "请求失败，请稍后重试。",
      response.status,
    );
  return body as T;
}

export const endpoints = [
  {
    kind: "account",
    name: "账户总览",
    path: "/api/account",
    note: "余额、电表读数、通道状态与抄表时间。",
  },
  {
    kind: "monthly",
    name: "月用电",
    path: "/api/usage/monthly",
    note: "截至所选月份的六个月用电量。留空使用学校默认月份。",
  },
  {
    kind: "daily",
    name: "日用电",
    path: "/api/usage/daily",
    note: "所选月份每天的用电量。留空使用学校默认月份。",
  },
  {
    kind: "hourly",
    name: "72 小时用电",
    path: "/api/usage/hourly",
    note: "以所选日期为结束日期的 72 小时用电量。留空使用学校默认日期。",
  },
  {
    kind: "payments",
    name: "缴费记录",
    path: "/api/payments",
    note: "开始与结束日期需同时填写或同时留空。",
  },
  {
    kind: "subsidies",
    name: "月补记录",
    path: "/api/subsidies",
    note: "开始与结束日期需同时填写或同时留空。",
  },
  {
    kind: "months",
    name: "可用月份",
    path: "/api/months",
    note: "查询学校提供的月份及 ID，用于月用电与日用电查询。",
  },
] as const;
export type Kind = (typeof endpoints)[number]["kind"];
export type Result = {
  [K in Kind]: { kind: K; response: QueryResponse<K> };
}[Kind];

export function queryParams(form: HTMLFormElement): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(form))
    if (String(value).trim()) params.set(key, String(value).trim());
  if (params.has("from") !== params.has("to"))
    throw new Error("请同时填写开始与结束日期。");
  if (params.has("from") && params.get("from")! > params.get("to")!)
    throw new Error("开始日期不能晚于结束日期。");
  return params;
}
