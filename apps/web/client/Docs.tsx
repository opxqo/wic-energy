export function Docs() {
  return (
    <main className="container docs">
      <h1 className="title">接口文档</h1>
      <p className="subtitle">WIC Energy</p>
      <p>
        <a href="/">回到首页</a>
      </p>
      <h2 className="section-title">登录</h2>
      <p>POST /api/login，JSON 请求体：</p>
      <pre className="result">
        {'{"username":"学校账号","password":"密码"}'}
      </pre>
      <p>成功响应：</p>
      <pre className="result">
        {'{"data":{"cookie":"JSESSIONID=学校返回的会话值"}}'}
      </pre>
      <p>浏览器自动使用 HttpOnly Cookie。外部客户端在后续请求中附加：</p>
      <pre className="result">
        {"Authorization: Bearer JSESSIONID=学校返回的会话值"}
      </pre>
      <h2 className="section-title">查询</h2>
      <pre className="result">
        {
          "GET /api/account\nGET /api/months\nGET /api/usage/monthly?monthId=1\nGET /api/usage/daily?monthId=1\nGET /api/usage/hourly?date=2026-09-11\nGET /api/payments?from=2026-01-01&to=2026-09-11\nGET /api/subsidies?from=2026-01-01&to=2026-09-11"
        }
      </pre>
      <p>
        monthId 来自月份接口；月用电返回截至该月的六个月窗口。日期均为
        YYYY-MM-DD，日期范围同时提供或同时省略。
      </p>
      <p>
        响应格式为 <code>{"{ data, meta: { source, fetchedAt, query } }"}</code>
        。
      </p>
      <h2 className="section-title">会话与错误</h2>
      <p>
        GET /api/user 验证会话；POST /api/logout
        清除浏览器会话，不注销学校会话。GET /api/health 检查服务。
      </p>
      <p>
        401：请重新登录；400：参数错误；502：学校连接或数据解析失败。错误响应包含
        error.code 和 error.message。
      </p>
      <p className="note">
        同一学校会话请依次查询，避免上游报表并发异常。学校连接使用 HTTP，本站
        HTTPS 无法改变学校链路的传输方式。
      </p>
    </main>
  );
}
