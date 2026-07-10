import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../App";
import rawRows from "../data/waic-raw.json";
import { normalizeEvents } from "../lib/events";
import { encodePlannerState, PLANNER_STORAGE_KEY } from "../lib/share";
import type { PlannerState } from "../lib/types";
import { Planner } from "./Planner";

function installBrowserState() {
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

const restoredState: PlannerState = {
  dates: ["2026-07-17"],
  availability: {
    "2026-07-17": { start: "13:00", end: "18:30" },
  },
  interests: ["大模型与AI基础"],
  identity: "developer",
  goals: ["technical-depth"],
  pace: "relaxed",
  selectedEventIds: [16],
};

describe("30-second planner", () => {
  beforeEach(() => {
    installBrowserState();
    window.history.replaceState(null, "", "/");
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("limits goals, generates a reasoned route, and exposes attention costs", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 2, name: "30 秒生成你的参访路线" }),
    ).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("你的身份"), "developer");
    await user.click(screen.getByRole("checkbox", { name: "技术深度" }));
    await user.click(screen.getByRole("checkbox", { name: "产业洞察" }));
    await user.click(screen.getByRole("checkbox", { name: "投资机会" }));
    expect(screen.getByText("最多选择 2 个目标")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "投资机会" })).not.toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: "大模型与AI基础" }));
    await user.click(screen.getByRole("checkbox", { name: "7月18日" }));
    await user.click(screen.getByRole("radio", { name: "每日 2 场" }));
    await user.click(screen.getByRole("button", { name: "生成我的路线" }));

    expect(await screen.findByText("路线已生成")).toBeInTheDocument();
    const budget = screen.getByRole("region", { name: "路线注意力预算" });
    expect(within(budget).getByText("活动场数")).toBeInTheDocument();
    expect(within(budget).getByText("有效内容小时")).toBeInTheDocument();
    expect(within(budget).getByText("目标覆盖")).toBeInTheDocument();
    expect(within(budget).getByText("主题数")).toBeInTheDocument();
    expect(within(budget).getByText("换馆次数")).toBeInTheDocument();
    expect(within(budget).getByText("建议缓冲")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 3, name: "高相关但未进入路线" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/时间冲突|换馆缓冲不足|活动上限/u).length).toBeGreaterThan(0);
    expect(screen.queryByText(/总分/u)).not.toBeInTheDocument();
  });

  it("keeps the inputs and suggests what to loosen when no route is possible", async () => {
    const user = userEvent.setup();
    render(<App />);

    const date = screen.getByRole("checkbox", { name: "7月20日" });
    await user.click(date);
    await user.click(screen.getByRole("button", { name: "生成我的路线" }));

    expect(await screen.findByText("没有找到可行路线")).toBeInTheDocument();
    expect(
      screen.getByText("请放宽日期、可用时段或兴趣类别后重试。"),
    ).toBeInTheDocument();
    expect(date).toBeChecked();
  });

  it("restores manual selections, persists removal, copies a share link, and downloads ICS", async () => {
    window.history.replaceState(
      null,
      "",
      `/?${encodePlannerState(restoredState)}`,
    );
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const createObjectURL = vi.fn().mockReturnValue("blob:waic-route");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<App />);

    expect(screen.getByText("已手动加入 1 场")).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: "手动加入的活动" }),
      ).getByText(/从一次性Agent到记忆原生智能时代论坛/u),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "分享路线" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("plan="));
    expect(screen.getByText("链接已复制")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "下载 ICS" }));
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:waic-route");

    await user.click(
      screen.getByRole("button", {
        name: /从路线移除：从一次性Agent到记忆原生智能时代论坛/u,
      }),
    );

    await waitFor(() => {
      const saved = JSON.parse(
        window.localStorage.getItem(PLANNER_STORAGE_KEY) ?? "null",
      ) as PlannerState;
      expect(saved.selectedEventIds).toEqual([]);
      const decoded = JSON.parse(
        new URLSearchParams(window.location.search).get("plan") ?? "null",
      ) as PlannerState;
      expect(decoded.selectedEventIds).toEqual([]);
    });
  });

  it("prefers native sharing when it is available", async () => {
    window.history.replaceState(
      null,
      "",
      `/?${encodePlannerState(restoredState)}`,
    );
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "分享路线" }));
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining("plan=") }),
    );
    expect(writeText).not.toHaveBeenCalled();
  });

  it("keeps the last valid URL while availability is temporarily invalid and lets Planner report it", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("checkbox", { name: "7月18日" }));
    await waitFor(() =>
      expect(window.location.search).toContain(encodeURIComponent("09:00")),
    );
    const lastValidSearch = window.location.search;

    fireEvent.change(screen.getByLabelText("7月18日开始时间"), {
      target: { value: "18:00" },
    });
    expect(
      screen.getByRole("heading", { name: "30 秒生成你的参访路线" }),
    ).toBeInTheDocument();
    expect(window.location.search).toBe(lastValidSearch);

    await user.click(screen.getByRole("button", { name: "生成我的路线" }));
    expect(within(screen.getByRole("alert")).getByText("路线计算失败")).toBeInTheDocument();
    const saved = JSON.parse(
      window.localStorage.getItem(PLANNER_STORAGE_KEY) ?? "null",
    ) as PlannerState;
    expect(saved.availability["2026-07-18"]?.start).toBe("09:00");

    fireEvent.change(screen.getByLabelText("7月18日结束时间"), {
      target: { value: "19:00" },
    });
    await waitFor(() => expect(window.location.search).not.toBe(lastValidSearch));
  });

  it("states that no rejected candidate exists instead of inventing one", async () => {
    const event = normalizeEvents(rawRows)[0];
    const state: PlannerState = {
      dates: ["2026-07-17"],
      availability: {
        "2026-07-17": { start: "13:00", end: "18:00" },
      },
      interests: [event.category],
      identity: null,
      goals: [],
      pace: "relaxed",
      selectedEventIds: [],
    };
    const user = userEvent.setup();
    render(
      <Planner
        events={[event]}
        state={state}
        onStateChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "生成我的路线" }));
    expect(screen.getByText("当前路线没有额外的高相关冲突项。")).toBeInTheDocument();
  });
});
