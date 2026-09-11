import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  AppError,
  AuthenticationError,
  ValidationError,
  SchoolSession,
  EnergyService,
  connectionConfig,
  normalizeCookie,
  validateQuery,
  type ConnectionOptions,
  type EnergyQuery,
} from "@wic-energy/core";

const COOKIE = "wic_energy_session";
function cookieOptions(req: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: req.secure,
    path: "/",
  };
}
function credentials(req: Request): string {
  const authorization = req.get("authorization");
  if (authorization !== undefined) {
    const value = /^Bearer (.+)$/i.exec(authorization)?.[1];
    if (!value) throw new AuthenticationError("Authorization 格式无效");
    return normalizeCookie(value);
  }
  const entry = (req.get("cookie") ?? "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(COOKIE + "="));
  if (!entry) throw new AuthenticationError("请先登录");
  try {
    return normalizeCookie(decodeURIComponent(entry.slice(COOKIE.length + 1)));
  } catch {
    throw new AuthenticationError("会话无效，请重新登录");
  }
}
export function createApp(options: ConnectionOptions = connectionConfig()) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "8kb" }));
  app.use("/api", (req, res, next) => {
    if (
      req.method === "POST" &&
      (req.get("sec-fetch-site") === "cross-site" ||
        (req.get("origin") &&
          req.get("origin") !== req.protocol + "://" + req.get("host")))
    ) {
      res
        .status(403)
        .json({ error: { code: "FORBIDDEN", message: "不允许跨站提交" } });
      return;
    }
    next();
  });
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body ?? {};
    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.length > 256 ||
      password.length > 1024
    )
      throw new ValidationError("请输入账号和密码");
    const session = await SchoolSession.login(options, username, password);
    res.cookie(COOKIE, session.sessionCookie, cookieOptions(req));
    res.json({ data: { cookie: session.sessionCookie } });
  });
  app.post("/api/logout", (req, res) => {
    res.clearCookie(COOKIE, cookieOptions(req));
    res.json({ data: { authenticated: false } });
  });
  app.get("/api/user", async (req, res) => {
    const session = new SchoolSession(options, credentials(req));
    await new EnergyService(session).query({ kind: "account" });
    res.cookie(COOKIE, session.sessionCookie, cookieOptions(req));
    res.json({ data: { authenticated: true } });
  });
  const routes: Array<[string, EnergyQuery["kind"]]> = [
    ["/account", "account"],
    ["/months", "months"],
    ["/usage/monthly", "monthly"],
    ["/usage/daily", "daily"],
    ["/usage/hourly", "hourly"],
    ["/payments", "payments"],
    ["/subsidies", "subsidies"],
  ];
  for (const [path, kind] of routes)
    app.get("/api" + path, async (req, res) => {
      const session = new SchoolSession(options, credentials(req));
      // Core validation rejects unknown keys, impossible dates and invalid ranges.
      const query = validateQuery({ ...req.query, kind } as EnergyQuery);
      const data = await new EnergyService(session).query(query);
      res.cookie(COOKIE, session.sessionCookie, cookieOptions(req));
      res.json({
        data,
        meta: {
          source: new URL(options.baseUrl).hostname,
          fetchedAt: new Date().toISOString(),
          query,
        },
      });
    });
  const publicPath = [
    new URL("../dist/client/", import.meta.url),
    new URL("../client/", import.meta.url),
  ]
    .map((url) => fileURLToPath(url))
    .find(existsSync);
  if (publicPath) app.use(express.static(publicPath));
  app.use((_req, res) =>
    res
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "接口不存在" } }),
  );
  app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
    const failure =
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof SyntaxError ? "JSON 格式无效" : "服务内部错误",
            error instanceof SyntaxError ? 400 : 500,
            error instanceof SyntaxError
              ? "VALIDATION_ERROR"
              : "INTERNAL_ERROR",
          );
    if (failure.status === 401 && req.get("authorization") === undefined)
      res.clearCookie(COOKIE, cookieOptions(req));
    res
      .status(failure.status)
      .json({
        error: {
          code: failure.code,
          message: failure.message,
          ...(failure.details ? { details: failure.details } : {}),
        },
      });
  });
  return app;
}
