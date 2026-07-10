import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AppErrorBoundary } from "./AppErrorBoundary";

class FragileView extends Component<{ shouldFail: () => boolean }> {
  render(): ReactNode {
    if (this.props.shouldFail()) throw new Error("broken data");
    return <p>Recovered schedule</p>;
  }
}

describe("application error boundary", () => {
  it("shows data provenance and can retry rendering", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let shouldFail = true;

    function Harness() {
      return (
        <AppErrorBoundary>
          <FragileView shouldFail={() => shouldFail} />
        </AppErrorBoundary>
      );
    }

    render(<Harness />);
    expect(
      screen.getByRole("heading", { name: "数据暂时无法读取" }),
    ).toBeInTheDocument();
    expect(screen.getByText("source-data/WAIC-2026-full-schedule.xlsx")).toBeInTheDocument();

    shouldFail = false;
    await user.click(screen.getByRole("button", { name: "重试加载" }));
    expect(screen.getByText("Recovered schedule")).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
