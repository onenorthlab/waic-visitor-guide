import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../App";

function installBrowserState() {
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
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

describe("venue guide", () => {
  beforeEach(() => {
    installBrowserState();
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the four official venue positions and shuttle frequencies", () => {
    render(<App />);

    expect(screen.getByText("世博中心前沿思想策源地")).toBeInTheDocument();
    expect(screen.getByText("世博展览馆全景应用展示窗")).toBeInTheDocument();
    expect(screen.getByText("徐汇西岸未来科技体验场")).toBeInTheDocument();
    expect(screen.getByText("张江科学会堂智能算力芯引擎")).toBeInTheDocument();
    expect(screen.getByText("西岸↔张江约10分钟一班")).toBeInTheDocument();
    expect(screen.getByText("西岸↔世博展览馆约15分钟一班")).toBeInTheDocument();
    expect(screen.getByText("世博展览馆↔张江约15分钟一班")).toBeInTheDocument();
    expect(screen.getByText("末班18:30")).toBeInTheDocument();
    expect(screen.getByText("路线中的换馆时间是建议缓冲，不是官方车程。"),).toBeInTheDocument();
  });

  it("states public opening and ticket boundaries without ambiguity", () => {
    render(<App />);

    expect(screen.getByText("7月17日上午不开放")).toBeInTheDocument();
    expect(screen.getByText("7月17日 13:30-17:00 仅受邀")).toBeInTheDocument();
    expect(screen.getByText("7月18-19日 9:00-17:00")).toBeInTheDocument();
    expect(screen.getByText("7月20日 9:00-16:00")).toBeInTheDocument();
    expect(
      screen.getByText(
        "论坛票与展览票权益不同。论坛活动以单场报名或邀请资格为准，展览入场以对应日期门票为准。",
      ),
    ).toBeInTheDocument();
  });

  it("switches the venue guide to English with the rest of the page", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "选择语言" }));
    await user.click(screen.getByRole("menuitemradio", { name: "English" }));
    expect(
      screen.getByRole("heading", { name: "Move between four core venue zones" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Last shuttle 18:30")).toBeInTheDocument();
    expect(
      screen.getByText("Forum and exhibition tickets grant different access."),
    ).toBeInTheDocument();
  });
});
