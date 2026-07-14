import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

function mockColorScheme(matches: boolean) {
  let darkMatches = matches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return query === "(prefers-color-scheme: dark)" ? darkMatches : false;
      },
      media: query,
      onchange: null,
      addEventListener: (
        type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        if (query === "(prefers-color-scheme: dark)" && type === "change") {
          listeners.add(listener);
        }
      },
      removeEventListener: (
        type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        if (query === "(prefers-color-scheme: dark)" && type === "change") {
          listeners.delete(listener);
        }
      },
      addListener: (listener: (event: MediaQueryListEvent) => void) =>
        listeners.add(listener),
      removeListener: (listener: (event: MediaQueryListEvent) => void) =>
        listeners.delete(listener),
      dispatchEvent: vi.fn(),
    })),
  );

  return {
    setDark(next: boolean) {
      darkMatches = next;
      const event = {
        matches: next,
        media: "(prefers-color-scheme: dark)",
      } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

function installLocalStorage() {
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
}

describe("application shell", () => {
  beforeEach(() => {
    installLocalStorage();
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
    mockColorScheme(false);
  });

  afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute("data-theme");
    vi.unstubAllGlobals();
  });

  it("renders the decision-first hero, real data insights, and semantic shell", () => {
    render(<App />);

    expect(screen.getByRole("navigation", { name: "主导航" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "175 场论坛，排成你的高收益路线",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("按目标、时间与场馆，生成无冲突、少折返的 WAIC 参访计划。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "开始规划" })).toHaveAttribute(
      "href",
      "#planner",
    );
    expect(screen.getByRole("link", { name: "查看全景" })).toHaveAttribute(
      "href",
      "#landscape",
    );

    expect(screen.getByText("129/175")).toBeInTheDocument();
    expect(screen.getByText("112/175")).toBeInTheDocument();
    expect(screen.getByText("91/175")).toBeInTheDocument();

    const image = screen.getByRole("img", { name: "WAIC 2026 活动密度地形图" });
    expect(image).toHaveAttribute("src", "/assets/waic-data-terrain.webp");
    expect(image).toHaveAttribute("width", "1774");
    expect(image).toHaveAttribute("height", "887");
    expect(image).toHaveAttribute("fetchpriority", "high");
  });

  it("links back to the WaytoAGI Side Events site in nav and footer", () => {
    render(<App />);

    const links = screen.getAllByRole("link", { name: "周边活动" });
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "https://waic.waytoagi.com/");
      expect(link).toHaveAttribute("target", "_blank");
    }
  });

  it("places the route planner ahead of the landscape section", () => {
    const { container } = render(<App />);

    const planner = container.querySelector("#planner");
    const landscape = container.querySelector("#landscape");
    expect(planner).not.toBeNull();
    expect(landscape).not.toBeNull();
    expect(
      planner!.compareDocumentPosition(landscape!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("keeps menu rows aligned while preserving RTL text inside the Arabic item", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选择语言" }));
    const arabicItem = screen.getByRole("menuitemradio", { name: "العربية" });
    expect(arabicItem).not.toHaveAttribute("dir");
    expect(arabicItem.querySelector("span")).toHaveAttribute("dir", "rtl");
  });

  it("keeps the URL clean while the planner state is default", () => {
    render(<App />);

    expect(window.location.search).toBe("");
  });

  it("strips a default plan parameter arriving in a shared URL", () => {
    window.history.replaceState(
      null,
      "",
      `/?plan=${encodeURIComponent(
        JSON.stringify({
          dates: [],
          availability: {},
          interests: [],
          identity: null,
          goals: [],
          pace: "balanced",
          selectedEventIds: [],
          excludedEventIds: [],
        }),
      )}`,
    );

    render(<App />);

    expect(window.location.search).toBe("");
  });

  it("reflects a customized planner state in the URL for sharing", () => {
    window.localStorage.setItem(
      "waic-visitor-guide:planner-state:v1",
      JSON.stringify({
        dates: ["2026-07-18"],
        availability: {},
        interests: [],
        identity: null,
        goals: [],
        pace: "balanced",
        selectedEventIds: [],
        excludedEventIds: [],
      }),
    );

    render(<App />);

    const plan = new URLSearchParams(window.location.search).get("plan");
    expect(plan).not.toBeNull();
    expect(JSON.parse(plan ?? "{}").dates).toEqual(["2026-07-18"]);
  });

  it("uses the system theme, supports a manual whole-page toggle, and switches language", async () => {
    mockColorScheme(true);
    const user = userEvent.setup();
    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    await user.click(screen.getByRole("button", { name: "切换浅色主题" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");

    await user.click(screen.getByRole("button", { name: "选择语言" }));
    await user.click(screen.getByRole("menuitemradio", { name: "English" }));
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Turn 175 forums into your highest-yield route",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plan my route" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "An independent visitor planning tool by WaytoAGI. Please follow the latest WAIC website and Hi WAIC APP updates for event times and admission rules.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Data updated: 2026-07-10")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "WAIC official website" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();
  });

  it("offers eight languages, persists the choice, and applies Arabic RTL", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选择语言" }));
    const menu = screen.getByRole("menu", { name: "语言" });
    expect(menu).toBeInTheDocument();
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(8);

    await user.click(screen.getByRole("menuitemradio", { name: "日本語" }));
    expect(document.documentElement).toHaveAttribute("lang", "ja");
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
    expect(window.localStorage.getItem("waic-visitor-guide:language")).toBe("ja");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "175のフォーラムから、最高の一日を組み立てよう",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ルートを作成" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "言語を選択" }));
    await user.click(screen.getByRole("menuitemradio", { name: "العربية" }));
    expect(document.documentElement).toHaveAttribute("lang", "ar");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(window.localStorage.getItem("waic-visitor-guide:language")).toBe("ar");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "حوّل 175 منتدى إلى مسارك الأكثر فائدة",
      }),
    ).toBeInTheDocument();
  });

  it("localizes the planner and venue guide in Japanese without English UI fallback", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选择语言" }));
    await user.click(screen.getByRole("menuitemradio", { name: "日本語" }));

    expect(screen.getByRole("heading", { name: "30秒で来場ルートを作成" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "4つの主要会場を賢く移動" })).toBeInTheDocument();
    expect(screen.queryByText("Build your visit route in 30 seconds")).not.toBeInTheDocument();
    expect(screen.queryByText("Move between four core venue zones")).not.toBeInTheDocument();
  });

  it("keeps every primary navigation destination keyboard reachable on mobile", () => {
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "主导航" });
    expect(navigation.querySelector(".nav-links")).toHaveClass("mobile-scroll-nav");
    ["总览", "机会全景", "路线工作台", "全部日程", "场馆指南"].forEach(
      (label) => {
        expect(screen.getByRole("link", { name: label })).not.toHaveAttribute(
          "tabindex",
          "-1",
        );
      },
    );
  });

  it("follows system theme changes until the visitor makes an explicit choice", async () => {
    const systemTheme = mockColorScheme(false);
    const user = userEvent.setup();
    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(window.localStorage.getItem("waic-visitor-guide:theme")).toBeNull();

    act(() => systemTheme.setDark(true));
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("waic-visitor-guide:theme")).toBeNull();

    await user.click(screen.getByRole("button", { name: "切换浅色主题" }));
    expect(window.localStorage.getItem("waic-visitor-guide:theme")).toBe("light");

    act(() => systemTheme.setDark(false));
    act(() => systemTheme.setDark(true));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("shows fixed provenance and never exposes em or en dashes in rendered copy", () => {
    const { container } = render(<App />);

    expect(
      screen.getByText(
        "WaytoAGI 制作的独立访客规划工具。活动时间与入场规则请以 WAIC 官网和 Hi WAIC APP 最新发布为准。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("数据更新：2026-07-10")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "WAIC 官网" })).toHaveAttribute(
      "href",
      "https://www.worldaic.com.cn/",
    );
    expect(container.textContent).not.toMatch(/[\u2013\u2014]/u);
  });
});
