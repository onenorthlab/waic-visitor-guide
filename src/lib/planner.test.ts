import { describe, expect, it } from "vitest";

import { canonicalVenue } from "./events";
import { planRoute } from "./planner";
import type {
  PlannerState,
  VenueCategory,
  WaicDate,
  WaicEvent,
} from "./types";

interface EventOverrides {
  id: number;
  category?: WaicEvent["category"];
  date?: WaicDate;
  start?: string;
  end?: string;
  venue?: VenueCategory;
  location?: string;
}

function clockMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function makeEvent({
  id,
  category = "大模型与AI基础",
  date = "2026-07-17",
  start = "09:00",
  end = "10:00",
  venue = "世博中心",
  location = "测试会议室A",
}: EventOverrides): WaicEvent {
  const startMinutes = clockMinutes(start);
  const endMinutes = clockMinutes(end);

  return {
    id,
    category,
    date,
    title: { zh: `活动${id}`, en: `Event ${id}` },
    startTime: start,
    endTime: end,
    startMinutes,
    endMinutes,
    durationMinutes: endMinutes - startMinutes,
    location: { zh: location, en: location },
    venue: canonicalVenue(venue, location),
  };
}

function makeState(overrides: Partial<PlannerState> = {}): PlannerState {
  return {
    dates: ["2026-07-17"],
    availability: {},
    interests: ["大模型与AI基础"],
    identity: null,
    goals: [],
    pace: "balanced",
    selectedEventIds: [],
    ...overrides,
  };
}

describe("planRoute constraints", () => {
  it("rejects overlaps and preserves the same-detail buffer", () => {
    const events = [
      makeEvent({ id: 1, start: "09:00", end: "10:00" }),
      makeEvent({ id: 2, start: "09:30", end: "10:30" }),
      makeEvent({ id: 3, start: "10:05", end: "11:00" }),
      makeEvent({ id: 4, start: "10:10", end: "11:00" }),
    ];

    expect(
      planRoute(events, makeState({ pace: "intensive" })).items.map(
        ({ event }) => event.id,
      ),
    ).toEqual([1, 4]);
  });

  it("respects the 25-minute Expo Center transfer", () => {
    const events = [
      makeEvent({ id: 1, start: "09:00", end: "10:00" }),
      makeEvent({
        id: 2,
        start: "10:20",
        end: "11:20",
        venue: "世博展览馆",
        location: "展览馆会议室A",
      }),
      makeEvent({
        id: 3,
        start: "10:25",
        end: "11:25",
        venue: "世博展览馆",
        location: "展览馆会议室A",
      }),
    ];

    expect(
      planRoute(events, makeState({ pace: "relaxed" })).items.map(
        ({ event }) => event.id,
      ),
    ).toEqual([1, 3]);
  });

  it("filters by selected dates and full-event availability", () => {
    const events = [
      makeEvent({ id: 1, start: "09:00", end: "10:00" }),
      makeEvent({ id: 2, start: "11:00", end: "12:00" }),
      makeEvent({
        id: 3,
        date: "2026-07-18",
        start: "11:00",
        end: "12:00",
      }),
    ];

    const result = planRoute(
      events,
      makeState({
        availability: {
          "2026-07-17": { start: "10:30", end: "12:30" },
        },
      }),
    );

    expect(result.items.map(({ event }) => event.id)).toEqual([2]);
  });

  it.each([
    ["relaxed", 2],
    ["balanced", 3],
    ["intensive", 4],
  ] as const)("caps %s pace at %i activities per day", (pace, expected) => {
    const events = [
      makeEvent({ id: 1, start: "09:00", end: "10:00" }),
      makeEvent({ id: 2, start: "10:10", end: "11:10" }),
      makeEvent({ id: 3, start: "11:20", end: "12:20" }),
      makeEvent({ id: 4, start: "12:30", end: "13:30" }),
    ];

    expect(planRoute(events, makeState({ pace })).items).toHaveLength(expected);
  });
});

