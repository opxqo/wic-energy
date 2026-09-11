# WIC Energy CLI

CLI 直接连接学校，不依赖 Web。Node.js 22+：

```sh
npm ci
npm run build:cli
node wic-energy-cli.mjs login
node wic-energy-cli.mjs account
node wic-energy-cli.mjs months
node wic-energy-cli.mjs monthly 1
node wic-energy-cli.mjs daily 1
node wic-energy-cli.mjs hourly 2026-09-11
node wic-energy-cli.mjs payments 2026-01-01 2026-09-11
node wic-energy-cli.mjs subsidies 2026-01-01 2026-09-11
node wic-energy-cli.mjs logout
```

login 在终端询问账号和隐藏密码。仅保存学校 Cookie、学校地址与保存时间，默认文件 ~/.config/wic-energy/session.json，权限 600。不保存密码，不自动重登。logout 仅删除本地会话文件。

自动化或已有会话：

```sh
node wic-energy-cli.mjs account --cookie 'JSESSIONID=学校会话值'
```

显式 Cookie 优先于本地文件，使用它不会修改文件。请避免把真实 Cookie 写入脚本、日志或版本控制。交互登录需要 TTY。

可通过 WIC_BASE_URL、WIC_TIMEOUT_MS 调整学校连接，通过 WIC_SESSION_FILE 指定会话文件。开发运行：npm run cli -- login。查询输出 JSON，错误写入 stderr 并以非零状态退出。旧 summary/month/day/hours 和 --id/--date/--from/--to/--json 参数仍可用。
