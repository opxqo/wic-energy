import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { school, listen, close } from "./school.js";
import { createApp } from "../apps/web/src/app.js";
// Optional browser tooling, independent from the application dependency tree.
const { chromium } = await import(
  process.env.WIC_PLAYWRIGHT_MODULE ?? "playwright"
);
const mock = await school();
const app = await listen(createApp(mock.options));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1100, height: 900 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error: Error) => errors.push(error.message));
  await page.goto(app.url);
  await page.locator("#login").waitFor({ state: "visible" });
  assert.equal(await page.locator(".endpoint").count(), 7);
  await page.locator("#login").click();
  await page.locator("#username").fill("alice");
  await page.locator("#password").fill("wrong");
  await page.locator("#submit").click();
  await page.locator("#message").waitFor({ state: "visible" });
  assert.equal(await page.locator("#password").inputValue(), "");
  await page.locator("#password").fill("correct");
  await page.locator("#submit").click();
  await page.waitForURL(app.url + "/");
  await page.locator("#logout").waitFor({ state: "visible" });
  const cookies = await context.cookies();
  assert.equal(
    cookies.find((c: { name: string }) => c.name === "wic_energy_session")
      ?.httpOnly,
    true,
  );
  assert.equal(
    await page.evaluate(() => document.cookie.includes("wic_energy_session")),
    false,
  );
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  for (let i = 0; i < 7; i++) {
    await page
      .locator(".endpoint")
      .nth(i)
      .getByRole("button", { name: "查询", exact: true })
      .click();
    await page.waitForFunction(() =>
      document
        .querySelector("#request-status")
        ?.textContent?.includes("查询完成"),
    );
    assert.equal(await page.locator("#error").isVisible(), false);
  }
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/web-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({ path: "artifacts/web-mobile.png", fullPage: true });
  await context.addCookies([
    {
      name: "wic_energy_session",
      value: encodeURIComponent("JSESSIONID=expired"),
      url: app.url,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page
    .locator(".endpoint")
    .first()
    .getByRole("button", { name: "查询", exact: true })
    .click();
  await page.locator("#login").waitFor({ state: "visible" });
  assert.equal(await page.locator("#error").isVisible(), true);
  await page.locator("#login").click();
  await page.locator("#username").fill("alice");
  await page.locator("#password").fill("correct");
  await page.locator("#submit").click();
  await page.waitForURL(app.url + "/");
  await page.locator("#logout").click();
  await page.locator("#login").waitFor({ state: "visible" });
  assert.equal(
    (await context.cookies()).some(
      (c: { name: string }) => c.name === "wic_energy_session",
    ),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Browser PASS: login errors, 7 queries, HttpOnly, mobile overflow, expired session, logout; screenshots in artifacts/",
  );
} finally {
  await browser?.close();
  await close(app.server);
  await close(mock.server);
}