describe("planRoute relevance and tie breaks", () => {
  it("prioritizes a direct interest over identity and goal matches", () => {
    const events = [
      makeEvent({ id: 1, category: "大模型与AI基础" }),
      makeEvent({ id: 2, category: "产业与工业智能化" }),
    ];

    const result = planRoute(
      events,
      makeState({
        identity: "executive",
        goals: ["industry-insight"],
        pace: "relaxed",
      }),
    );

    expect(result.items.map(({ event }) => event.id)).toEqual([1]);
  });

  it("uses identity as a secondary signal when there is no direct match", () => {
    const events = [
      makeEvent({ id: 1, category: "算力与AI芯片" }),
      makeEvent({ id: 2, category: "能源与可持续发展" }),
    ];

    const result = planRoute(
      events,
      makeState({ interests: [], identity: "developer", pace: "relaxed" }),
    );

    expect(result.items.map(({ event }) => event.id)).toEqual([1]);
  });

  it("uses goals as a secondary signal when there is no direct match", () => {
    const events = [
      makeEvent({ id: 1, category: "治理标准与政策" }),
      makeEvent({ id: 2, category: "大模型与AI基础" }),
    ];

    const result = planRoute(
      events,
      makeState({
        interests: [],
        goals: ["policy-understanding"],
        pace: "relaxed",
      }),
    );

    expect(result.items.map(({ event }) => event.id)).toEqual([1]);
  });

  it("uses category diversity before the stable id tie break", () => {
    const events = [
      makeEvent({ id: 1, start: "09:00", end: "10:00" }),
      makeEvent({ id: 2, start: "10:10", end: "11:10" }),
      makeEvent({
        id: 3,
        category: "产业与工业智能化",
        start: "10:10",
        end: "11:10",
      }),
    ];

    const result = planRoute(
      events,
      makeState({
        interests: ["大模型与AI基础", "产业与工业智能化"],
        pace: "relaxed",
      }),
    );

    expect(result.items.map(({ event }) => event.id)).toEqual([1, 3]);
  });
});

describe("planRoute explanations", () => {
  it("returns real route metrics and per-event reasons", () => {
    const events = [
      makeEvent({ id: 1, start: "09:00", end: "10:00" }),
      makeEvent({
        id: 2,
        category: "治理标准与政策",
        start: "10:25",
        end: "11:25",
        venue: "世博展览馆",
        location: "展览馆会议室A",
      }),
    ];

    const result = planRoute(
      events,
      makeState({ goals: ["policy-understanding"], pace: "relaxed" }),
    );

    expect(result.metrics).toEqual({
      eventCount: 2,
      contentMinutes: 120,
      venueChanges: 1,
      transitionBufferMinutes: 25,
      directInterestMatches: 1,
      identityMatches: 0,
      goalMatches: 1,
      goalsCovered: ["policy-understanding"],
      goalCoverage: 1,
      distinctCategories: 2,
      dailyCounts: { "2026-07-17": 2 },
    });
    expect(result.items[0].reasons.map(({ type }) => type)).toContain("interest");
    expect(result.items[1].reasons.map(({ type }) => type)).toContain("goal");
    expect(result.items[1].bufferFromPreviousMinutes).toBe(25);
  });

  it("reports high-relevance candidates rejected by conflicts, availability, and pace", () => {
    const events = [
      makeEvent({ id: 1, start: "09:00", end: "10:00" }),
      makeEvent({ id: 2, start: "09:30", end: "10:30" }),
      makeEvent({ id: 3, start: "10:40", end: "11:40" }),
      makeEvent({ id: 4, start: "08:00", end: "08:50" }),
      makeEvent({ id: 5, start: "11:50", end: "12:50" }),
    ];

    const result = planRoute(
      events,
      makeState({
        availability: { "2026-07-17": { start: "09:00", end: "13:00" } },
        pace: "relaxed",
      }),
    );

    expect(result.items.map(({ event }) => event.id)).toEqual([1, 3]);
    expect(
      result.rejectedHighRelevance.find(({ event }) => event.id === 2)?.rejection,
    ).toMatchObject({ type: "time-conflict", relatedEventIds: [1] });
    expect(
      result.rejectedHighRelevance.find(({ event }) => event.id === 4)?.rejection
        .type,
    ).toBe("outside-availability");
    expect(
      result.rejectedHighRelevance.find(({ event }) => event.id === 5)?.rejection
        .type,
    ).toBe("daily-limit");
  });
});
