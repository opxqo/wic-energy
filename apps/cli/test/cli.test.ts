import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, stat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { school } from "../../../testing/school.js";
import { runCli } from "../src/cli.js";
test("CLI login saves only scoped cookie, subprocess queries directly, expires and logs out", async (t) => {
  const mock = await school(t);
  const dir = await mkdtemp(path.join(tmpdir(), "wic-cli-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, "session.json");
  const oldBase = process.env.WIC_BASE_URL,
    oldFile = process.env.WIC_SESSION_FILE;
  process.env.WIC_BASE_URL = mock.options.baseUrl;
  process.env.WIC_SESSION_FILE = file;
  t.after(() => {
    if (oldBase === undefined) delete process.env.WIC_BASE_URL;
    else process.env.WIC_BASE_URL = oldBase;
    if (oldFile === undefined) delete process.env.WIC_SESSION_FILE;
    else process.env.WIC_SESSION_FILE = oldFile;
  });
  const prompts: boolean[] = [],
    out: unknown[] = [];
  const io = {
    ask: async (_label: string, hidden = false) => {
      prompts.push(hidden);
      return hidden ? "correct" : "alice";
    },
    print: (value: unknown) => out.push(value),
  };
  await runCli(["login"], io);
  assert.deepEqual(prompts, [false, true]);
  const saved = await readFile(file, "utf8");
  assert.equal(saved.includes("correct"), false);
  assert.equal(saved.includes("password"), false);
  assert.equal((await stat(file)).mode & 0o777, 0o600);
  const subprocess = (args: string[]) =>
    new Promise<{ code: number | null; stdout: string; stderr: string }>(
      (resolve) => {
        const child = spawn(
          process.execPath,
          [
            "--import",
            "tsx",
            new URL("../src/index.ts", import.meta.url).pathname,
            ...args,
          ],
          { env: process.env },
        );
        let stdout = "",
          stderr = "";
        child.stdout.on("data", (v) => (stdout += v));
        child.stderr.on("data", (v) => (stderr += v));
        child.on("close", (code) => resolve({ code, stdout, stderr }));
      },
    );
  const account = await subprocess(["account"]);
  assert.equal(account.code, 0, account.stderr);
  assert.equal(JSON.parse(account.stdout).data.basicBalance, 10);
  const explicit = await subprocess(["account", "--cookie", "JSESSIONID=bob"]);
  assert.equal(JSON.parse(explicit.stdout).data.basicBalance, 20);
  assert.match(await readFile(file, "utf8"), /JSESSIONID=alice/);
  const expired = await subprocess([
    "account",
    "--cookie",
    "JSESSIONID=expired",
  ]);
  assert.equal(expired.code, 1);
  assert.match(expired.stderr, /登录/);
  for (const args of [
    ["monthly", "1", "2"],
    ["hourly", "2026-02-30"],
    ["payments", "--from", "2026-01-01"],
  ])
    await assert.rejects(runCli(args, io));
  await runCli(["logout"], io);
  await assert.rejects(stat(file));
  const missing = await subprocess(["months"]);
  assert.equal(missing.code, 1);
});
