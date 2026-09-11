import { createHash } from "node:crypto";
import {
  AuthenticationError,
  UpstreamError,
  ValidationError,
} from "./errors.js";
import { isLoginPage } from "./parser.js";
import type { UpstreamPort } from "./types.js";
export interface ConnectionOptions {
  baseUrl: string;
  timeoutMs: number;
}
const queues = new Map<string, Promise<void>>();
export function normalizeCookie(raw: string): string {
  if (!/^JSESSIONID=[A-Za-z0-9._~-]{1,512}$/.test(raw))
    throw new AuthenticationError("无效的学校会话，请重新登录");
  return raw;
}
async function serial<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const run = (queues.get(key) ?? Promise.resolve()).then(operation, operation);
  const tail = run.then(
    () => {},
    () => {},
  );
  queues.set(key, tail);
  try {
    return await run;
  } finally {
    if (queues.get(key) === tail) queues.delete(key);
  }
}
export class SchoolSession implements UpstreamPort {
  private cookie: string;
  private readonly base: URL;
  constructor(
    private readonly options: ConnectionOptions,
    cookie = "",
  ) {
    this.base = new URL(
      options.baseUrl.endsWith("/") ? options.baseUrl : options.baseUrl + "/",
    );
    this.cookie = cookie ? normalizeCookie(cookie) : "";
  }
  get sessionCookie() {
    return this.cookie;
  }
  static async login(
    options: ConnectionOptions,
    username: string,
    password: string,
  ): Promise<SchoolSession> {
    if (!username.trim() || !password)
      throw new ValidationError("请输入账号和密码");
    const session = new SchoolSession(options);
    await session.request("mobile!main.action");
    const html = await session.request("mobile!main.action", undefined, {
      j_username: username.trim(),
      j_kxiotdata: password,
    });
    if (
      isLoginPage(html) ||
      !/月用电查询|信息总揽|基本账户/.test(html) ||
      !session.cookie
    )
      throw new AuthenticationError("账号密码未通过学校验证");
    return session;
  }
  async get(
    route: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<string> {
    if (!this.cookie) throw new AuthenticationError("请先登录");
    const key = createHash("sha256")
      .update(this.base.href + "\0" + this.cookie)
      .digest("hex");
    return serial(key, async () => {
      const html = await this.request(route, params);
      if (isLoginPage(html))
        throw new AuthenticationError("学校会话已过期，请重新登录");
      return html;
    });
  }
  private async request(
    route: string,
    params?: Record<string, string | number | undefined>,
    form?: Record<string, string>,
  ): Promise<string> {
    let url = new URL(route, this.base);
    if (url.origin !== this.base.origin)
      throw new UpstreamError("禁止跨站上游请求");
    for (const [key, value] of Object.entries(params ?? {}))
      if (value !== undefined) url.searchParams.set(key, String(value));
    let method = form ? "POST" : "GET";
    let body = form ? new URLSearchParams(form).toString() : undefined;
    const signal = AbortSignal.timeout(this.options.timeoutMs);
    for (let redirects = 0; redirects <= 6; redirects++) {
      try {
        const response = await fetch(url, {
          method,
          body,
          signal,
          redirect: "manual",
          headers: {
            Accept: "text/html,application/json",
            "User-Agent": "wic-energy/2.0",
            ...(this.cookie ? { Cookie: this.cookie } : {}),
            ...(body
              ? {
                  "Content-Type":
                    "application/x-www-form-urlencoded;charset=UTF-8",
                }
              : {}),
          },
        });
        for (const setCookie of response.headers.getSetCookie()) {
          const pair = setCookie.split(";")[0] ?? "";
          if (pair.startsWith("JSESSIONID="))
            this.cookie = pair === "JSESSIONID=" ? "" : normalizeCookie(pair);
        }
        const location = response.headers.get("location");
        if (response.status >= 300 && response.status < 400 && location) {
          await response.body?.cancel();
          const next = new URL(location, url);
          if (next.origin !== this.base.origin)
            throw new AuthenticationError("学校要求重新登录");
          url = next;
          if (![307, 308].includes(response.status)) {
            method = "GET";
            body = undefined;
          }
          continue;
        }
        if ([401, 403].includes(response.status)) {
          await response.body?.cancel();
          throw new AuthenticationError();
        }
        if (!response.ok) {
          await response.body?.cancel();
          throw new UpstreamError("学校返回 HTTP " + response.status);
        }
        return await response.text();
      } catch (error) {
        if (
          error instanceof AuthenticationError ||
          error instanceof UpstreamError
        )
          throw error;
        throw new UpstreamError(
          signal.aborted ? "请求学校超时" : "无法连接学校服务",
        );
      }
    }
    throw new UpstreamError("学校重定向次数过多");
  }
}
