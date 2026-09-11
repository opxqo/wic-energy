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
import {
  Wallet,
  ChartColumn,
  CalendarRange,
  Clock,
  Receipt,
  Gift,
  CalendarSearch,
  LayoutDashboard,
  Search,
  LogOut,
  LogIn,
  BookOpen,
  Calendar,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
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

const KIND_ICONS: Record<
  Kind,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>
> = {
  account: Wallet,
  monthly: ChartColumn,
  daily: CalendarRange,
  hourly: Clock,
  payments: Receipt,
  subsidies: Gift,
  months: CalendarSearch,
  overview: LayoutDashboard,
};

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const locked = useRef(false);
  const { trigger } = useWebHaptics();
  const reducedMotion = useReducedMotion();
  const endpoint = endpoints.find((e) => e.kind === kind)!;
  const ActiveIcon = KIND_ICONS[kind];
  const disabled = busy || session === "checking";
  const months: MonthOption[] = monthsResult?.data ?? [];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);
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
  async function executeQuery(targetKind: Kind, params?: URLSearchParams) {
    if (locked.current) return;
    if (session !== "authenticated") {
      setError("请先登录学校账户，再进行查询。");
      document.getElementById("login")?.focus();
      return;
    }
    const targetEndpoint = endpoints.find((e) => e.kind === targetKind)!;
    locked.current = true;
    setBusy(true);
    setError("");
    setResult(null);
    setStatus(`正在查询${targetEndpoint.name}…`);
    try {
      const queryString = params && params.size ? "?" + params.toString() : "";
      const response = await request<QueryResponse<Kind>>(
        targetEndpoint.path + queryString,
      );
      setResult({ kind: targetKind, response } as Result);
      if (targetKind === "months")
        setMonthsResult(response as QueryResponse<"months">);
      setStatus(`${targetEndpoint.name} · 查询完成`);
    } catch (error) {
      report(error);
      setStatus("查询失败，请重试。");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
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
    void executeQuery("account");
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
    setSidebarOpen(false);
    setResult(null);
    setError("");
    setMonthId("");
    if (next === "months") {
      if (monthsResult) {
        setResult({ kind: "months", response: monthsResult });
        setStatus("可用月份 · 已加载");
      } else if (session === "authenticated") {
        void executeQuery("months");
      } else {
        setStatus("请先登录学校账户，再进行查询。");
      }
      return;
    }
    if (session === "authenticated") {
      void executeQuery(next);
    } else {
      setStatus("请先登录学校账户，再进行查询。");
    }
  }
  function handleMonthChange(value: string) {
    setMonthId(value);
    if (session === "authenticated" && !locked.current && !busy) {
      const params = new URLSearchParams();
      if (value) params.set("monthId", value);
      void executeQuery(kind, params);
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
    await executeQuery(kind, params);
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
      {/* Mobile Top AppBar (Sticky, Mobile Only) */}
      <header className="mobile-appbar" aria-label="移动端顶部导航">
        <button
          type="button"
          className="mobile-menu-trigger"
          aria-label="打开导航菜单切换栏目"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-5 shrink-0 text-foreground" aria-hidden="true" />
          <span className="mobile-menu-trigger-info">
            <ActiveIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="mobile-menu-trigger-name">{endpoint.name}</span>
          </span>
          <ChevronRight className="size-3.5 opacity-50 shrink-0" aria-hidden="true" />
        </button>
        <div className="mobile-appbar-actions">
          {session === "authenticated" ? (
            <div className="mobile-session-badge">
              <span className="session-dot" data-active="true" aria-hidden="true" />
              <span className="mobile-session-label">已登录</span>
            </div>
          ) : session === "anonymous" ? (
            <a href="/login.html" className="mobile-login-link" aria-label="前往登录">
              <LogIn className="size-3.5 shrink-0" aria-hidden="true" />
              <span>登入</span>
            </a>
          ) : null}
        </div>
      </header>

      {/* Mobile Sidebar Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? "active" : ""}`}
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
      />

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
            <LogOut className="size-3.5 mr-1 shrink-0" aria-hidden="true" />
            退出
          </Button>
        ) : session === "anonymous" ? (
          <Button asChild size="default">
            <a id="login" href="/login.html">
              <LogIn className="size-3.5 mr-1 shrink-0" aria-hidden="true" />
              登录
            </a>
          </Button>
        ) : null}
      </div>
      </div>
      <div className="intro">
        <p>查询宿舍余额，让每一度电都有迹可循。</p>
        <div className="intro-actions">
          <a href="/docs.html">
            <BookOpen className="size-3.5 inline mr-1 -mt-0.5 shrink-0" aria-hidden="true" />
            查看接口文档 <span aria-hidden="true">↗</span>
          </a>
          <SparkleGitHubButton />
        </div>
      </div>
      <section aria-labelledby="query-heading" className="query-section">
        <h2 className="section-title" id="query-heading">
          用电查询
        </h2>
        <aside
          className={`sidebar-drawer ${sidebarOpen ? "open" : ""}`}
          aria-label="查询栏目侧边栏"
        >
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <span className="sidebar-brand-title">WIC Energy</span>
              <span className="sidebar-brand-sub">智慧能源管理</span>
            </div>
            <button
              type="button"
              className="sidebar-close-btn"
              aria-label="关闭侧边栏"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="sidebar-session-card">
            <div className="sidebar-session-row">
              <span
                className="session-dot"
                data-active={session === "authenticated"}
                aria-hidden="true"
              />
              <span className="sidebar-session-title">
                {session === "checking"
                  ? "检查状态…"
                  : session === "authenticated"
                    ? "会话已连接"
                    : "未登录"}
              </span>
            </div>
            {session === "authenticated" ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  setSidebarOpen(false);
                  void logout();
                }}
                aria-label="退出当前登录"
              >
                <LogOut className="size-3 mr-1 shrink-0" aria-hidden="true" />
                退出登录
              </Button>
            ) : session === "anonymous" ? (
              <Button asChild size="sm">
                <a href="/login.html" aria-label="前往登录页面">
                  <LogIn className="size-3 mr-1 shrink-0" aria-hidden="true" />
                  登入
                </a>
              </Button>
            ) : null}
          </div>

          <div className="sidebar-nav-heading">功能栏目切换</div>

          <LayoutGroup id="query-nav">
            <nav className="query-nav" aria-label="查询项目">
              {endpoints.map((e) => {
                const active = kind === e.kind;
                const Icon = KIND_ICONS[e.kind];
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
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="query-nav-label">{e.name}</span>
                  </motion.button>
                );
              })}
            </nav>
          </LayoutGroup>

          <div className="sidebar-footer">
            <a href="/docs.html" className="sidebar-footer-link">
              <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
              <span>接口文档与集成指南 ↗</span>
            </a>
            <a
              href="https://github.com/opxqo/wic-energy"
              target="_blank"
              rel="noreferrer"
              className="sidebar-footer-link"
            >
              <span>GitHub 项目仓库 ↗</span>
            </a>
          </div>
        </aside>
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
                  <Select value={monthId} onValueChange={handleMonthChange} disabled={disabled}>
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
              <Search className="size-3.5 mr-1.5 shrink-0" aria-hidden="true" />
              {busy ? "处理中…" : "查询"}
            </Button>
            {(kind === "monthly" || kind === "daily") && !months.length && (
              <Button
                variant="outline"
                disabled={disabled}
                onClick={() => select("months")}
              >
                <Calendar className="size-3.5 mr-1.5 shrink-0" aria-hidden="true" />
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
          <span className="footer-separator">·</span>
          <a
            href="https://allsvgicons.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Free & Open Source SVG Icons"
          >
            All SVG Icons
          </a>
        </p>
      </footer>
    </main>
  );
}
