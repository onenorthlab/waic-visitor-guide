import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../App";
import rawRows from "../data/waic-raw.json";
import { canonicalVenue, normalizeEvents } from "../lib/events";
import { encodePlannerState, PLANNER_STORAGE_KEY } from "../lib/share";
import type { PlannerState, WaicEvent } from "../lib/types";
import { Planner, RouteActions } from "./Planner";

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
  excludedEventIds: [],
};

function plannerEvent(
  id: number,
  startTime: string,
  endTime: string,
  category: WaicEvent["category"] = "大模型与AI基础",
): WaicEvent {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  const location = { zh: "测试会议室A", en: "Test Room A" };
  return {
    id,
    category,
    date: "2026-07-17",
    title: { zh: `测试活动${id}`, en: `Test event ${id}` },
    startTime,
    endTime,
    startMinutes,
    endMinutes,
    durationMinutes: endMinutes - startMinutes,
    location,
    venue: canonicalVenue("世博中心", location),
  };
}

function StatefulPlanner({
  events,
  initialState,
}: {
  events: readonly WaicEvent[];
  initialState: PlannerState;
}) {
  const [state, setState] = useState(initialState);
  return (
    <>
      <Planner events={events} state={state} onStateChange={setState} />
      <output aria-label="planner state">{JSON.stringify(state)}</output>
    </>
  );
}

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(blob);
  });
}

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
    expect(screen.getByText(/路线包含 \d+ 场活动/u)).toHaveAttribute(
      "aria-live",
      "polite",
    );
    const budget = screen.getByRole("region", { name: "路线注意力预算" });
    expect(within(budget).getByText("活动场数")).toBeInTheDocument();
    expect(within(budget).getByText("有效内容小时")).toBeInTheDocument();
    expect(within(budget).getByText("目标赛道覆盖")).toBeInTheDocument();
    expect(within(budget).getByText("主题数")).toBeInTheDocument();
    expect(within(budget).getByText("换馆次数")).toBeInTheDocument();
    expect(within(budget).getByText("建议缓冲")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 3, name: "高相关但未进入路线" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/时间冲突|换馆缓冲不足|活动上限/u).length).toBeGreaterThan(0);
    expect(screen.queryByText(/总分/u)).not.toBeInTheDocument();

    const eligibilityNote = screen.getByRole("note", { name: "入场资格提醒" });
    expect(
      within(eligibilityNote).getByText(
        "路线推荐不等于入场资格。论坛活动仍需单场报名或邀请。",
      ),
    ).toBeInTheDocument();
    expect(
      within(eligibilityNote).getByRole("link", { name: "前往 WAIC 官方注册" }),
    ).toHaveAttribute("href", "https://www.worldaic.com.cn/register");

    await user.click(screen.getByRole("button", { name: "Switch to English" }));
    const englishNote = screen.getByRole("note", { name: "Admission reminder" });
    expect(
      within(englishNote).getByText(
        "A route recommendation does not grant admission. Forum sessions still require individual registration or an invitation.",
      ),
    ).toBeInTheDocument();
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
    expect(screen.getByText("规划结果：0 场可行活动")).toHaveAttribute(
      "aria-live",
      "polite",
    );
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
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("view=route"));
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/#planner$/u));
    expect(screen.getByText("链接已复制")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "生成我的路线" }));
    await user.click(screen.getByRole("button", { name: "下载 ICS" }));
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:waic-route"),
    );

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

  it("restores a generated route from its flagged URL on a fresh mount", async () => {
    const user = userEvent.setup();
    const firstMount = render(<App />);

    await user.selectOptions(screen.getByLabelText("你的身份"), "executive");
    await user.click(screen.getByRole("checkbox", { name: "综合论坛" }));
    await user.click(screen.getByRole("checkbox", { name: "7月17日" }));
    await user.click(screen.getByRole("checkbox", { name: "7月18日" }));
    await user.click(screen.getByRole("checkbox", { name: "7月19日" }));
    await user.click(screen.getByRole("checkbox", { name: "7月20日" }));
    fireEvent.change(screen.getByLabelText("7月20日结束时间"), {
      target: { value: "17:00" },
    });
    await user.click(screen.getByRole("button", { name: "生成我的路线" }));

    const generatedSummary = await screen.findByText(/路线包含 \d+ 场活动/u);
    const summaryText = generatedSummary.textContent ?? "";
    expect(summaryText).toBe("路线包含 9 场活动");
    await waitFor(() =>
      expect(new URLSearchParams(window.location.search).get("view")).toBe("route"),
    );

    const sharedSearch = window.location.search;
    firstMount.unmount();
    window.history.replaceState(null, "", `/${sharedSearch}`);
    render(<App />);

    expect(await screen.findByText(summaryText)).toBeInTheDocument();
    expect(screen.getByText("路线已生成")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("你的身份"), "developer");
    await waitFor(() =>
      expect(new URLSearchParams(window.location.search).get("view")).toBeNull(),
    );
    expect(screen.queryByText(summaryText)).not.toBeInTheDocument();
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
      excludedEventIds: [],
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

  it("keeps fixed sessions in the canonical route and recomputes after removal", async () => {
    const events = [
      plannerEvent(1, "09:00", "10:00"),
      plannerEvent(2, "10:10", "11:10", "能源与可持续发展"),
      plannerEvent(3, "11:20", "12:20"),
    ];
    const state: PlannerState = {
      dates: ["2026-07-17"],
      availability: {},
      interests: ["大模型与AI基础"],
      identity: null,
      goals: [],
      pace: "balanced",
      selectedEventIds: [2],
      excludedEventIds: [],
    };
    const user = userEvent.setup();
    render(<StatefulPlanner events={events} initialState={state} />);

    await user.click(screen.getByRole("button", { name: "生成我的路线" }));

    const budget = screen.getByRole("region", { name: "路线注意力预算" });
    expect(within(budget).getByText("3 场")).toBeInTheDocument();
    expect(screen.getByText("手动保留活动")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /从路线移除：测试活动1/u }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /从推荐路线移除并重算：测试活动2/u,
      }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /从路线移除：测试活动2/u }),
    );

    await waitFor(() =>
      expect(within(budget).getByText("2 场")).toBeInTheDocument(),
    );
    expect(screen.getByText("测试活动1")).toBeInTheDocument();
    expect(screen.getByText("测试活动3")).toBeInTheDocument();
    expect(screen.queryByText("测试活动2")).not.toBeInTheDocument();
  });

  it("removes an automatic recommendation and recalculates the next-best route", async () => {
    const events = [
      plannerEvent(1, "09:00", "10:00"),
      plannerEvent(2, "10:10", "11:10"),
      plannerEvent(3, "11:20", "12:20"),
    ];
    const state: PlannerState = {
      dates: ["2026-07-17"],
      availability: {},
      interests: ["大模型与AI基础"],
      identity: null,
      goals: [],
      pace: "relaxed",
      selectedEventIds: [],
      excludedEventIds: [],
    };
    const user = userEvent.setup();
    render(<StatefulPlanner events={events} initialState={state} />);

    await user.click(screen.getByRole("button", { name: "生成我的路线" }));
    expect(screen.getByText("路线包含 2 场活动")).toBeInTheDocument();
    expect(screen.getByText("测试活动1")).toBeInTheDocument();
    expect(screen.getByText("测试活动2")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "从推荐路线移除并重算：测试活动1",
      }),
    );

    await waitFor(() =>
      expect(
        JSON.parse(screen.getByLabelText("planner state").textContent ?? "{}"),
      ).toMatchObject({ excludedEventIds: [1] }),
    );
    expect(screen.queryByText("测试活动1")).not.toBeInTheDocument();
    expect(screen.getByText("测试活动2")).toBeInTheDocument();
    expect(screen.getByText("测试活动3")).toBeInTheDocument();
    expect(screen.getByText("路线包含 2 场活动")).toBeInTheDocument();
  });

  it("keeps a removed highest-match fixed event excluded after recomputing", async () => {
    const event = plannerEvent(1, "09:00", "10:00");
    const state = {
      dates: ["2026-07-17"],
      availability: {},
      interests: ["大模型与AI基础"],
      identity: null,
      goals: [],
      pace: "relaxed",
      selectedEventIds: [1],
      excludedEventIds: [],
    } as PlannerState & { excludedEventIds: number[] };
    const user = userEvent.setup();
    render(<StatefulPlanner events={[event]} initialState={state} />);

    await user.click(screen.getByRole("button", { name: "生成我的路线" }));
    expect(screen.getByText("路线包含 1 场活动")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /从路线移除：测试活动1/u }),
    );

    await waitFor(() =>
      expect(screen.getByText("规划结果：0 场可行活动")).toBeInTheDocument(),
    );
    expect(
      JSON.parse(screen.getByLabelText("planner state").textContent ?? "{}"),
    ).toMatchObject({ selectedEventIds: [], excludedEventIds: [1] });
  });

  it("recomputes metrics and ICS when Explorer changes a generated route", async () => {
    const routeBlobs: Blob[] = [];
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn((blob: Blob) => {
        routeBlobs.push(blob);
        return "blob:external-route";
      }),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "生成我的路线" }));
    expect(screen.getByText("规划结果：0 场可行活动")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /查看活动：2026世界人工智能大会暨人工智能全球治理高级别会议主论坛/u,
      }),
    );
    await user.click(screen.getByRole("button", { name: "加入路线" }));
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.getByText("路线包含 1 场活动")).toBeInTheDocument(),
    );
    expect(new URLSearchParams(window.location.search).get("view")).toBe("route");
    expect(
      within(screen.getByRole("region", { name: "路线注意力预算" })).getByText(
        "1 场",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "下载 ICS" }));
    expect(routeBlobs).toHaveLength(1);
    const ics = (await readBlob(routeBlobs[0])).replace(/\r?\n[ \t]/gu, "");
    expect(ics).toContain(
      "SUMMARY:2026世界人工智能大会暨人工智能全球治理高级别会议主论坛",
    );

    await user.click(
      screen.getByRole("button", {
        name: /查看活动：2026世界人工智能大会暨人工智能全球治理高级别会议主论坛/u,
      }),
    );
    await user.click(screen.getByRole("button", { name: "移出路线" }));
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.getByText("规划结果：0 场可行活动")).toBeInTheDocument(),
    );
    expect(new URLSearchParams(window.location.search).get("view")).toBe("route");
    const persisted = JSON.parse(
      new URLSearchParams(window.location.search).get("plan") ?? "{}",
    ) as PlannerState & { excludedEventIds: number[] };
    expect(persisted).toMatchObject({
      selectedEventIds: [],
      excludedEventIds: [1],
    });
    expect(screen.queryByRole("button", { name: "下载 ICS" })).not.toBeInTheDocument();
  });

  it("reports invalid planner state when sharing without an unhandled rejection", async () => {
    const event = plannerEvent(1, "09:00", "10:00");
    const invalidState: PlannerState = {
      dates: ["2026-07-17"],
      availability: {
        "2026-07-17": { start: "12:00", end: "10:00" },
      },
      interests: [],
      identity: null,
      goals: [],
      pace: "relaxed",
      selectedEventIds: [1],
      excludedEventIds: [],
    };
    const user = userEvent.setup();
    render(
      <Planner
        events={[event]}
        state={invalidState}
        onStateChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "分享路线" }));

    expect(screen.getByText("分享失败，请重试")).toBeInTheDocument();
  });

  it("reports an ICS failure when object URL creation throws", async () => {
    const event = plannerEvent(1, "09:00", "10:00");
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => {
        throw new Error("blocked");
      }),
    });
    const user = userEvent.setup();
    render(<RouteActions state={restoredState} events={[event]} />);

    await user.click(screen.getByRole("button", { name: "下载 ICS" }));

    expect(screen.getByText("ICS 生成失败，请重试")).toBeInTheDocument();
  });

  it("removes its temporary anchor and revokes the URL when download click throws", async () => {
    const event = plannerEvent(1, "09:00", "10:00");
    const createObjectURL = vi.fn().mockReturnValue("blob:failed-route");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function (this: HTMLAnchorElement) {
        expect(this.isConnected).toBe(true);
        throw new Error("download blocked");
      },
    );
    const user = userEvent.setup();
    render(<RouteActions state={restoredState} events={[event]} />);

    await user.click(screen.getByRole("button", { name: "下载 ICS" }));

    expect(screen.getByText("ICS 生成失败，请重试")).toBeInTheDocument();
    expect(
      document.querySelector('a[download="waic-2026-route.ics"]'),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:failed-route"),
    );
  });
});
