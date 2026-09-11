import assert from "node:assert/strict";
import test from "node:test";

import { EnergyService } from "../src/service.js";
import type { UpstreamPort } from "../src/types.js";

test("service owns upstream route mapping and parsing", async () => {
  const calls: Array<{
    route: string;
    params?: Record<string, string | number | undefined>;
  }> = [];
  const upstream: UpstreamPort = {
    async get(route, params) {
      calls.push({ route, params });
      return `<script>new Highcharts.Chart({title:{text:'72小时'},xAxis:{categories:['10:00']},series:[{name:'小时用电',data:[0.5]}]})</script>`;
    },
  };
  const service = new EnergyService(upstream);
  const result = await service.query({ kind: "hourly", date: "2026-09-11" });
  assert.deepEqual(calls, [
    { route: "mobile!rpt72.action", params: { id: "2026-09-11" } },
  ]);
  assert.equal(result.points[0]?.value, 0.5);
});
