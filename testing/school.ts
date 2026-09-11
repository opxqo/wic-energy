import { createServer, type Server, type RequestListener } from "node:http";
import type { TestContext } from "node:test";
export async function listen(handler: RequestListener) {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no address");
  return { server, url: "http://127.0.0.1:" + address.port };
}
export async function close(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
export const loginPage =
  '<input name="j_username"><input name="j_kxiotdata">请输入用户名';
export async function school(context?: TestContext) {
  const active = new Map<string, number>(),
    peak = new Map<string, number>();
  let total = 0,
    totalPeak = 0,
    logins = 0;
  const calls: Array<{ path: string; cookie: string }> = [];
  const fixture = await listen(async (req, res) => {
    const url = new URL(req.url!, "http://school");
    const cookie = req.headers.cookie ?? "";
    calls.push({ path: url.pathname + url.search, cookie });
    if (url.pathname.endsWith("main.action")) {
      if (req.method === "POST") {
        logins++;
        let body = "";
        for await (const chunk of req) body += chunk;
        const fields = new URLSearchParams(body);
        if (fields.get("j_kxiotdata") !== "correct") {
          res.end(loginPage);
          return;
        }
        res.setHeader("Set-Cookie", [
          "OTHER=ignored; Path=/",
          "JSESSIONID=" + fields.get("j_username") + "; Path=/; HttpOnly",
        ]);
        res.end("信息总揽");
        return;
      }
      res.setHeader("Set-Cookie", "JSESSIONID=prelogin; Path=/");
      res.end(loginPage);
      return;
    }
    if (url.pathname.endsWith("fail")) {
      res.statusCode = 503;
      res.end("private upstream html");
      return;
    }
    if (url.pathname.endsWith("slow")) {
      setTimeout(() => res.end("slow"), 250);
      return;
    }
    if (url.pathname.endsWith("oauth") || cookie === "JSESSIONID=expired") {
      res.writeHead(302, { Location: "https://example.com/oauth" });
      res.end();
      return;
    }
    if (!["JSESSIONID=alice", "JSESSIONID=bob"].includes(cookie)) {
      res.end(loginPage);
      return;
    }
    active.set(cookie, (active.get(cookie) ?? 0) + 1);
    peak.set(cookie, Math.max(peak.get(cookie) ?? 0, active.get(cookie)!));
    total++;
    totalPeak = Math.max(totalPeak, total);
    await new Promise((resolve) => setTimeout(resolve, 25));
    if (url.pathname.endsWith("mobile!data.action")) {
      res.end(
        "<table><tr><td>基本账户</td><td>" +
          (cookie.endsWith("alice") ? "10" : "20") +
          "</td><td>电表号</td><td>" +
          cookie.slice(11) +
          "</td></tr></table>",
      );
    } else if (url.pathname.endsWith("yuelist.action"))
      res.end('[{"id":1,"text":"2026年09月"}]');
    else if (/rptjiaofei|rptyuebu/.test(url.pathname))
      res.end(
        "<table><tr><th>金额</th><th>人员</th><th>时间</th></tr><tr><td>50</td><td>管理员</td><td>2026-09-01</td></tr></table>",
      );
    else
      res.end(
        "<script>new Highcharts.Chart({title:{text:'用电'},xAxis:{categories : ['01']},series:[{name:'用电',data : [2]}]})</script>",
      );
    active.set(cookie, active.get(cookie)! - 1);
    total--;
  });
  if (context) context.after(() => close(fixture.server));
  return {
    ...fixture,
    options: { baseUrl: fixture.url + "/mobile/", timeoutMs: 1000 },
    calls,
    peak,
    get totalPeak() {
      return totalPeak;
    },
    get logins() {
      return logins;
    },
  };
}
