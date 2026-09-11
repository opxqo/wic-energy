import * as React from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Code2,
  ExternalLink,
  Info,
  Layers,
  Menu,
  Search,
  ShieldCheck,
  Terminal,
  X,
  Zap,
} from "lucide-react"

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .08 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.15-4.56-5.11 0-1.13.39-2.05 1.04-2.78-.1-.26-.45-1.31.1-2.74 0 0 .85-.28 2.75 1.06A9.3 9.3 0 0 1 12 6.1c.85 0 1.7.12 2.5.34 1.9-1.34 2.75-1.06 2.75-1.06.55 1.43.2 2.48.1 2.74.65.73 1.04 1.65 1.04 2.78 0 3.97-2.35 4.85-4.58 5.1.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.23 10.23 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
    </svg>
  )
}
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { CodeBlock } from "./components/CodeBlock"
import { ApifoxIcon } from "./components/ApifoxIcon"

interface NavItem {
  title: string
  href: string
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "快速起步",
    items: [
      { title: "项目概述", href: "#overview" },
      { title: "核心特性", href: "#features" },
      { title: "架构与原理", href: "#architecture" },
    ],
  },
  {
    title: "认证与会话",
    items: [
      { title: "身份认证 (Login)", href: "#auth-login", badge: "POST" },
      { title: "会话检查 (User)", href: "#auth-user", badge: "GET" },
      { title: "安全登出 (Logout)", href: "#auth-logout", badge: "POST" },
    ],
  },
  {
    title: "用电数据接口",
    items: [
      { title: "账户总览 (Account)", href: "#endpoint-account", badge: "GET" },
      { title: "可用月份 (Months)", href: "#endpoint-months", badge: "GET" },
      { title: "用电总览 (Overview)", href: "#endpoint-overview", badge: "NEW" },
      { title: "月度用电 (Monthly)", href: "#endpoint-monthly", badge: "GET" },
      { title: "日用电量 (Daily)", href: "#endpoint-daily", badge: "GET" },
      { title: "72小时用电 (Hourly)", href: "#endpoint-hourly", badge: "GET" },
      { title: "缴费记录 (Payments)", href: "#endpoint-payments", badge: "GET" },
      { title: "月补记录 (Subsidies)", href: "#endpoint-subsidies", badge: "GET" },
    ],
  },
  {
    title: "参考与规范",
    items: [
      { title: "响应与错误模型", href: "#errors" },
      { title: "并发与安全限制", href: "#guidelines" },
    ],
  },
]

const tocItems = [
  { id: "overview", label: "项目概述" },
  { id: "features", label: "核心特性" },
  { id: "architecture", label: "架构设计" },
  { id: "auth-login", label: "身份认证与凭据" },
  { id: "endpoint-overview", label: "用电总览 API" },
  { id: "endpoint-account", label: "账户总览 API" },
  { id: "endpoint-daily", label: "日用电量 API" },
  { id: "endpoint-monthly", label: "月用电量 API" },
  { id: "endpoint-hourly", label: "72小时用电 API" },
  { id: "endpoint-payments", label: "缴费与月补记录" },
  { id: "errors", label: "响应与错误模型" },
  { id: "guidelines", label: "并发与安全规范" },
]

