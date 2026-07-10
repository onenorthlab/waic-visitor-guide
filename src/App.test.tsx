import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

function mockColorScheme(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? matches : false,
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

  it("uses the system theme, supports a manual whole-page toggle, and switches language", async () => {
    mockColorScheme(true);
    const user = userEvent.setup();
    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    await user.click(screen.getByRole("button", { name: "切换浅色主题" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");

    await user.click(screen.getByRole("button", { name: "Switch to English" }));
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Turn 175 forums into your highest-yield route",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plan my route" })).toBeInTheDocument();
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
