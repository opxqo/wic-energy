import assert from "node:assert/strict";
import test from "node:test";

import {
  isLoginPage,
  parseAccountSummary,
  parseMonthOptions,
  parsePaymentRecords,
  parseSubsidyRecords,
  parseUsageSeries,
} from "../src/parser.js";

test("parses account summary table into stable fields", () => {
  const html = `<table>
    <tr><td>基本账户</td><td>31.69 元</td><td>补助账户</td><td>2 元</td></tr>
    <tr><td>总余额</td><td>33.69 元</td><td>电表读数</td><td>123.45 kWh</td></tr>
    <tr><td>电表通讯</td><td>正常</td><td>电表号</td><td>M-001</td></tr>
  </table>`;
  assert.deepEqual(parseAccountSummary(html), {
    basicBalance: 31.69,
    subsidyBalance: 2,
    totalBalance: 33.69,
    meterReadingKwh: 123.45,
    communicationStatus: "正常",
    lightingStatus: null,
    airConditioningStatus: null,
    meterNumber: "M-001",
    readAt: null,
  });
});

test("changed pages fail instead of masquerading as valid account or empty records", () => {
  assert.throws(() =>
    parseAccountSummary("<table><tr><td>提示</td><td>维护中</td></tr></table>"),
  );
  assert.throws(() => parsePaymentRecords("<h1>维护中</h1>"));
  assert.throws(() => parseSubsidyRecords("<h1>维护中</h1>"));
  assert.deepEqual(
    parsePaymentRecords(
      "<table><tr><th>金额</th><th>人员</th><th>时间</th></tr></table>",
    ),
    [],
  );
});

test("parses month dictionary and ignores blank entries", () => {
  const result = parseMonthOptions(
    '[{"id":"","text":""},{"id":1,"text":"2026年09月"}]',
  );
  assert.deepEqual(result, [
    { id: 1, label: "2026年09月", year: 2026, month: 9 },
  ]);
});

test("parses Highcharts data despite formatting whitespace", () => {
  const html = `<script>
    new Highcharts.Chart({
      title: { text: '2026年09月日用电' },
      xAxis: { categories: ['09-01', '09-02'] },
      series : [ { name: '日用电量', data: [1.2, 3.4] } ]
    })
  </script>`;
  assert.deepEqual(parseUsageSeries(html), {
    title: "2026年09月日用电",
    name: "日用电量",
    unit: "kWh",
    points: [
      { label: "09-01", value: 1.2 },
      { label: "09-02", value: 3.4 },
    ],
  });
});

test("parses payment rows and detects login page", () => {
  const html =
    "<table><tr><th>金额</th><th>存款人</th><th>时间</th></tr><tr><td>50 元</td><td>张三</td><td>2026-09-01</td></tr></table>";
  assert.deepEqual(parsePaymentRecords(html), [
    { amount: 50, operator: "张三", paidAt: "2026-09-01" },
  ]);
  assert.equal(
    isLoginPage(
      '<input name="j_username"><input name="j_kxiotdata">请输入用户名',
    ),
    true,
  );
});
