import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import type { MonthOption } from "@wic-energy/core";
import {
  endpoints,
  queryParams,
  request,
  RequestError,
  type Kind,
  type QueryResponse,
  type Result,
} from "./api";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import { Field, FieldGroup, FieldLabel } from "./components/ui/field";
import { Input } from "./components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { PageHeader, Reveal, StatusEmpty, PulsatingDots } from "./components/ui";
import { DatePicker } from "./components/DatePicker";
import { ResultView } from "./components/ResultView";
import { SparkleGitHubButton } from "./components/SparkleGitHubButton";
import { useWebHaptics } from "./hooks/useWebHaptics";

export function App() {
  const [session, setSession] = useState<
    "checking" | "authenticated" | "anonymous"
  >("checking");
  const [kind, setKind] = useState<Kind>("account");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("选择查询项目，查看余额与用电记录。");
  const [result, setResult] = useState<Result | null>(null);
  const [monthsResult, setMonthsResult] = useState<
    QueryResponse<"months"> | null
  >(null);
  const [monthId, setMonthId] = useState("");
  const locked = useRef(false);
  const { trigger } = useWebHaptics();
  const reducedMotion = useReducedMotion();
  const endpoint = endpoints.find((e) => e.kind === kind)!;
  const disabled = busy || session === "checking";
  const months: MonthOption[] = monthsResult?.data ?? [];
  useEffect(() => {
    let active = true;
    request("/api/user")
      .then(() => {
        if (active) setSession("authenticated");
      })
      .catch((error) => {
        if (!active) return;
        setSession("anonymous");
        if (!(error instanceof RequestError && error.status === 401))
          setError(
            error instanceof Error ? error.message : "无法检查登录状态。",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (session !== "authenticated") return;
    let active = true;
    request<QueryResponse<"months">>("/api/months")
      .then((response) => {
        if (active) setMonthsResult(response);
      })
      // Month options are a convenience for other queries. A failure remains
      // visible only when the user explicitly opens the months view.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [session]);
  function report(error: unknown) {
    setError(error instanceof Error ? error.message : "请求失败，请稍后重试。");
    trigger("error");
    if (error instanceof RequestError && error.status === 401) {
      setSession("anonymous");
      setResult(null);
      setMonthsResult(null);
    }
  }
  function select(next: Kind) {
    if (disabled) return;
    setKind(next);
    setResult(null);
    setError("");
    setMonthId("");
    if (next === "months") {
      if (monthsResult) {
        setResult({ kind: "months", response: monthsResult });
        setStatus("可用月份 · 已加载");
      } else {
        void loadMonths();
      }
      return;
    }
    setStatus("选择条件后点击查询。");
  }
  async function loadMonths() {
    if (locked.current || session !== "authenticated") return;
    locked.current = true;
    setBusy(true);
    setError("");
    setStatus("正在获取可用月份…");
    try {
      const response = await request<QueryResponse<"months">>("/api/months");
      setMonthsResult(response);
      setResult({ kind: "months", response });
      setStatus("可用月份 · 查询完成");
    } catch (error) {
      report(error);
      setStatus("查询失败，请重试。");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || disabled) return;
    if (session !== "authenticated") {
      setError("请先登录学校账户，再进行查询。");
      document.getElementById("login")?.focus();
      return;
    }
    let params: URLSearchParams;
    try {
      params = queryParams(event.currentTarget);
    } catch (error) {
      report(error);
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    setResult(null);
    setStatus(`正在查询${endpoint.name}…`);
    try {
      const response = await request<QueryResponse<Kind>>(
        endpoint.path + (params.size ? "?" + params.toString() : ""),
      );
      setResult({ kind, response } as Result);
      if (kind === "months")
        setMonthsResult(response as QueryResponse<"months">);
      setStatus(`${endpoint.name} · 查询完成`);
    } catch (error) {
      report(error);
      setStatus("查询失败，请重试。");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function logout() {
    if (locked.current || disabled) return;
    locked.current = true;
    setBusy(true);
    try {
      await request("/api/logout", { method: "POST" });
      setSession("anonymous");
      setResult(null);
      setMonthsResult(null);
      setError("");
      setStatus("已退出登录。");
    } catch (error) {
      report(error);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="container home-page">
      <div className="home-header">
      <PageHeader />
      <div className="user-wrapper">
        <span
          className="session-dot"
          data-active={session === "authenticated"}
          aria-hidden="true"
        />
        <span>
          {session === "checking"
            ? "正在检查登录状态"
            : session === "authenticated"
              ? "学校账户已登录"
              : "尚未登录"}
        </span>
        {session === "authenticated" ? (
          <Button variant="secondary" size="sm" disabled={disabled} onClick={logout}>
            退出
          </Button>
        ) : session === "anonymous" ? (
          <Button asChild size="default"><a id="login" href="/login.html">登录</a></Button>
        ) : null}
      </div>
      </div>
      <div className="intro">
        <p>查询宿舍余额，让每一度电都有迹可循。</p>
        <div className="intro-actions">
          <a href="/docs.html">
            查看接口文档 <span aria-hidden="true">↗</span>
          </a>
          <SparkleGitHubButton />
        </div>
      </div>
      <section aria-labelledby="query-heading">
        <h2 className="section-title" id="query-heading">
          用电查询
        </h2>
        <LayoutGroup id="query-nav">
          <nav className="query-nav" aria-label="查询项目">
            {endpoints.map((e) => {
              const active = kind === e.kind;
              return (
                <motion.button
                  key={e.kind}
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => select(e.kind)}
                >
                  {active && (
                    <motion.span
                      layoutId="query-nav-active-pill"
                      data-testid="query-nav-indicator"
                      className="query-nav-indicator"
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 500, damping: 36 }
                      }
                    />
                  )}
                  <span className="query-nav-label">{e.name}</span>
                </motion.button>
              );
            })}
          </nav>
        </LayoutGroup>
        <section className="query-panel" aria-label={endpoint.name} data-has-filters={kind !== "account" && kind !== "months" && kind !== "overview"}>
          <div className="query-copy">
            <h3>{endpoint.name}</h3>
            <p className="note">{endpoint.note}</p>
          </div>
          <form
            key={kind}
            className="query-form"
            onSubmit={submit}
            aria-busy={busy}
          >
            <FieldGroup className="controls">
            {(kind === "monthly" || kind === "daily") && (
              <Field>
                <FieldLabel htmlFor="month-id">月份</FieldLabel>
                {months.length ? (
                  <>
                  <input type="hidden" name="monthId" value={monthId} />
                  <Select value={monthId} onValueChange={setMonthId} disabled={disabled}>
                    <SelectTrigger id="month-id" aria-label="月份" className="w-[170px]">
                      <SelectValue placeholder="学校默认月份" />
                    </SelectTrigger>
                    <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.label}
                      </SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                  </>
                ) : (
                  <Input
                    id="month-id"
                    name="monthId"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="月份 ID（可留空）"
                    disabled={disabled}
                  />
                )}
              </Field>
            )}
            {kind === "hourly" && (
              <Field><FieldLabel htmlFor="end-date">结束日期</FieldLabel><DatePicker id="end-date" name="date" disabled={disabled} /></Field>
            )}
            {(kind === "payments" || kind === "subsidies") && (
              <>
                <Field><FieldLabel htmlFor="from-date">开始日期</FieldLabel><DatePicker id="from-date" name="from" disabled={disabled} /></Field>
                <Field><FieldLabel htmlFor="to-date">结束日期</FieldLabel><DatePicker id="to-date" name="to" disabled={disabled} /></Field>
              </>
            )}
            <Button type="submit" disabled={disabled}>
              {busy ? "处理中…" : "查询"}
            </Button>
            {(kind === "monthly" || kind === "daily") && !months.length && (
              <Button
                variant="outline"
                disabled={disabled}
                onClick={() => select("months")}
              >
                查看可用月份
              </Button>
            )}
            </FieldGroup>
          </form>
        </section>
      </section>
      <section aria-labelledby="result-heading" aria-busy={busy}>
        <div className="result-heading">
          <h2 className="section-title" id="result-heading">
            查询结果
          </h2>
          <span className="note">
            {result
              ? endpoints.find((e) => e.kind === result.kind)?.name
              : "等待查询"}
          </span>
        </div>
        <p className="status" role="status" aria-live="polite">
          {status}
        </p>
        {error && (
          <Alert variant="destructive" className="message"><AlertDescription>{error}</AlertDescription></Alert>
        )}
        <AnimatePresence mode="wait">
          {result ? (
            <Reveal key={result.response.meta.fetchedAt}>
              <ResultView result={result} />
              <p className="result-meta">
                数据来源：{result.response.meta.source} · 查询于{" "}
                {new Date(result.response.meta.fetchedAt).toLocaleString(
                  "zh-CN",
                )}
              </p>
              <details className="raw-result">
                <summary>查看原始 JSON</summary>
                <pre className="result" tabIndex={0}>
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </details>
            </Reveal>
          ) : (
            <Reveal key={busy ? "loading" : "empty"}>
              <StatusEmpty
                loading={busy}
                loader={
                  kind === "overview" ||
                  kind === "monthly" ||
                  kind === "daily" ||
                  kind === "hourly" ? (
                    <PulsatingDots />
                  ) : undefined
                }
              >
                {busy ? (
                  "正在向学校查询，请稍候…"
                ) : error ? (
                  "本次查询未完成，请检查提示后重试。"
                ) : session === "anonymous" ? (
                  <>
                    登录学校账户后，即可查询余额与用电记录。
                    <br />
                    <a href="/login.html">前往登录</a>
                  </>
                ) : (
                  "选择上方的查询项目，结果将在这里显示。"
                )}
              </StatusEmpty>
            </Reveal>
          )}
        </AnimatePresence>
      </section>
      <footer className="site-footer">
        <p className="footer-service">
          <strong>WIC Energy</strong>
          <span>·</span>
          仅提供学校用电查询服务
        </p>
        <p className="footer-credit">
          <span className="footer-created-by">Created by</span>
          <a
            href="https://github.com/opxqo/wic-energy"
            target="_blank"
            rel="noreferrer"
          >
            <strong>OPXQO</strong>
          </a>
          <span className="footer-separator">·</span>
          <a
            href="https://github.com/opxqo/wic-energy/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms &amp; License
          </a>
        </p>
      </footer>
    </main>
  );
}
