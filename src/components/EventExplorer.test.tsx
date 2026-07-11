import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../App";
import rawRows from "../data/waic-raw.json";
import { normalizeEvents } from "../lib/events";
import { planRoute } from "../lib/planner";
import { encodePlannerState } from "../lib/share";
import type { PlannerState } from "../lib/types";

function plannerStateFromUrl(): PlannerState {
  const encoded = new URLSearchParams(window.location.search).get("plan");
  if (!encoded) throw new Error("planner state is missing from the URL");
  return JSON.parse(encoded) as PlannerState;
}

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

describe("event explorer", () => {
  beforeEach(() => {
    installBrowserState();
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows 24 editorial timeline rows first and progressively reveals more", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 2, name: "在 175 场活动里精确筛选" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /查看活动：/u })).toHaveLength(24);
    expect(screen.getByText("已显示 24/175 场")).toMatchObject({
      tagName: "SMALL",
    });
    expect(screen.getByText("已显示 24/175 场")).toHaveAttribute(
      "aria-live",
      "polite",
    );

    await user.click(screen.getByRole("button", { name: "显示更多活动" }));
    expect(screen.getAllByRole("button", { name: /查看活动：/u })).toHaveLength(48);
    expect(screen.getByText("已显示 48/175 场")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Switch to English" }));
    expect(screen.getByText("Showing 48/175 events")).toBeInTheDocument();
  });

  it("combines bilingual search with date, category, and venue filters", async () => {
    const user = userEvent.setup();
    render(<App />);

    const search = screen.getByLabelText("搜索活动");
    await user.type(search, "MEMORY-NATIVE");
    expect(
      screen.getByRole("button", {
        name: /查看活动：从一次性Agent到记忆原生智能时代论坛/u,
      }),
    ).toBeInTheDocument();

    await user.clear(search);
    await user.selectOptions(screen.getByLabelText("按日期筛选"), "2026-07-17");
    await user.selectOptions(screen.getByLabelText("按类别筛选"), "大模型与AI基础");
    await user.selectOptions(screen.getByLabelText("按场馆筛选"), "expo-exhibition");
    expect(screen.getByText("3 场活动符合当前筛选")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /查看活动：/u })).toHaveLength(3);
  });

  it("does not repeat a single-language title as its own translation", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("搜索活动"), "WAICA - Main Track Session 1");
    await user.click(
      screen.getByRole("button", {
        name: "查看活动：WAICA - Main Track Session 1",
      }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "WAICA - Main Track Session 1",
    });
    expect(within(dialog).getAllByText("WAICA - Main Track Session 1")).toHaveLength(1);
  });

  it("offers an actionable empty state and clears all filters", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("搜索活动"), "not-a-real-waic-session");
    expect(screen.getByText("没有匹配的活动")).toBeInTheDocument();
    expect(screen.getByText("换一个关键词，或清除日期、类别与场馆筛选。"),).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "清除筛选" }));
    expect(screen.getAllByRole("button", { name: /查看活动：/u })).toHaveLength(24);
  });

  it("consumes heatmap, topic, and venue selections as real Explorer filters", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "7月18日 09:30-10:00，30 场活动" }),
    );
    expect(screen.getByText("30 场活动符合当前筛选")).toBeInTheDocument();
    expect(screen.getByLabelText("按日期筛选")).toHaveValue("2026-07-18");
    await user.click(screen.getByRole("button", { name: "关闭活动轮播" }));

    await user.click(screen.getByRole("button", { name: "综合论坛，45 场" }));
    expect(screen.getByText("45 场活动符合当前筛选")).toBeInTheDocument();
    expect(screen.getByLabelText("按类别筛选")).toHaveValue("综合论坛");
    await user.click(screen.getByRole("button", { name: "关闭活动轮播" }));

    await user.click(
      screen.getByRole("button", { name: "世博中心，91 场，示意位置" }),
    );
    expect(screen.getByText("91 场活动符合当前筛选")).toBeInTheDocument();
    expect(screen.getByLabelText("按场馆筛选")).toHaveValue("expo-center");
  });

  it("opens an accessible bilingual detail sheet, toggles the route, and restores focus", async () => {
    const user = userEvent.setup();
    render(<App />);

    const trigger = screen.getByRole("button", {
      name: /查看活动：2026世界人工智能大会暨人工智能全球治理高级别会议主论坛/u,
    });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", {
      name: "2026世界人工智能大会暨人工智能全球治理高级别会议主论坛",
    });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText(
        "2026 WORLD AI CONFERENCE & HIGH-LEVEL MEETING ON GLOBAL AI GOVERNANCE MAIN FORUM",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("世博中心金厅A+B")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "官方注册页" })).toHaveAttribute(
      "href",
      "https://www.worldaic.com.cn/register",
    );
    expect(screen.getByRole("link", { name: "在高德地图搜索" })).toHaveAttribute(
      "href",
      `https://uri.amap.com/search?keyword=${encodeURIComponent("世博中心金厅A+B")}`,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "关闭活动详情" })).toHaveFocus(),
    );

    await user.click(screen.getByRole("button", { name: "加入路线" }));
    const removeButton = screen.getByRole("button", { name: "移出路线" });
    expect(removeButton).toHaveFocus();
    expect(screen.getByText("已手动加入 1 场")).toBeInTheDocument();
    const persistedAfterAdd = await waitFor(() => {
      const state = plannerStateFromUrl();
      expect(state.dates).toContain("2026-07-17");
      expect(state.availability["2026-07-17"]).toEqual({
        start: "13:30",
        end: "17:00",
      });
      return state;
    });
    expect(
      planRoute(normalizeEvents(rawRows), persistedAfterAdd).items.every(
        ({ event }) =>
          event.date !== "2026-07-17" ||
          (event.startMinutes >= 13 * 60 + 30 && event.endMinutes <= 17 * 60),
      ),
    ).toBe(true);

    await user.click(removeButton);
    expect(screen.getByRole("button", { name: "加入路线" })).toHaveFocus();
    await waitFor(() => {
      const state = plannerStateFromUrl();
      expect(state.selectedEventIds).not.toContain(1);
      expect(
        (state as PlannerState & { excludedEventIds: number[] }).excludedEventIds,
      ).toContain(1);
      expect(state.dates).toContain("2026-07-17");
      expect(state.availability["2026-07-17"]).toEqual({
        start: "13:30",
        end: "17:00",
      });
    });

    await user.click(screen.getByRole("button", { name: "加入路线" }));
    await waitFor(() => {
      const state = plannerStateFromUrl() as PlannerState & {
        excludedEventIds: number[];
      };
      expect(state.selectedEventIds).toContain(1);
      expect(state.excludedEventIds).not.toContain(1);
    });

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.getByRole("checkbox", { name: "7月17日" })).toBeChecked();
  });

  it("expands the default availability to contain a newly fixed event", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", {
        name: /查看活动：数学与人工智能论坛/u,
      }),
    );
    await user.click(screen.getByRole("button", { name: "加入路线" }));

    const persisted = await waitFor(() => {
      const state = plannerStateFromUrl();
      expect(state).toMatchObject({
        dates: ["2026-07-17"],
        availability: {
          "2026-07-17": { start: "13:25", end: "18:00" },
        },
        selectedEventIds: [5],
      });
      return state;
    });
    expect(
      planRoute(normalizeEvents(rawRows), persisted).items.map(
        ({ event }) => event.id,
      ),
    ).toContain(5);
  });

  it("preserves and expands an existing availability window for a fixed event", async () => {
    const customState: PlannerState = {
      dates: [],
      availability: {
        "2026-07-17": { start: "13:00", end: "17:30" },
      },
      interests: [],
      identity: null,
      goals: [],
      pace: "balanced",
      selectedEventIds: [],
      excludedEventIds: [5],
    };
    window.history.replaceState(
      null,
      "",
      `/?${encodePlannerState(customState)}`,
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", {
        name: /查看活动：数学与人工智能论坛/u,
      }),
    );
    await user.click(screen.getByRole("button", { name: "加入路线" }));

    const persisted = await waitFor(() => {
      const state = plannerStateFromUrl();
      expect(state).toMatchObject({
        dates: ["2026-07-17"],
        availability: {
          "2026-07-17": { start: "13:00", end: "18:00" },
        },
        selectedEventIds: [5],
        excludedEventIds: [],
      });
      return state;
    });
    expect(
      planRoute(normalizeEvents(rawRows), persisted).items.map(
        ({ event }) => event.id,
      ),
    ).toContain(5);
  });

  it("wraps forward and reverse tab focus inside the detail dialog", async () => {
    const user = userEvent.setup();
    render(<App />);

    const trigger = screen.getByRole("button", {
      name: /查看活动：2026世界人工智能大会暨人工智能全球治理高级别会议主论坛/u,
    });
    await user.click(trigger);

    const closeButton = screen.getByRole("button", { name: "关闭活动详情" });
    const lastAction = screen.getByRole("link", { name: "在高德地图搜索" });
    await waitFor(() => expect(closeButton).toHaveFocus());

    lastAction.focus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(lastAction).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("makes the background inert only while the detail dialog is open", async () => {
    const user = userEvent.setup();
    render(<App />);

    const trigger = screen.getByRole("button", {
      name: /查看活动：2026世界人工智能大会暨人工智能全球治理高级别会议主论坛/u,
    });
    await user.click(trigger);

    expect(trigger.closest("[inert]")).not.toBeNull();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger.closest("[inert]")).toBeNull();
  });
});
