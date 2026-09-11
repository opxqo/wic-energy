import {
  SchoolSession,
  EnergyService,
  ValidationError,
  connectionConfig,
  validateQuery,
  type EnergyQuery,
} from "@wic-energy/core";
import {
  readSession,
  saveSession,
  clearSession,
  sessionPath,
} from "./session.js";
export interface CliIO {
  ask(label: string, hidden?: boolean): Promise<string>;
  print(value: unknown): void;
}
export async function runCli(args: string[], io: CliIO) {
  const options = connectionConfig();
  const file = sessionPath();
  let explicitCookie: string | undefined;
  const positionals: string[] = [];
  const flags = new Map<string, string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--json") continue;
    if (arg.startsWith("--") && arg !== "--help") {
      const equal = arg.indexOf("=");
      const key = equal < 0 ? arg.slice(2) : arg.slice(2, equal);
      const value = equal < 0 ? args[++i] : arg.slice(equal + 1);
      if (
        !["cookie", "id", "date", "from", "to"].includes(key) ||
        !value ||
        value.startsWith("--") ||
        flags.has(key)
      )
        throw new ValidationError("无效选项：" + arg);
      flags.set(key, value);
    } else positionals.push(arg);
  }
  explicitCookie = flags.get("cookie");
  flags.delete("cookie");
  const [raw, ...params] = positionals;
  const aliases: Record<string, string> = {
    summary: "account",
    month: "monthly",
    day: "daily",
    hours: "hourly",
  };
  const command = aliases[raw ?? ""] ?? raw;
  if (!command || ["help", "--help", "-h"].includes(command)) {
    io.print(
      "wic-energy login | logout | account | months | monthly [monthId] | daily [monthId] | hourly [YYYY-MM-DD] | payments [from] [to] | subsidies [from] [to]\n查询可加 --cookie JSESSIONID=...；也支持 --id、--date、--from、--to。",
    );
    return;
  }
  if (command === "login" || command === "logout") {
    if (params.length || flags.size || explicitCookie)
      throw new ValidationError(command + " 不接受参数");
    if (command === "logout") {
      await clearSession(file);
      io.print({ ok: true });
      return;
    }
    const username = await io.ask("学校账号：");
    const password = await io.ask("密码：", true);
    const session = await SchoolSession.login(options, username, password);
    await saveSession(file, session.sessionCookie, options.baseUrl);
    io.print({ ok: true, sessionFile: file });
    return;
  }
  const allowed: Record<string, string[]> = {
    account: [],
    months: [],
    monthly: ["id"],
    daily: ["id"],
    hourly: ["date"],
    payments: ["from", "to"],
    subsidies: ["from", "to"],
  };
  const keys = allowed[command];
  if (!keys) throw new ValidationError("未知命令：" + command);
  if (
    params.length > keys.length ||
    [...flags.keys()].some((k) => !keys.includes(k))
  )
    throw new ValidationError("参数过多或不适用");
  const values = keys.map((key, i) => {
    if (flags.has(key) && params[i] !== undefined)
      throw new ValidationError("重复参数：" + key);
    return flags.get(key) ?? params[i];
  });
  let query: EnergyQuery;
  if (command === "monthly" || command === "daily")
    query = {
      kind: command,
      monthId: values[0] === undefined ? undefined : Number(values[0]),
    };
  else if (command === "hourly") query = { kind: command, date: values[0] };
  else if (command === "payments" || command === "subsidies")
    query = { kind: command, from: values[0], to: values[1] };
  else query = { kind: command as "account" | "months" };
  validateQuery(query);
  const session = new SchoolSession(
    options,
    explicitCookie ?? (await readSession(file, options.baseUrl)),
  );
  const data = await new EnergyService(session).query(query);
  if (!explicitCookie)
    await saveSession(file, session.sessionCookie, options.baseUrl);
  io.print({
    data,
    meta: {
      source: new URL(options.baseUrl).hostname,
      fetchedAt: new Date().toISOString(),
      query,
    },
  });
}
