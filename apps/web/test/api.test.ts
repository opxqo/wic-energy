import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createApp } from "../src/app.js";
import { school, listen, close } from "../../../testing/school.js";
test("web login, isolation, cold app, cookies, bearer precedence, logout and errors", async (t) => {
  const mock = await school(t);
  const app = await listen(createApp(mock.options));
  t.after(() => close(app.server));
  const request = (path: string, init?: RequestInit) =>
    fetch(app.url + path, init);
  assert.equal((await request("/api/health")).status, 200);
  const openApiRes = await request("/api/openapi.json");
  assert.equal(openApiRes.status, 200);
  assert.equal((await openApiRes.json()).openapi, "3.0.3");
  for (const page of ["/", "/login.html", "/docs.html"]) {
    const response = await request(page);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /id="root"/);
    const script = /<script[^>]+src="([^"]+)"/.exec(html)?.[1];
    assert.ok(script, "React page must load its built module");
    const asset = await request(script);
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get("content-type")!, /javascript/);
  }
  assert.equal((await request("/app.js")).status, 404);
  assert.equal((await request("/api/account")).status, 401);
  const login = await request("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "alice", password: "correct" }),
  });
  assert.equal(login.status, 200);
  assert.equal(login.headers.get("cache-control"), "no-store");
  const token = (await login.json()).data.cookie;
  assert.equal(token, "JSESSIONID=alice");
  const setCookie = login.headers.get("set-cookie")!;
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Lax/);
  const cookie = setCookie.split(";")[0]!;
  const account = await request("/api/account", { headers: { cookie } });
  assert.equal((await account.json()).data.basicBalance, 10);
  const rewrittenAccount = await request("/api/account?path=account", {
    headers: { cookie },
  });
  assert.equal(rewrittenAccount.status, 200);
  assert.equal((await rewrittenAccount.json()).data.basicBalance, 10);
  // Test Vercel repeating wildcard parameter (?path=account or ?path=usage&path=monthly)
  const arrayRewrittenAccount = await request(
    "/api/account?path=account&path=account",
    { headers: { cookie } },
  );
  assert.equal(arrayRewrittenAccount.status, 200);
  assert.equal((await arrayRewrittenAccount.json()).data.basicBalance, 10);
  const rewrittenMonthly = await request(
    "/api/usage/monthly?path=usage&path=monthly&monthId=1",
    { headers: { cookie } },
  );
  assert.equal(rewrittenMonthly.status, 200);
  const overview = await request("/api/usage/overview", {
    headers: { cookie },
  });
  assert.equal(overview.status, 200);
  assert.equal((await overview.json()).data.months.length, 1);
  assert.equal(
    (await request("/api/account?path=months", { headers: { cookie } })).status,
    400,
  );
  assert.equal(
    (await request("/api/user", { headers: { cookie } })).status,
    200,
  );
  const bob = await request("/api/account", {
    headers: { cookie, Authorization: "Bearer JSESSIONID=bob" },
  });
  assert.equal((await bob.json()).data.basicBalance, 20);
  for (const Authorization of [
    "bad",
    "Bearer JSESSIONID=expired",
    "Bearer JSESSIONID=unknown",
  ]) {
    const denied = await request("/api/account", {
      headers: { cookie, Authorization },
    });
    assert.equal(denied.status, 401);
    assert.equal(denied.headers.get("cache-control"), "no-store");
    assert.equal(denied.headers.get("set-cookie"), null);
  }
  const fresh = await listen(createApp(mock.options));
  t.after(() => close(fresh.server));
  assert.equal(
    (
      await fetch(fresh.url + "/api/account", {
        headers: { Authorization: "Bearer " + token },
      })
    ).status,
    200,
  );
  for (const path of [
    "/api/usage/hourly?date=2026-02-30",
    "/api/payments?from=2026-01-01",
    "/api/usage/monthly?monthId=0",
    "/api/account?unexpected=1",
  ]) {
    assert.equal((await request(path, { headers: { cookie } })).status, 400);
  }
  const bad = await request("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"username":"alice","password":"bad"}',
  });
  assert.equal(bad.status, 401);
  const secure = await request("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-Proto": "https",
    },
    body: '{"username":"alice","password":"correct"}',
  });
  assert.match(secure.headers.get("set-cookie")!, /Secure/);
  const logout = await request("/api/logout", {
    method: "POST",
    headers: { cookie },
  });
  assert.match(logout.headers.get("set-cookie")!, /Expires=Thu, 01 Jan 1970/);
  assert.equal(
    mock.calls.some((c) => c.path.includes("logout")),
    false,
  );
  assert.equal(
    (
      await request("/api/account", {
        headers: { Authorization: "Bearer " + token },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/logout", {
        method: "POST",
        headers: { Origin: "https://other.example" },
      })
    ).status,
    403,
  );
});
test("vercel entry and deployment paths are present", async () => {
  const config = JSON.parse(
    await readFile(new URL("../../../vercel.json", import.meta.url), "utf8"),
  );
  assert.equal(config.outputDirectory, "apps/web/dist/client");
  assert.equal(config.buildCommand, "npm run build:web");
  assert.equal(
    typeof (await import("../../../api/index.js")).default,
    "function",
  );
});
