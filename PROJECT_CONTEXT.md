# WIC Energy 当前上下文

当前版本 2.0：npm workspaces，apps/web、apps/cli、packages/core。Web 与 CLI 分别构建，CLI 直接连接学校。

学校登录使用 mobile!main.action 的 j_username、j_kxiotdata 表单，取得 JSESSIONID。Web 的 POST /api/login 返回 data.cookie 并设置本站 HttpOnly Cookie；查询携带本站 Cookie 或 Authorization: Bearer JSESSIONID=...。不使用预配置账户密码、固定 API Token、JWT 或数据库。

学校上游路由和参数见 sd-wic-energy-api-architecture.md；该报告为历史观察。当前接口、命令和部署配置以 README.md 为准。旧迁移文档的预配置账户方案已被替换。

同一进程按学校地址和 JSESSIONID 串行请求；跨 Vercel 实例没有全局串行保障。用户间不共享会话。退出清除客户端 Cookie/CLI 文件，不调用学校注销。

测试使用 testing/school.ts 本地模拟学校；这不等于真实学校联调。真实账号密码和会话不得记录在本文件。
