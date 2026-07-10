import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../App";

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
    vi.unstubAllGlobals();
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

    await user.click(screen.getByRole("button", { name: "Switch to English" }));
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
    expect(
      screen.getByRole("button", { name: "Comprehensive Forums, 45 events" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Women & Diversity, 1 event" }),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/文字摘要|场峰值|活跃时段|真实主题类别/u);
  });
});
