# sd.wic.edu.cn 手机能源管理 APP：架构与查询接口审计

> 观察时间：2026-09-10（Asia/Shanghai）
> 
> 范围：使用当前 Chrome 已登录会话做只读页面分析；使用 Scrapling 0.4.13 对站点未登录入口、重定向和登录表单做静态验证。账号、房间号、表号、会话值和账务明细均不写入本报告。

## 结论摘要

这是一个传统的 Java Servlet/Action 风格单体 Web 应用，而不是 SPA 或 REST API：

```text
浏览器菜单
  └─ GET /mobile/mobile!xxx.action
       ├─ 服务端渲染 HTML
       ├─ 报表页把数据内嵌到 Highcharts 配置
       └─ 仅月份下拉通过 yuelist.action 返回 JSON
```

`mobile!xxx.action` 的命名、`JSESSIONID` 会话以及表单提交方式很像 Struts 时代的 Action 映射，但仅凭黑盒页面不能确认具体框架版本。当前前端混用了 WeUI、jQuery 2.1.4、FastClick、jQuery EasyUI、My97DatePicker 和 Highcharts 4.2.4。

## 已确认的查询接口

基准地址：`http://sd.wic.edu.cn/mobile/`

| 接口 | 方法 | 参数 | 返回形态 | 说明 |
|---|---|---|---|---|
| `mobile!main.action` | GET | 无 | 登录页或已登录首页 HTML | 首页显示房间摘要、余额和查询菜单；未登录 GET 仍返回登录表单 |
| `mobile!data.action` | GET | 无 | HTML | 信息总揽：余额、电表读数、通信状态、通道状态、电表号、抄表时间 |
| `mobile!yuelist.action` | GET | 无 | JSON 数组 | 月份下拉字典；每项为 `{id, text}` |
| `mobile!rptmonth.action` | GET | `id={monthId}` | HTML + Highcharts | 月用电量；以月份 ID 为结束月，展示连续 6 个月 |
| `mobile!rptdata.action` | GET | `id={monthId}` | HTML + Highcharts | 选中月份的每日用电量 |
| `mobile!rpt72.action` | GET | `id={yyyy-MM-dd}` | HTML + Highcharts | 以 `id` 为结束日期，返回连续 72 个小时点；无 `id` 时页面默认使用当前日期 |
| `mobile!rptjiaofei.action` | GET | `shs={startDate}&gy={endDate}` | HTML 表格 | 缴费/存款记录，日期格式 `yyyy-MM-dd` |
| `mobile!rptyuebu.action` | GET | `shs={startDate}&gy={endDate}` | HTML 表格 | 月补记录，日期格式 `yyyy-MM-dd` |

### 1. 月份字典

页面通过 jQuery EasyUI 的 combobox 配置加载：

```text
GET /mobile/mobile!yuelist.action
```

观察到的响应是 JSON 数组，例如：

```json
[
  {"id":"", "text":""},
  {"id":9, "text":"2026年01月"},
  {"id":8, "text":"2026年02月"},
  {"id":1, "text":"2026年09月"}
]
```

`id` 是后续月报、日报接口使用的选择值，不应把年份月份字符串直接当成 `id`。当前会话中已验证：`id=1` 对应 2026 年 09 月，`id=2` 对应 2026 年 08 月。

### 2. 月用电量

```text
GET /mobile/mobile!rptmonth.action?id={monthId}
```

响应不是 JSON。服务端把以下内容直接写入 HTML 内联脚本：

```javascript
xAxis: { categories: ['04月', '05月', '06月', '07月', '08月', '09月'] }
series: [{ name: '月用电量', data: [/* numeric values */] }]
```

已验证 `id=1` 返回最近 6 个月窗口，`id=2` 返回前移一个月的 6 个月窗口。因此，月报的 `id` 语义是“选中/结束月份”，不是单个月份查询。

### 3. 日用电量

```text
GET /mobile/mobile!rptdata.action?id={monthId}
```

同样返回 HTML + 内联 Highcharts 配置；`id=1` 的标题为选中月份的日用电曲线，`id=2` 切换到上一月份。日期类别和每日数值均在 HTML 内嵌，不需要再调用一个图表 JSON 接口。

### 4. 72 小时用电

```text
GET /mobile/mobile!rpt72.action?id=2026-09-09
```

页面脚本使用日期选择器的新日期构造 `?id=yyyy-MM-dd`。实测 `id=2026-09-09` 后，页面标题范围为 `2026-09-07` 到 `2026-09-09`，并包含 72 个小时数据点；页面无 `id` 时默认展示当前日期结束的 72 小时窗口。

### 5. 缴费查询

```text
GET /mobile/mobile!rptjiaofei.action?shs=2026-05-15&gy=2026-09-10
```

页面脚本明确将开始日期 `YRKS` 映射到 `shs`，结束日期 `YRSJ` 映射到 `gy`。响应是服务端渲染的 HTML 表格，列名为金额、存款人、存款时间等；未发现分页或独立 JSON 数据源。

### 6. 月补查询

```text
GET /mobile/mobile!rptyuebu.action?shs=2026-04-01&gy=2026-09-10
```

