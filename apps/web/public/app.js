const $ = (selector) => document.querySelector(selector);
const endpoints = [
  ["账户总览", "/api/account", "余额、电表读数、通道状态与抄表时间。", []],
  [
    "可用月份",
    "/api/months",
    "先查询月份，取得月用电和日用电所需的月份 ID。",
    [],
  ],
  [
    "月用电",
    "/api/usage/monthly",
    "截至选定月份的六个月用电量。",
    [["monthId", "月份 ID", "number"]],
  ],
  [
    "日用电",
    "/api/usage/daily",
    "所选月份每天的用电量。",
    [["monthId", "月份 ID", "number"]],
  ],
  [
    "72 小时用电",
    "/api/usage/hourly",
    "以所选日期为结束日期的 72 小时用电量。",
    [["date", "结束日期", "date"]],
  ],
  [
    "缴费记录",
    "/api/payments",
    "开始与结束日期需同时填写或同时留空。",
    [
      ["from", "开始日期", "date"],
      ["to", "结束日期", "date"],
    ],
  ],
  [
    "月补记录",
    "/api/subsidies",
    "开始与结束日期需同时填写或同时留空。",
    [
      ["from", "开始日期", "date"],
      ["to", "结束日期", "date"],
    ],
  ],
];
let busy = false;
let authenticated = false;
function setSession(value) {
  authenticated = value;
  $("#session-status").textContent = value ? "学校账户已登录" : "尚未登录";
  $("#login").hidden = value;
  $("#logout").hidden = !value;
}
function showError(message) {
  $("#error").textContent = message;
  $("#error").hidden = false;
}
async function request(path, options) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
  });
  const body = await response.json();
  if (!response.ok) {
    if (response.status === 401) setSession(false);
    throw new Error(body.error?.message ?? "请求失败，请稍后重试");
  }
  return body;
}
function lock(value) {
  busy = value;
  document.querySelectorAll(".controls button, #logout").forEach((button) => {
    button.disabled = value;
  });
}
for (const [name, path, description, fields] of endpoints) {
  const section = document.createElement("section");
  section.className = "endpoint";
  const header = document.createElement("header");
  const title = document.createElement("h3");
  title.textContent = name;
  const code = document.createElement("code");
  code.textContent = "GET " + path;
  header.append(title, code);
  const note = document.createElement("p");
  note.textContent = description;
  const form = document.createElement("form");
  form.className = "controls";
  for (const [key, label, type] of fields) {
    const wrapper = document.createElement("label");
    wrapper.textContent = label;
    const input = document.createElement("input");
    input.name = key;
    input.type = type;
    if (type === "number") {
      input.min = "1";
      input.step = "1";
      input.placeholder = "例如 1";
    }
    wrapper.append(input);
    form.append(wrapper);
  }
  const button = document.createElement("button");
  button.textContent = "查询";
  form.append(button);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    if (!authenticated) {
      showError("请先登录学校账户，再进行查询。");
      $("#login").focus();
      return;
    }
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form))
      if (String(value).trim()) params.set(key, String(value));
    if (params.has("from") !== params.has("to")) {
      showError("请同时填写开始与结束日期。");
      return;
    }
    if (params.has("from") && params.get("from") > params.get("to")) {
      showError("开始日期不能晚于结束日期。");
      return;
    }
    lock(true);
    $("#error").hidden = true;
    $("#result").textContent = "正在查询…";
    $("#request-status").textContent = "正在查询" + name + "…";
    try {
      const data = await request(path + (params.size ? "?" + params : ""));
      $("#result").textContent = JSON.stringify(data, null, 2);
      $("#request-status").textContent = name + " · 查询完成";
    } catch (error) {
      showError(error.message);
      $("#result").textContent = "本次查询未成功";
      $("#request-status").textContent = "查询失败";
    } finally {
      lock(false);
    }
  });
  section.append(header, note, form);
  $("#endpoints").append(section);
}
$("#logout").addEventListener("click", async () => {
  if (busy) return;
  lock(true);
  try {
    await request("/api/logout", { method: "POST" });
    setSession(false);
    $("#result").textContent = "尚未查询";
    $("#request-status").textContent = "已退出登录";
    $("#error").hidden = true;
  } catch (error) {
    showError(error.message);
  } finally {
    lock(false);
  }
});
lock(true);
request("/api/user")
  .then(() => setSession(true))
  .catch((error) => {
    setSession(false);
    if (!/登录|会话/.test(error.message)) showError(error.message);
  })
  .finally(() => lock(false));
