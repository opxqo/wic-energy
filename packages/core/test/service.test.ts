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

test("service maps overview query to months and daily series", async () => {
  const upstream: UpstreamPort = {
    async get(route) {
      if (route.includes("yuelist")) {
        return `[{"id":1,"text":"2026年09月"}]`;
      }
      return `<script>new Highcharts.Chart({title:{text:'九月用电'},xAxis:{categories:['01','02']},series:[{name:'日用电',data:[2.5, 3.5]}]})</script>`;
    },
  };
  const service = new EnergyService(upstream);
  const result = await service.query({ kind: "overview" });
  assert.equal(result.months.length, 1);
  assert.equal(result.months[0]?.label, "2026年09月");
  assert.equal(result.months[0]?.totalKwh, 6);
  assert.equal(result.months[0]?.points.length, 2);
});

test("overview fetches all available months by default", async () => {
  const upstream: UpstreamPort = {
    async get(route, params) {
      if (route.includes("yuelist")) {
        return `[
          {"id":1,"text":"2026年01月"},
          {"id":2,"text":"2026年02月"},
          {"id":3,"text":"2026年03月"}
        ]`;
      }
      const monthId = params?.id;
      return `<script>new Highcharts.Chart({title:{text:'${monthId}月'},xAxis:{categories:['01','02']},series:[{name:'日用电',data:[1, 2]}]})</script>`;
    },
  };
  const service = new EnergyService(upstream);
  const result = await service.query({ kind: "overview" });
  assert.equal(result.months.length, 3);
  assert.deepEqual(
    result.months.map((m) => m.label),
    ["2026年01月", "2026年02月", "2026年03月"],
  );
  assert.equal(
    result.months.reduce((acc, m) => acc + m.totalKwh, 0),
    9,
  );
});
