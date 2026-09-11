# WIC Energy · 宿电

把学校能源管理页面转换为只读 JSON API。Web 和 CLI 独立运行，共享学校登录、查询与解析核心。无需预设任何账户密码。

- **Web 控制台**：[https://sd.wic.edu.kg/](https://sd.wic.edu.kg/)
- **接口文档（shadcn 规范）**：[https://sd.wic.edu.kg/docs.html](https://sd.wic.edu.kg/docs.html)
- **Apifox 在线预调试平台**：[https://sd.doc.wic.edu.kg/](https://sd.doc.wic.edu.kg/)
- **OpenAPI 3.0 规范**：[https://sd.wic.edu.kg/api/openapi.json](https://sd.wic.edu.kg/api/openapi.json)

## 开发与运行

需要 Node.js 22+，在仓库根目录执行：

```sh
npm ci
npm run dev:web
# 打开 http://127.0.0.1:3000

npm run cli -- login
npm run cli -- account
```

Web 登录页提交学校账号密码，学校验证成功后返回 JSESSIONID，浏览器自动保存本站 HttpOnly 会话 Cookie。CLI 直接访问学校，不需要运行 Web。

| 命令                                    | 用途                        |
| --------------------------------------- | --------------------------- |
| npm run dev:web                         | 构建核心并监听 Web 代码变化 |
| npm run cli -- COMMAND                  | 构建核心并运行 CLI          |
| npm run build:web / build:cli           | 分别构建，仅依赖共享核心    |
| npm start                               | 启动已构建 Web              |
| npm run test:core / test:web / test:cli | 分别验证                    |
| npm run check                           | 全量构建和测试              |

修改共享核心后重新运行对应开发命令；Web 使用 React + TypeScript + Vite，开发命令自动重新构建页面，保存后刷新即可。三个 workspace 各有独立 package.json、tsconfig 和测试目录。

## API

```http
POST /api/login
Content-Type: application/json

{"username":"学校账号","password":"密码"}
```

响应：`{"data":{"cookie":"JSESSIONID=学校会话值"}}`。返回值属于登录凭据，调用方应妥善保存。查询示例：

```http
GET /api/account
Authorization: Bearer JSESSIONID=学校会话值
```

浏览器使用本站 Cookie；外部客户端使用 Bearer。显式 Authorization 优先，错误时不会回退。密码只用于本次登录，不保留，不自动重新登录。会话失效返回 401。

| 方法 | 路径               | 参数/说明                                      |
| ---- | ------------------ | ---------------------------------------------- |
| GET  | /api/health        | 服务健康检查                                   |
| POST | /api/login         | username、password                             |
| GET  | /api/user          | 验证学校会话，成功返回 data.authenticated=true |
| POST | /api/logout        | 清除本站 Cookie，不注销学校会话                |
| GET  | /api/account       | 账户总览                                       |
| GET  | /api/months        | 可用月份及 ID                                  |
| GET  | /api/usage/monthly | 可选 monthId，截至该月的六个月                 |
| GET  | /api/usage/daily   | 可选 monthId                                   |
| GET  | /api/usage/hourly  | 可选 date，结束日及此前两天的 72 小时          |
| GET  | /api/payments      | 可选 from、to，须同时提供                      |
| GET  | /api/subsidies     | 可选 from、to，须同时提供                      |

日期必须是真实的 YYYY-MM-DD。查询响应保持 `{data,meta:{source,fetchedAt,query}}`。错误为 `{error:{code,message,details?}}`：参数错误 400、缺失或过期会话 401、学校连接或解析失败 502。API 响应均不缓存。

## 部署

Node：`npm ci && npm run build:web && npm start`。

Docker：`docker compose up --build -d`，默认暴露 3000 端口，登录由每位用户在页面完成。

Vercel：导入仓库，**Root Directory 使用仓库根目录**，Framework Preset 选择 Other，Node.js 选择 22.x。根目录 vercel.json 已指定安装命令、Web 构建和静态输出目录，根 api/index.ts 导出函数入口。无需配置账户或会话密钥。项目源码必须上传到 Git 仓库后才能通过 Git 导入。

导入时保留以下配置（仓库内已配置，无需重复覆盖）：

| 项目 | 值 |
| --- | --- |
| Root Directory | 仓库根目录 `.`，不要选 `apps/web` |
| Framework Preset | Other |
| Node.js | 22.x |
| Install Command | `npm ci` |
| Build Command | `npm run build:web` |
| Output Directory | `apps/web/dist/client` |

无需必填环境变量。可选的 `WIC_BASE_URL` 默认是 `http://sd.wic.edu.cn/mobile/`，`WIC_TIMEOUT_MS` 默认是 `15000`，均为服务端变量，不要加 `VITE_` 前缀。Vercel 管理 HTTPS 与监听端口，无需填写 `HOST`、`PORT`、`SSL_CERT`、`SSL_KEY`。

前端静态资源由 CDN 提供，带内容哈希的 `/assets/*` 缓存一年；API 禁止缓存，函数最长执行 60 秒。保持默认上游超时，调高时需同时考虑一次登录可能包含多次上游请求。登录页、文档页、日历和图表按需加载。保留 `/login.html`、`/docs.html` 路径，不要启用 Clean URLs 或把 API 重写到首页。

手动部署后检查：

1. `/`、`/login.html`、`/docs.html` 均能打开，刷新页面无 404。
2. `/api/health` 返回 `{"ok":true}`，未登录访问 `/api/account` 返回 401 JSON。
3. 在 HTTPS 页面登录，查询账户、月份及日期报表，再退出，确认会话失效。

健康检查仅验证函数存活；学校服务是否能从所选 Vercel 区域访问，需部署后实际登录查询验证。本地构建无法证明云端上游连通性。

配置依据：[Vercel 项目配置](https://vercel.com/docs/project-configuration/vercel-json)。本次仅提供并验证本地构建与函数入口，不代表已完成云端部署验证。

可选连接参数见 .env.example。本地 Web 使用 apps/web/.env，CLI 使用 apps/cli/.env；平台部署在平台设置环境变量。HOST、PORT、SSL_CERT、SSL_KEY 仅用于 Node Web 服务。CLI 可用 WIC_SESSION_FILE 改变本地会话位置。

学校同一会话并发报表可能返回异常。本项目在同一进程内按学校地址与会话串行，页面也依次查询；不同账户不互相阻塞。Vercel 多实例之间无全局队列，调用方应避免同一 Cookie 跨实例并发查询。学校返回的 Cookie 如发生轮换，浏览器与 CLI 会更新；外部调用者遇到失效需重新登录。

学校上游仍使用 HTTP；本站 HTTPS 无法消除学校链路的明文传输风险。本站会话 Cookie 为 HttpOnly、SameSite=Lax，HTTPS 时 Secure。退出仅清除当前客户端会话，不撤销其他副本。

## 结构与迁移

- apps/web：React 前端（client）、Express API、Node/Vercel 入口，页面产物位于 dist/client。
- apps/cli：交互登录、命令行适配、本地会话。
- packages/core：登录与 Cookie 请求、查询校验、领域类型及 HTML 解析。
- testing：本地模拟学校服务。
- reference/javbus-api：本地参考，保持原样，不进入构建及 Docker 上下文。

2.0 移除了 WIC_USERNAME、WIC_PASSWORD、WIC_SESSION_COOKIE、WIC_API_TOKEN 和旧变量别名。请使用登录接口/命令重新登录；旧 CLI 会话文件缺少学校地址，也需要重新登录。原 CLI 查询命令及 summary/month/day/hours 别名仍可用，兼容入口为 node wic-energy-cli.mjs。

只读范围不变：不调用支付、改密、开关、绑定或学校注销。

## React 前端

首页、登录页和接口文档均由 React 渲染，保留 `/`、`/login.html`、`/docs.html` 和现有 API。
七类查询使用统一面板，学校请求串行执行。账户以摘要呈现，用电数据以图表和表格呈现；
缴费、月补和月份提供表格，所有查询仍可展开原始 JSON。先查询可用月份后，月/日查询可直接选择月份。

主图表组件采用 [Monocharts](https://github.com/Subhan-code/Monocharts) 的源码接入方式，
位于 `apps/web/client/components/monocharts`，来源、版本和修改说明见该目录 README，保留 MIT 许可。
保留白底、蓝色操作、中文系统字体回退；Outfit 字体随构建自托管。动效尊重减少动态效果设置。
不展示示例用电数据，也不会将缺失值填成零；上游缺失时间标签用原始序号显示。

`npm run build:web` 同时执行服务端、前端类型检查和 Vite 构建。
`npm run test:web` 包含本地模拟学校 API 集成测试和 React 交互测试。
Node、Docker、Vercel 均使用 `apps/web/dist/client` 中的构建产物，部署前必须构建。
