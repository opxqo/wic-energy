# WIC Energy · 宿电

把学校能源管理页面转换为只读 JSON API。Web 和 CLI 独立运行，共享学校登录、查询与解析核心。无需预设任何账户密码。

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

修改共享核心后重新运行对应开发命令；Web 页面无需打包，刷新即可。三个 workspace 各有独立 package.json、tsconfig 和测试目录。

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

Vercel：导入仓库，**Root Directory 使用仓库根目录**，Framework Preset 选择 Other，Node.js 选择 22.x。根目录 vercel.json 已指定安装命令、Web 构建和静态输出目录，根 api/index.ts 导出函数入口。无需配置账户或会话密钥。项目源码必须上传到 Git 仓库后才能通过 Git 导入；当前本地目录尚未初始化 Git。

配置依据：[Vercel 项目配置](https://vercel.com/docs/project-configuration/vercel-json)。本次仅提供并验证本地构建与函数入口，不代表已完成云端部署验证。

可选连接参数见 .env.example。本地 Web 使用 apps/web/.env，CLI 使用 apps/cli/.env；平台部署在平台设置环境变量。HOST、PORT、SSL_CERT、SSL_KEY 仅用于 Node Web 服务。CLI 可用 WIC_SESSION_FILE 改变本地会话位置。

学校同一会话并发报表可能返回异常。本项目在同一进程内按学校地址与会话串行，页面也依次查询；不同账户不互相阻塞。Vercel 多实例之间无全局队列，调用方应避免同一 Cookie 跨实例并发查询。学校返回的 Cookie 如发生轮换，浏览器与 CLI 会更新；外部调用者遇到失效需重新登录。

学校上游仍使用 HTTP；本站 HTTPS 无法消除学校链路的明文传输风险。本站会话 Cookie 为 HttpOnly、SameSite=Lax，HTTPS 时 Secure。退出仅清除当前客户端会话，不撤销其他副本。

## 结构与迁移

- apps/web：静态页面、Express API、Node/Vercel 入口。
- apps/cli：交互登录、命令行适配、本地会话。
- packages/core：登录与 Cookie 请求、查询校验、领域类型及 HTML 解析。
- testing：本地模拟学校服务。
- reference/javbus-api：本地参考，保持原样，不进入构建及 Docker 上下文。

2.0 移除了 WIC_USERNAME、WIC_PASSWORD、WIC_SESSION_COOKIE、WIC_API_TOKEN 和旧变量别名。请使用登录接口/命令重新登录；旧 CLI 会话文件缺少学校地址，也需要重新登录。原 CLI 查询命令及 summary/month/day/hours 别名仍可用，兼容入口为 node wic-energy-cli.mjs。

只读范围不变：不调用支付、改密、开关、绑定或学校注销。
