import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../client/App";
import { Login } from "../client/Login";
import { Docs } from "../client/Docs";
import { ResultView } from "../client/components/ResultView";
import type { Result } from "../client/api";

const account = {
  basicBalance: 10,
  subsidyBalance: null,
  totalBalance: 10,
  meterReadingKwh: 0,
  meterNumber: "test-meter",
  readAt: null,
  communicationStatus: null,
  lightingStatus: null,
  airConditioningStatus: null,
};
const envelope = (data: unknown) => ({
  data,
  meta: { source: "school.test", fetchedAt: "2026-09-11T00:00:00Z", query: {} },
});
const response = (body: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
const emptyUsage = {
  title: "用电记录",
  name: "用电量",
  unit: "kWh",
  points: [],
};
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn((path: string) =>
    response(
      path === "/api/user"
        ? { data: { authenticated: true } }
        : path === "/api/months"
          ? envelope([{ id: 6, label: "2026年04月", year: 2026, month: 4 }])
        : path.startsWith("/api/usage/overview")
          ? envelope({ months: [] })
        : path.startsWith("/api/usage/")
          ? envelope(emptyUsage)
        : path.startsWith("/api/payments") || path.startsWith("/api/subsidies")
          ? envelope([])
        : envelope(account),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => {};
  HTMLElement.prototype.releasePointerCapture = () => {};
  HTMLElement.prototype.scrollIntoView = () => {};
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const ready = async () => {
  render(<App />);
  await screen.findByText("学校账户已登录");
  await screen.findByText("test-meter");
};

describe("React query workflow", () => {
  it("provides the animated GitHub project link", async () => {
    await ready();
    const link = screen.getByRole("link", {
      name: "在 GitHub 查看 WIC Energy 项目",
    });
    expect(link.getAttribute("href")).toBe(
      "https://github.com/opxqo/wic-energy",
    );
    expect(link.getAttribute("target")).toBe("_blank");
    await userEvent.hover(link);
    expect(screen.getByText("Star on GitHub")).toBeTruthy();
  });

  it("slides one shared indicator between query filters", async () => {
    await ready();
    expect(screen.getAllByTestId("query-nav-indicator")).toHaveLength(1);
    await userEvent.click(
      screen.getByRole("button", { name: "月用电", exact: true }),
    );
    expect(screen.getAllByTestId("query-nav-indicator")).toHaveLength(1);
    expect(
      screen
        .getByRole("button", { name: "月用电", exact: true })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("requires login and does not send queries while anonymous", async () => {
    fetchMock.mockImplementation(() =>
      response({ error: { message: "请先登录" } }, 401),
    );
    render(<App />);
    await screen.findByText("尚未登录");
    await userEvent.click(
      screen.getByRole("button", { name: "查询", exact: true }),
    );
    expect(screen.getByRole("alert").textContent).toContain("请先登录");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.activeElement?.id).toBe("login");
  });

  it("renders real values, preserves zero and null, and retains raw JSON", async () => {
    await ready();
    await userEvent.click(
      screen.getByRole("button", { name: "查询", exact: true }),
    );
    await screen.findByText("test-meter");
    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByText("查看原始 JSON"));
    expect(screen.getByText(/"basicBalance": 10/)).toBeTruthy();
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      credentials: "same-origin",
    });
  });

  it("serializes queries, disables switching, and clears data when session expires", async () => {
    await ready();
    let finish!: (value: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    const button = screen.getByRole("button", { name: "查询", exact: true });
    fireEvent.submit(button.closest("form")!);
    fireEvent.submit(button.closest("form")!);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(
      (
        screen.getByRole("button", {
          name: "月用电",
          exact: true,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    await waitFor(() => expect(screen.queryByText("test-meter")).toBeNull());
    expect(screen.getByTestId("trailing-dots")).toBeTruthy();
    finish(
      new Response(JSON.stringify({ error: { message: "会话过期" } }), {
        status: 401,
      }),
    );
    await screen.findByText("尚未登录");
    expect(screen.getByRole("alert").textContent).toContain("会话过期");
    expect(screen.queryByText("查看原始 JSON")).toBeNull();
  });

  it("uses pulsating dots loader when loading chart queries", async () => {
    await ready();
    let finish!: (value: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "月用电", exact: true }),
    );
    expect(await screen.findByTestId("pulsating-dots")).toBeTruthy();
    finish(
      response(
        envelope({
          title: "月度用电",
          name: "用电量",
          unit: "kWh",
          points: [],
        }),
      ),
    );
    await screen.findByText("所选时间暂无用电记录。");
  });

  it("rejects incomplete and reversed date ranges before making a request", async () => {
    await ready();
    await userEvent.click(
      screen.getByRole("button", { name: "缴费记录", exact: true }),
    );
    const selectDate = async (label: string, date: string) => {
      await userEvent.click(screen.getByRole("button", { name: label }));
      const day = await waitFor(() => {
        const button = document.querySelector<HTMLButtonElement>(`[data-day="${date}"]`);
        expect(button).not.toBeNull();
        return button!;
      });
      await userEvent.click(day);
    };
    await selectDate("开始日期", "2026/9/11");
    await userEvent.click(
      screen.getByRole("button", { name: "查询", exact: true }),
    );
    expect(screen.getByRole("alert").textContent).toContain("同时填写");
    await selectDate("结束日期", "2026/9/1");
    await userEvent.click(
      screen.getByRole("button", { name: "查询", exact: true }),
    );
    expect(screen.getByRole("alert").textContent).toContain("不能晚于");
    expect(fetchMock).toHaveBeenCalledTimes(4);
    await selectDate("结束日期", "2026/9/12");
    fetchMock.mockImplementationOnce(() => response(envelope([])));
    await userEvent.click(
      screen.getByRole("button", { name: "查询", exact: true }),
    );
    await screen.findByText("所选时间暂无缴费记录。");
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(
      "/api/payments?from=2026-09-11&to=2026-09-12",
    );
  });

  it("uses returned month IDs in usage queries and keeps zero points in the data table", async () => {
    await ready();
    await userEvent.click(
      screen.getByRole("button", { name: "可用月份", exact: true }),
    );
    await screen.findByRole("cell", { name: "2026年04月" });
    await userEvent.click(
      screen.getByRole("button", { name: "日用电", exact: true }),
    );
    await userEvent.click(screen.getByRole("combobox", { name: "月份" }));
    fetchMock.mockImplementationOnce(() =>
      response(
        envelope({
          title: "四月用电",
          name: "日用电量",
          unit: "kWh",
          points: [
            { label: "", value: 0 },
            { label: "2", value: 4.5 },
          ],
        }),
      ),
    );
    await userEvent.click(screen.getByRole("option", { name: "2026年04月" }));
    await screen.findByText("四月用电");
    await userEvent.click(screen.getByText("数据明细 · 2 项"));
    expect(screen.getByRole("cell", { name: "04月01日" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "0", exact: true })).toBeTruthy();
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe("/api/usage/daily?monthId=6");
  });

  it("renders interactive overview chart with daily points and month totals", async () => {
    await ready();
    fetchMock.mockImplementationOnce(() =>
      response(
        envelope({
          months: [
            {
              monthId: 1,
              label: "2026年09月",
              year: 2026,
              month: 9,
              totalKwh: 120.5,
              points: [
                { label: "01", value: 4.5 },
                { label: "02", value: 5.0 },
              ],
            },
          ],
        }),
      ),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "用电总览", exact: true }),
    );
    await screen.findByText(/以日为基本单位连续展示全部数据/);
    expect(screen.getAllByText("120.5").length).toBeGreaterThan(0);
    expect(screen.getByText("全部用电总量")).toBeTruthy();
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe("/api/usage/overview");
  });

  it("clears account results on logout", async () => {
    await ready();
    await screen.findByText("test-meter");
    await userEvent.click(
      screen.getByRole("button", { name: "退出", exact: true }),
    );
    await screen.findByText("尚未登录");
    await waitFor(() => expect(screen.queryByText("test-meter")).toBeNull());
    expect(fetchMock.mock.calls.at(-1)).toEqual([
      "/api/logout",
      { credentials: "same-origin", method: "POST" },
    ]);
  });

  it("renders empty usage without a synthetic chart", async () => {
    render(
      <ResultView
        result={
          {
            kind: "hourly",
            response: envelope({
              title: "小时用电",
              name: "用电",
              unit: "kWh",
              points: [],
            }),
          } as Result
        }
      />,
    );
    await screen.findByText("所选时间暂无用电记录。");
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("automatically refreshes category with default data when switching tabs", async () => {
    await ready();
    fetchMock.mockImplementationOnce(() =>
      response(
        envelope({
          title: "月度用电",
          name: "用电量",
          unit: "kWh",
          points: [{ label: "01", value: 12.3 }],
        }),
      ),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "月用电", exact: true }),
    );
    await screen.findByText("月度用电");
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe("/api/usage/monthly");
  });

  it("formats 72-hour chart points into clear, rational timestamps instead of item numbers", async () => {
    await ready();
    fetchMock.mockImplementationOnce(() =>
      response(
        envelope({
          title: "2026-09-09到2026-09-11",
          name: "72小时用电",
          unit: "kWh",
          points: Array.from({ length: 72 }, (_, i) => ({
            label: i === 12 || i === 36 || i === 60 ? "12" : i === 24 || i === 48 ? "0" : "",
            value: i === 50 ? 0.01 : 0.2,
          })),
        }),
      ),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "72 小时用电", exact: true }),
    );
    await screen.findByText("2026-09-09到2026-09-11");
    await userEvent.click(screen.getByText("数据明细 · 72 项"));
    // Point 0 should be 2026-09-09 00:00
    expect(screen.getByRole("cell", { name: "2026-09-09 00:00" })).toBeTruthy();
    // Point 50 should be 2026-09-11 02:00
    expect(screen.getByRole("cell", { name: "2026-09-11 02:00" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "0.01", exact: true })).toBeTruthy();
  });
});

it("clears a rejected password and keeps credentials out of storage", async () => {
  fetchMock.mockImplementation(() =>
    response({ error: { message: "学校账号或密码错误" } }, 401),
  );
  render(<Login />);
  await userEvent.type(screen.getByLabelText("学校账号"), "test-user");
  await userEvent.type(screen.getByLabelText("密码"), "test-password");
  await userEvent.click(
    screen.getByRole("button", { name: "登录", exact: true }),
  );
  await screen.findByRole("alert");
  expect((screen.getByLabelText("密码") as HTMLInputElement).value).toBe("");
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
});

it("submits the requested demo account from the demo login button", async () => {
  fetchMock.mockImplementation((path: string) =>
    response(
      path === "/api/login"
        ? { error: { message: "演示账号当前不可用" } }
        : { data: { authenticated: false } },
      path === "/api/login" ? 401 : 200,
    ),
  );
  render(<Login />);
  await userEvent.click(
    screen.getByRole("button", { name: "演示账户登录", exact: true }),
  );
  await screen.findByRole("alert");
  const [, init] = fetchMock.mock.calls.find(([path]) => path === "/api/login")!;
  expect(JSON.parse(String(init?.body))).toEqual({
    username: "南1-548",
    password: "cy@123",
  });
});

it("renders shadcn-style documentation with endpoints, codeblocks, and copy feature", async () => {
  render(<Docs />);
  expect(screen.getByText("接口文档与集成指南")).toBeTruthy();
  expect(screen.getAllByText("/api/usage/overview").length).toBeGreaterThan(0);
  expect(screen.getAllByText("项目概述").length).toBeGreaterThan(0);
  expect(screen.getByText("本页目录")).toBeTruthy();
});

it("supports mobile sidebar drawer toggle, item selection, and escape key", async () => {
  await ready();
  const trigger = screen.getByRole("button", {
    name: "打开导航菜单切换栏目",
  });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");

  // Open sidebar
  await userEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByLabelText("查询栏目侧边栏").className).toContain("open");

  // Close via close button
  const closeBtn = screen.getByRole("button", { name: "关闭侧边栏" });
  await userEvent.click(closeBtn);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(screen.getByLabelText("查询栏目侧边栏").className).not.toContain("open");

  // Open again and select an item to switch query and auto-close
  await userEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  await userEvent.click(
    screen.getByRole("button", { name: "月用电", exact: true }),
  );
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(screen.getByLabelText("查询栏目侧边栏").className).not.toContain("open");

  // Open and test Escape key
  await userEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  fireEvent.keyDown(window, { key: "Escape" });
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
});

