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
});