export function Docs() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [activeHeading, setActiveHeading] = React.useState("overview")

  React.useEffect(() => {
    const handleScroll = () => {
      const headings = tocItems.map((item) => document.getElementById(item.id))
      const scrollPos = window.scrollY + 120

      for (let i = headings.length - 1; i >= 0; i--) {
        const el = headings[i]
        if (el && el.offsetTop <= scrollPos) {
          setActiveHeading(tocItems[i]!.id)
          break
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-muted/40 text-muted-foreground transition hover:text-foreground lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="打开导航菜单"
            >
              {mobileMenuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>
            <a href="/" className="flex items-center gap-2 font-semibold tracking-tight transition hover:opacity-90">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Zap className="size-4 fill-current" />
              </div>
              <span className="text-base font-bold tracking-tight">WIC Energy</span>
              <Badge variant="outline" className="hidden font-mono text-[10px] tracking-tight sm:inline-flex">
                v2.0.0
              </Badge>
            </a>

            {/* Header Navigation */}
            <nav className="ml-6 hidden items-center gap-6 text-sm font-medium lg:flex">
              <a href="/" className="text-muted-foreground transition hover:text-foreground">
                控制台
              </a>
              <a href="/docs.html" className="text-foreground font-semibold">
                接口文档
              </a>
              <a
                href="https://sd.doc.wic.edu.kg/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition font-medium"
              >
                <ApifoxIcon className="size-3.5" />
                <span>Apifox 预调试</span>
                <ExternalLink className="size-3 opacity-60" />
              </a>
              <a href="/login.html" className="text-muted-foreground transition hover:text-foreground">
                登录账户
              </a>
            </nav>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden w-48 sm:block md:w-52">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-muted-foreground">
                <Search className="size-3.5" />
              </div>
              <input
                type="text"
                readOnly
                placeholder="搜索文档..."
                className="h-8 w-full rounded-md border border-input bg-muted/40 pl-8 pr-12 text-xs text-muted-foreground outline-none transition focus:border-ring focus:bg-background"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  ⌘K
                </kbd>
              </div>
            </div>

            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex border-border/80 hover:bg-muted">
              <a
                href="https://sd.doc.wic.edu.kg/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 font-medium"
              >
                <ApifoxIcon className="size-3.5" />
                <span>Apifox 调试</span>
                <ExternalLink className="size-3 opacity-60" />
              </a>
            </Button>

            <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
              <a
                href="https://github.com/opxqo/wic-energy"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5"
              >
                <GitHubIcon className="size-3.5" />
                <span>GitHub</span>
              </a>
            </Button>

            <Button size="sm" asChild>
              <a href="/">打开控制台</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto flex max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Left Sidebar (Desktop) */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r border-border/40 py-6 pr-4 lg:block">
          <div className="space-y-6">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {section.title}
                </h4>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = activeHeading === item.href.slice(1)
                    return (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            isActive
                              ? "bg-accent font-semibold text-foreground"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                        >
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <span
                              className={`ml-2 rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide uppercase ${
                                item.badge === "NEW"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : item.badge === "POST"
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs lg:hidden">
            <div className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-background p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2 font-semibold">
                  <Zap className="size-4 text-primary" />
                  <span>文档导航</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-4 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                      {section.title}
                    </h4>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.href}>
                          <a
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <span>{item.title}</span>
                            {item.badge && (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono font-semibold">
                                {item.badge}
                              </span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Center Main Content */}
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <a href="/" className="hover:text-foreground">
              首页
            </a>
            <ChevronRight className="size-3" />
            <span className="text-foreground">接口文档</span>
            <ChevronRight className="size-3" />
            <span className="text-foreground">API Reference</span>
          </div>

          {/* Page Title & Badges */}
          <div className="space-y-3 pb-8 border-b border-border/40">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              接口文档与集成指南
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed sm:text-lg">
              WIC Energy 提供了整套基于 REST 规范的高性能宿电数据查询服务。支持电表余额查询、历史用电总览、月度/日度/72小时用电统计及缴费月补流水。
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="secondary">RESTful API</Badge>
              <Badge variant="secondary">TypeScript 5.x</Badge>
              <Badge variant="secondary">Node.js / Express 5</Badge>
              <Badge variant="outline">Cookie & Bearer Auth</Badge>
              <Badge variant="success">Highcharts AST 逆向解析</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Button size="sm" asChild className="gap-1.5 shadow-sm bg-[#f44a53] text-white hover:bg-[#e03842]">
                <a href="https://sd.doc.wic.edu.kg/" target="_blank" rel="noreferrer">
                  <ApifoxIcon className="size-3.5 fill-white" />
                  <span className="font-semibold">Apifox 在线预调试平台</span>
                  <ExternalLink className="size-3 opacity-80" />
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <a href="/">
                  <span>打开 Web 控制台</span>
                  <ArrowRight className="size-3.5" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
                <a href="/api/openapi.json" target="_blank" rel="noreferrer">
                  <Code2 className="size-3.5" />
                  <span>OpenAPI 规范 JSON</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Section: Overview */}
          <section id="overview" className="scroll-mt-20 py-8 space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight border-b border-border/40 pb-2">
              项目概述
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              学校用电管理系统采用闭源 Java 架构，前端图表通过 Highcharts 嵌入在不可序列化的 HTML 报表中，且接口仅支持 HTTP 传输。
              本中间件通过逆向 AST 语法树解析并重构数据结构，对外暴露符合规范的标准化 JSON API，保证端到端低时延与零凭据落盘安全。
            </p>

            <Alert className="border-sky-500/20 bg-sky-500/5 text-sky-900 dark:text-sky-200">
              <Info className="size-4 text-sky-600 dark:text-sky-400" />
              <AlertTitle className="font-semibold text-xs text-sky-800 dark:text-sky-300">
                双模式调用支持
              </AlertTitle>
              <AlertDescription className="text-xs text-sky-700 dark:text-sky-400">
                Web 浏览器环境自动通过 <code>HttpOnly SameSite</code> Cookie 保持透明会话；移动端或第三方脚本可直接在请求头附加 <code>Authorization: Bearer &lt;session&gt;</code> 进行免 Cookie 调用。
              </AlertDescription>
            </Alert>
          </section>

          {/* Section: Features */}
          <section id="features" className="scroll-mt-20 py-8 space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight border-b border-border/40 pb-2">
              核心特性
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <CardTitle className="text-sm">安全凭据零存储</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  系统不记录、不落盘任何明文密码与持久化凭据。会话直接映射至学校上游 JSessionID，注销即刻销毁。
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    <CardTitle className="text-sm">全周期日用电总览</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  自动并发拉取历史全量可用月份，将所有每日用电数据连续整合在一张交互柱状图中，清晰呈现能耗趋势。
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-primary" />
                    <CardTitle className="text-sm">高韧性容错解析</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  采用精准的正则与 AST 提取算法，自动抵御上游页面标签漂移、非法字符注入及偶发编码乱码。
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="size-4 text-primary" />
                    <CardTitle className="text-sm">全平台统一核心</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  <code>@wic-energy/core</code> 跨平台无缝驱动 Web 前端、Serverless API 与本地命令行 CLI 工具。
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section: Architecture */}
          <section id="architecture" className="scroll-mt-20 py-8 space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight border-b border-border/40 pb-2">
              架构与调用链路
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              客户端请求由中间件校验后代理至学校上游系统，数据清洗完成后包装为标准化结构返回。
            </p>

            <CodeBlock
              filename="architecture.txt"
              language="plaintext"
              code={`[ 客户端 (Web / CLI / cURL) ]
             │ (HTTPS + Bearer Token / Cookie)
             ▼
[ WIC Energy 中间件 (Express 5 + Zod 校验) ]
             │
     ┌───────┴────────────────────────┐
     ▼                                ▼
[ 缓存与并发序列化 ]           [ AST 报表清洗层 ]
     │                                │
     └───────┬────────────────────────┘
             ▼ (HTTP Upstream Session)
[ 学校上游系统 (yuelist.action / query.action) ]`}
            />
          </section>

          {/* Section: Authentication */}
          <section id="auth-login" className="scroll-mt-20 py-8 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono">
                  POST
                </Badge>
                <h2 className="text-2xl font-semibold tracking-tight">/api/login</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                使用学校账号与密码换取会话凭据。
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">请求格式 (JSON)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">参数名</TableHead>
                    <TableHead className="w-24">类型</TableHead>
                    <TableHead className="w-20">必填</TableHead>
                    <TableHead>说明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">username</TableCell>
                    <TableCell className="font-mono text-xs">string</TableCell>
                    <TableCell className="text-emerald-600 text-xs">是</TableCell>
                    <TableCell className="text-xs">学校用电系统账号（如房间号）</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">password</TableCell>
                    <TableCell className="font-mono text-xs">string</TableCell>
                    <TableCell className="text-emerald-600 text-xs">是</TableCell>
                    <TableCell className="text-xs">查询密码（验证后立即在内存中丢弃）</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <Tabs defaultValue="curl">
              <TabsList>
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="fetch">Fetch (JavaScript)</TabsTrigger>
                <TabsTrigger value="response">成功响应 (200)</TabsTrigger>
              </TabsList>
              <TabsContent value="curl">
                <CodeBlock
                  filename="login.sh"
                  language="bash"
                  code={`curl -X POST https://sd.wic.edu.kg/api/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "南1-548", "password": "your-password"}' \\
  -c cookies.txt`}
                />
              </TabsContent>
              <TabsContent value="fetch">
                <CodeBlock
                  filename="login.js"
                  language="javascript"
                  code={`const res = await fetch("https://sd.wic.edu.kg/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "南1-548", password: "your-password" }),
});
const data = await res.json();
console.log("Token:", data.data.cookie);`}
                />
              </TabsContent>
              <TabsContent value="response">
                <CodeBlock
                  filename="response.json"
                  language="json"
                  code={`{
  "data": {
    "cookie": "JSESSIONID=A7C4F98E231D56..."
  },
  "meta": {
    "source": "school.edu.cn",
    "fetchedAt": "2026-09-11T12:00:00.000Z",
    "query": { "kind": "login" }
  }
}`}
                />
              </TabsContent>
            </Tabs>
          </section>

          {/* Section: Overview API */}
          <section id="endpoint-overview" className="scroll-mt-20 py-8 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono">
                  NEW
                </Badge>
                <Badge variant="default" className="bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono">
                  GET
                </Badge>
                <h2 className="text-2xl font-semibold tracking-tight">/api/usage/overview</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                拉取全量可用月份的日用电量汇总数据，按时间轴连续拼接所有每日数据。
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">查询参数 (URL Query)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">参数名</TableHead>
                    <TableHead className="w-24">类型</TableHead>
                    <TableHead className="w-20">必填</TableHead>
                    <TableHead>说明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">monthId</TableCell>
                    <TableCell className="font-mono text-xs">number</TableCell>
                    <TableCell className="text-muted-foreground text-xs">否</TableCell>
                    <TableCell className="text-xs">指定单个月份 ID。留空则拉取全部可用月份。</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">monthsCount</TableCell>
                    <TableCell className="font-mono text-xs">number</TableCell>
                    <TableCell className="text-muted-foreground text-xs">否</TableCell>
                    <TableCell className="text-xs">最多拉取的历史月份数量（默认全部可用月份，上限 36）。</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <CodeBlock
              filename="response.json"
              language="json"
              code={`{
  "data": {
    "months": [
      {
        "monthId": 1,
        "label": "2026年01月",
        "year": 2026,
        "month": 1,
        "totalKwh": 105.14,
        "points": [
          { "label": "01", "value": 3.4 },
          { "label": "02", "value": 4.1 }
        ]
      },
      {
        "monthId": 2,
        "label": "2026年02月",
        "year": 2026,
        "month": 2,
        "totalKwh": 0.01,
        "points": []
      }
    ]
  },
  "meta": {
    "source": "school.edu.cn",
    "fetchedAt": "2026-09-11T12:00:00.000Z",
    "query": { "kind": "overview" }
  }
}`}
            />
          </section>

          {/* Section: Account API */}
          <section id="endpoint-account" className="scroll-mt-20 py-8 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono">
                  GET
                </Badge>
                <h2 className="text-2xl font-semibold tracking-tight">/api/account</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                获取当前房间电表读数、总余额、基本账户、补助账户及通信通道运行状态。
              </p>
            </div>

            <CodeBlock
              filename="response.json"
              language="json"
              code={`{
  "data": {
    "meterNumber": "0120240901",
    "totalBalance": 68.50,
    "basicBalance": 50.00,
    "subsidyBalance": 18.50,
    "meterReadingKwh": 1420.80,
    "readAt": "2026-09-11 10:30",
    "communicationStatus": "正常",
    "lightingStatus": "合闸",
    "airConditioningStatus": "合闸"
  },
  "meta": {
    "source": "school.edu.cn",
    "fetchedAt": "2026-09-11T12:00:00.000Z",
    "query": { "kind": "account" }
  }
}`}
            />
          </section>

          {/* Section: Other Usage Endpoints */}
          <section id="endpoint-daily" className="scroll-mt-20 py-8 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono">
                  GET
                </Badge>
                <h2 className="text-2xl font-semibold tracking-tight">日用电量与月用电量</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                精细化时序图表接口，返回经过 Highcharts 逆向解析的度数序列。
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">接口路径</TableHead>
                  <TableHead className="w-32">主要参数</TableHead>
                  <TableHead>说明</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs">/api/usage/daily</TableCell>
                  <TableCell className="font-mono text-xs">monthId (可选)</TableCell>
                  <TableCell className="text-xs">指定月份中每一天的用电量（留空为学校默认当月）。</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">/api/usage/monthly</TableCell>
                  <TableCell className="font-mono text-xs">monthId (可选)</TableCell>
                  <TableCell className="text-xs">截至指定月份的近 6 个月度用电量窗口统计。</TableCell>
                </TableRow>
                <TableRow id="endpoint-hourly">
                  <TableCell className="font-mono text-xs">/api/usage/hourly</TableCell>
                  <TableCell className="font-mono text-xs">date (YYYY-MM-DD)</TableCell>
                  <TableCell className="text-xs">以指定日期为终点的连续 72 小时颗粒度用电量。</TableCell>
                </TableRow>
                <TableRow id="endpoint-payments">
                  <TableCell className="font-mono text-xs">/api/payments</TableCell>
                  <TableCell className="font-mono text-xs">from, to (日期)</TableCell>
                  <TableCell className="text-xs">指定日期区间内的充值缴费明细列表。</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs">/api/subsidies</TableCell>
                  <TableCell className="font-mono text-xs">from, to (日期)</TableCell>
                  <TableCell className="text-xs">指定日期区间内的学校用电月度补助发放流水。</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>

          {/* Section: Errors */}
          <section id="errors" className="scroll-mt-20 py-8 space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight border-b border-border/40 pb-2">
              响应与错误规范
            </h2>
            <p className="text-sm text-muted-foreground">
              所有响应均严格包装在统一的数据信封结构中，客户端可依据 HTTP Status Code 与 <code>error.code</code> 进行逻辑判断。
            </p>

            <CodeBlock
              filename="error-response.json"
              language="json"
              code={`{
  "error": {
    "code": "UPSTREAM_SESSION_EXPIRED",
    "message": "学校会话已过期，请重新登录。"
  },
  "meta": {
    "source": "school.edu.cn",
    "fetchedAt": "2026-09-11T12:00:00.000Z"
  }
}`}
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">状态码</TableHead>
                  <TableHead className="w-40">错误代码</TableHead>
                  <TableHead>触发原因与建议处理</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono text-xs font-semibold text-amber-500">400</TableCell>
                  <TableCell className="font-mono text-xs">VALIDATION_ERROR</TableCell>
                  <TableCell className="text-xs">请求参数校验未通过（例如日期格式非 YYYY-MM-DD 或开始日期晚于结束日期）。</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs font-semibold text-rose-500">401</TableCell>
                  <TableCell className="font-mono text-xs">UNAUTHORIZED</TableCell>
                  <TableCell className="text-xs">未携带有效 Cookie/Token，或学校上游会话超时，需重新登录。</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono text-xs font-semibold text-purple-500">502</TableCell>
                  <TableCell className="font-mono text-xs">UPSTREAM_ERROR</TableCell>
                  <TableCell className="text-xs">学校上游报表服务响应超时、连接重置或返回了异常非预期的页面结构。</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </section>

          {/* Section: Guidelines */}
          <section id="guidelines" className="scroll-mt-20 py-8 space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight border-b border-border/40 pb-2">
              并发与安全调用规范
            </h2>
            <Alert className="border-amber-500/20 bg-amber-500/5 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="font-semibold text-xs text-amber-800 dark:text-amber-300">
                上游报表单会话串行要求
              </AlertTitle>
              <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
                学校上游报表系统将查询条件缓存在服务端 Session 作用域内。若针对同一账号并发执行多次不同条件查询，上游可能发生报表串数。
                中间件底层已针对相同 Session 实现了自适应请求互斥锁，客户端编写自动化调用时亦请保持串行请求。
              </AlertDescription>
            </Alert>
          </section>

          {/* Pagination Navigation */}
          <div className="mt-12 flex flex-col gap-4 border-t border-border/40 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/"
              className="group flex flex-col gap-1 rounded-xl border border-border p-4 transition-all hover:border-primary/50 hover:bg-muted/40 sm:w-1/2"
            >
              <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
                <ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" />
                <span>返回上一级</span>
              </div>
              <span className="text-sm font-semibold">控制台首页</span>
            </a>

            <a
              href="/login.html"
              className="group flex flex-col gap-1 items-end rounded-xl border border-border p-4 text-right transition-all hover:border-primary/50 hover:bg-muted/40 sm:w-1/2"
            >
              <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
                <span>快速前往</span>
                <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
              </div>
              <span className="text-sm font-semibold">账户登录页面</span>
            </a>
          </div>

          {/* Footer */}
          <footer className="mt-16 border-t border-border/40 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} WIC Energy. Built with React 19, TypeScript & Tailwind CSS.</p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/opxqo/wic-energy" target="_blank" rel="noreferrer" className="hover:text-foreground">
                GitHub
              </a>
              <a href="/login.html" className="hover:text-foreground">
                登录
              </a>
              <a href="/" className="hover:text-foreground">
                控制台
              </a>
            </div>
          </footer>
        </main>

        {/* Right Sidebar (Table of Contents - Desktop) */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto py-8 pl-6 xl:block">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              本页目录
            </h4>
            <ul className="space-y-2 text-xs">
              {tocItems.map((item) => {
                const isActive = activeHeading === item.id
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`block transition-colors ${
                        isActive
                          ? "font-semibold text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                )
              })}
            </ul>

            <div className="pt-6 border-t border-border/40 space-y-2.5 text-xs text-muted-foreground">
              <a
                href="https://sd.doc.wic.edu.kg/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-foreground/80 hover:text-foreground font-medium"
              >
                <ApifoxIcon className="size-3.5" />
                <span>Apifox 在线预调试平台</span>
                <ExternalLink className="size-3 opacity-60" />
              </a>
              <a
                href="https://github.com/opxqo/wic-energy/issues"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <span>在 GitHub 上反馈问题</span>
                <ExternalLink className="size-3" />
              </a>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="hover:text-foreground"
              >
                返回顶部 ↑
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
