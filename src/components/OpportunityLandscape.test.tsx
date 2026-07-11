import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../App";
import rawRows from "../data/waic-raw.json";
import { buildTimeHeatmap } from "../lib/discovery";
import { displayText } from "../lib/display";
import { normalizeEvents } from "../lib/events";

describe("opportunity landscape", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    window.history.replaceState(null, "", "/");
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
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("opens the matching activities from heatmap, topic, and venue nodes", async () => {
    const user = userEvent.setup();
    const events = normalizeEvents(rawRows);
    const heatCell = buildTimeHeatmap(events).find(
      (cell) => cell.date === "2026-07-18" && cell.start === "09:30",
    );
    const heatEvent = events.find((event) => event.id === heatCell?.eventIds[0]);
    const topicEvent = events.find((event) => event.category === "综合论坛");
    const venueEvent = events.find((event) => event.venue.id === "expo-center");
    if (!heatEvent || !topicEvent || !venueEvent) {
      throw new Error("expected fixture events for landscape carousel tests");
    }
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "7月18日 09:30-10:00，30 场活动" }),
    );
    let dialog = screen.getByRole("dialog", {
      name: "7月18日 09:30-10:00的活动",
    });
    expect(within(dialog).getByText("1 / 30")).toBeInTheDocument();
    expect(within(dialog).getByText(displayText(heatEvent?.title.zh))).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "关闭活动轮播" }));

    await user.click(screen.getByRole("button", { name: "综合论坛，45 场" }));
    dialog = screen.getByRole("dialog", { name: "综合论坛的活动" });
    expect(within(dialog).getByText("1 / 45")).toBeInTheDocument();
    expect(within(dialog).getByText(displayText(topicEvent?.title.zh))).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "关闭活动轮播" }));

    await user.click(
      screen.getByRole("button", { name: "世博中心，91 场，示意位置" }),
    );
    dialog = screen.getByRole("dialog", { name: "世博中心的活动" });
    expect(within(dialog).getByText("1 / 91")).toBeInTheDocument();
    expect(within(dialog).getByText(displayText(venueEvent?.title.zh))).toBeInTheDocument();
  });

  it("does not open empty heatmap windows", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "7月17日 09:00-09:30，0 场活动" }),
    ).toBeDisabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("auto-advances the activity loop and lets visitors pause it", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "综合论坛，45 场" }));
    const dialog = screen.getByRole("dialog", { name: "综合论坛的活动" });

    expect(within(dialog).getByText("1 / 45")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5_000));
    expect(within(dialog).getByText("2 / 45")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "暂停自动播放" }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(within(dialog).getByText("2 / 45")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "继续自动播放" }));
    act(() => vi.advanceTimersByTime(5_000));
    expect(within(dialog).getByText("3 / 45")).toBeInTheDocument();
  });

  it("cross-filters carousel activities by day, venue, and topic", async () => {
    const user = userEvent.setup();
    const events = normalizeEvents(rawRows);
    const industrialEvents = events.filter(
      (event) => event.category === "产业与工业智能化",
    );
    const chosen = industrialEvents[0];
    if (!chosen) throw new Error("expected industrial fixture events");
    const expectedCount = industrialEvents.filter(
      (event) =>
        event.date === chosen.date && event.venue.id === chosen.venue.id,
    ).length;
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: `产业与工业智能化，${industrialEvents.length} 场` }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "产业与工业智能化的活动",
    });

    expect(within(dialog).getByRole("combobox", { name: "按日期筛选" })).toBeInTheDocument();
    expect(within(dialog).getByRole("combobox", { name: "按场馆筛选" })).toBeInTheDocument();
    expect(within(dialog).getByRole("combobox", { name: "按主题筛选" })).toBeInTheDocument();

    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: "按日期筛选" }),
      chosen.date,
    );
    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: "按场馆筛选" }),
      chosen.venue.id,
    );

    expect(within(dialog).getByText(`筛选结果：${expectedCount} 场活动`)).toBeInTheDocument();
    expect(within(dialog).getByText(`1 / ${expectedCount}`)).toBeInTheDocument();
  });

  it("localizes the activity discovery flow while preserving official English source text", async () => {
    const user = userEvent.setup();
    const event = normalizeEvents(rawRows).find(
      (item) => item.category === "产业与工业智能化",
    );
    if (!event) throw new Error("expected industrial fixture event");
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选择语言" }));
    await user.click(screen.getByRole("menuitemradio", { name: "日本語" }));
    expect(
      screen.getByRole("heading", { name: "機会が集中する場所を見つける" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("See where opportunity concentrates")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "産業・製造AI, 32件" }),
    );

    const dialog = screen.getByRole("dialog", { name: "産業・製造AIのイベント" });
    expect(within(dialog).getByRole("combobox", { name: "日付で絞り込む" })).toBeInTheDocument();
    expect(within(dialog).getByRole("combobox", { name: "会場で絞り込む" })).toBeInTheDocument();
    expect(within(dialog).getByText(displayText(event.title.en))).toBeInTheDocument();
  });

  it("renders four days of semantic half-hour heatmap cells and filters the schedule", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 2, name: "先看哪里机会最密集" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /7月\d{2}日 \d{2}:\d{2}-\d{2}:\d{2}，\d+ 场活动/u }),
    ).toHaveLength(100);
    expect(
      screen.getByText(
        "文字摘要：7月18日 15:00-15:30 为全程峰值，同时进行 34 场活动。颜色越深代表同一时段选择越多，每格仍标注具体场数。",
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "7月18日 09:30-10:00，30 场活动",
      }),
    );

    expect(screen.getByText("当前筛选：7月18日 09:30-10:00")).toBeInTheDocument();
  });

  it("uses all 13 real categories as an asymmetric topic atlas", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("13 个真实主题类别，共 175 场")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "综合论坛，45 场" }));
    expect(screen.getByText("当前筛选：综合论坛")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "关闭活动轮播" }));
    expect(screen.getByRole("button", { name: "女性与多元发展，1 场" })).toBeInTheDocument();
  });

  it("shows all seven venue categories as a labeled schematic instead of a precise map", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("7 类场馆，共 175 场")).toBeInTheDocument();
    expect(
      screen.getByText("位置为场馆类别关系示意，不代表精确地图坐标。"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "世博中心，91 场，示意位置" }),
    );
    expect(screen.getByText("当前筛选：世博中心")).toBeInTheDocument();
  });

  it("switches every dynamic label, fallback, aria label, and filter status to English", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "选择语言" }));
    await user.click(screen.getByRole("menuitemradio", { name: "English" }));
    expect(screen.getByText(/active half-hour windows/u)).toBeInTheDocument();
    expect(screen.getByText("13 real topic categories, 175 events")).toBeInTheDocument();
    expect(screen.getByText("7 venue categories, 175 events")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Positions show venue-category relationships, not precise map coordinates.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Comprehensive Forums, 45 events" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Expo Center, 91 events, schematic position",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Jul 18 09:30-10:00, 30 events",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Comprehensive Forums, 45 events" }),
    );
    expect(screen.getByText("Current filter: Comprehensive Forums")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close activity carousel" }));
    expect(
      screen.getByRole("button", { name: "Comprehensive Forums, 45 events" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Women & Diversity, 1 event" }),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/文字摘要|场峰值|活跃时段|真实主题类别/u);
  });
});
