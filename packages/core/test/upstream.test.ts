import assert from "node:assert/strict";
import test from "node:test";
import { school } from "../../../testing/school.js";
import {
  SchoolSession,
  EnergyService,
  AuthenticationError,
  UpstreamError,
  validateQuery,
} from "../src/index.js";
test("school login returns JSESSIONID only; passwords are not retained and queries never relogin", async (t) => {
  const mock = await school(t);
  const session = await SchoolSession.login(mock.options, "alice", "correct");
  assert.equal(session.sessionCookie, "JSESSIONID=alice");
  assert.equal(JSON.stringify(session).includes("correct"), false);
  assert.equal(
    (await new EnergyService(session).query({ kind: "account" })).basicBalance,
    10,
  );
  await assert.rejects(
    SchoolSession.login(mock.options, "alice", "wrong"),
    AuthenticationError,
  );
  await assert.rejects(
    new SchoolSession(mock.options, "JSESSIONID=expired").get(
      "mobile!data.action",
    ),
    AuthenticationError,
  );
  await assert.rejects(
    new SchoolSession(mock.options, "JSESSIONID=unknown").get(
      "mobile!data.action",
    ),
    AuthenticationError,
  );
  assert.equal(mock.logins, 2);
});
test("upstream errors, OAuth and timeouts have normalized failures", async (t) => {
  const mock = await school(t);
  const session = new SchoolSession(
    { ...mock.options, timeoutMs: 100 },
    "JSESSIONID=alice",
  );
  await assert.rejects(session.get("oauth"), AuthenticationError);
  await assert.rejects(
    session.get("fail"),
    (e) => e instanceof UpstreamError && !e.message.includes("private"),
  );
  await assert.rejects(
    session.get("slow"),
    (e) => e instanceof UpstreamError && e.message.includes("超时"),
  );
});
test("same cookie serializes across instances, distinct cookies can overlap", async (t) => {
  const mock = await school(t);
  await Promise.all(
    Array.from({ length: 6 }, () =>
      new SchoolSession(mock.options, "JSESSIONID=alice").get(
        "mobile!data.action",
      ),
    ),
  );
  assert.equal(mock.peak.get("JSESSIONID=alice"), 1);
  await Promise.all(
    ["alice", "bob"].map((id) =>
      new SchoolSession(mock.options, "JSESSIONID=" + id).get(
        "mobile!data.action",
      ),
    ),
  );
  assert.equal(mock.totalPeak, 2);
});
test("all seven queries and calendar validation", async (t) => {
  const mock = await school(t),
    service = new EnergyService(
      new SchoolSession(mock.options, "JSESSIONID=alice"),
    );
  for (const kind of [
    "account",
    "months",
    "monthly",
    "daily",
    "hourly",
    "payments",
    "subsidies",
  ] as const)
    assert.ok(await service.query({ kind }));
  assert.throws(() => validateQuery({ kind: "hourly", date: "2026-02-30" }));
  assert.throws(() => validateQuery({ kind: "payments", from: "2026-01-01" }));
  assert.throws(() =>
    validateQuery({ kind: "payments", from: "2026-02-01", to: "2026-01-01" }),
  );
  assert.doesNotThrow(() =>
    validateQuery({ kind: "hourly", date: "2024-02-29" }),
  );
});