参数和缴费查询相同，返回服务端渲染的月补金额、月补人员、月补时间表格。

## 鉴权与请求链路

Scrapling 未携带登录态请求受保护页面时观察到：

1. 受保护的 `data.action`、报表和 `yuelist.action` 返回 `302`，`Location: /mobile/mobile!login.action`，同时下发 `JSESSIONID`。
2. `login.action` 再返回 `302` 到微信 OAuth：`open.weixin.qq.com/connect/oauth2/authorize`，使用 `scope=snsapi_base`，回调为站点的 `mobile!login.action`。
3. `main.action` 本身返回登录表单，表单 `POST` 到 `mobile!main.action`，字段名为 `j_username` 和 `j_kxiotdata`。

因此，这个站点至少存在“站内账号密码表单”和“微信 OAuth 回调”两条登录入口；当前分析没有提交密码、验证码或 OAuth 授权。

## 页面之外发现的非查询动作

以下动作已从当前已授权页面的 HTML/内联脚本中发现，但本次没有调用：

| 动作 | 方法/参数线索 | 风险或用途 |
|---|---|---|
| `mobile!changepass.action` | POST：`j_username`、`j_kxiotdata`、`xin_password` | 修改密码，未提交 |
| `mobile!logout.action` | GET | 注销会话，未调用 |
| `mobile!jiechu.action` / `mobile!shoudong.action` | AJAX JSON，含房间内部键 | 照明开关控制，写操作，未调用 |
| `mobile!jiechu2.action` / `mobile!shoudong2.action` | AJAX JSON，含房间内部键 | 空调开关控制，写操作，未调用 |
| `mobile!bangding.action` | AJAX JSON | 更换绑定用户，未调用 |
| `mobile!mzfbfind.action` | GET，页面脚本给出 `id`、`dtd` | 支付宝充值页，不是查询接口；只读打开确认了其表单存在 |
| `mobile!pay2.action` | POST：订单号、用户名、金额等 | 支付提交，未提交 |
| `mobile!pay1.action` | GET 后进入微信 OAuth | 微信支付入口；未穿过 OAuth 页面 |

## 安全与工程观察

- 全部当前入口使用 `http://`；Scrapling 观察到的 OAuth 回调也是 HTTP。密码、会话和账务数据存在明文传输风险。
- 未登录响应的 `Set-Cookie` 仅观察到 `Path=/; HttpOnly`，没有看到 `Secure` 或 `SameSite` 属性；应迁移 HTTPS，并设置 `Secure; HttpOnly; SameSite=Lax/Strict`。
- 登录页和改密页将密码字段声明为 `type="text"`，包括登录口令和新密码，存在屏幕暴露、浏览器自动填充和肩窥风险。
- 开关、绑定、登出等具有副作用的动作使用 GET 或未显式指定 method 的 jQuery AJAX；建议改为 POST/PUT，并增加 CSRF 防护、幂等校验和服务端审计。
- 报表参数是可见的 `id`、日期和房间内部键。本次只验证了当前登录房间自己的参数，没有尝试跨房间 IDOR、越权或篡改测试。
- 图表数据直接内嵌 HTML，优点是前端简单、请求少；缺点是难以复用、缓存粒度粗、数据结构没有稳定 API 契约，也容易因 HTML 模板改变而破坏客户端采集。

## 只读 Scrapling 复现骨架

下面只包含 GET 请求，不包含登录、支付、改密、开关或绑定动作。需要把当前会话的 Cookie 以环境变量方式提供，不要把真实 Cookie 写入代码、Git 或日志：

```python
import json
import os
from urllib.parse import urlencode

from scrapling.fetchers import Fetcher

BASE = "http://sd.wic.edu.cn/mobile/"
COOKIE = os.environ["SD_WIC_COOKIE"]  # 例如 JSESSIONID=...；不要提交或打印

def get(path, params=None):
    url = BASE + path
    if params:
        url += "?" + urlencode(params)
    return Fetcher.get(
        url,
        headers={"Cookie": COOKIE, "Accept": "text/html,application/json"},
        follow_redirects=False,
        timeout=20,
    )

month_list = get("mobile!yuelist.action")
print(month_list.status, month_list.text[:500])

month_report = get("mobile!rptmonth.action", {"id": 1})
print(month_report.status, month_report.css("title::text").get())
print("Highcharts series:", "series:[" in month_report.text)

daily = get("mobile!rptdata.action", {"id": 1})
hourly = get("mobile!rpt72.action", {"id": "2026-09-09"})
payments = get("mobile!rptjiaofei.action", {"shs": "2026-05-15", "gy": "2026-09-10"})
subsidy = get("mobile!rptyuebu.action", {"shs": "2026-04-01", "gy": "2026-09-10"})
```

## 未确认项

- 后端具体容器、Action 框架版本、数据库和内部 RPC/电表服务未暴露在页面中，不能仅凭黑盒请求确认。
- 未执行登录 POST，也没有读取或复制浏览器会话 Cookie，因此没有在 Scrapling 中复放真实账号会话；已授权页面本身通过浏览器只读验证。
- `pay1.action` 的后续 OAuth 页面受浏览器安全策略拦截，本次不需要它来确定查询接口，因此没有绕过该拦截。
