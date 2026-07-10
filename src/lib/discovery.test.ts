import rawRows from "../data/waic-raw.json";
import { describe, expect, it } from "vitest";

import {
  buildTimeHeatmap,
  calculateGoldenDayShare,
  filterEvents,
  summarizeCategories,
  summarizeVenues,
} from "./discovery";
import { normalizeEvents } from "./events";

const events = normalizeEvents(rawRows);

describe("filterEvents", () => {
  it("finds Chinese and English queries case-insensitively", () => {
    expect(filterEvents(events, { query: "记忆原生" }).map(({ id }) => id)).toContain(
      16,
    );
    expect(
      filterEvents(events, { query: "MEMORY-NATIVE" }).map(({ id }) => id),
    ).toContain(16);
  });

  it("requires every query token to match searchable bilingual fields", () => {
    expect(
      filterEvents(events, { query: "memory intelligence" }).map(({ id }) => id),
    ).toContain(16);
  });

  it("combines date, category, and venue filters", () => {
    const result = filterEvents(events, {
      dates: ["2026-07-17"],
      categories: ["大模型与AI基础"],
      venues: ["expo-exhibition"],
    });

    expect(result.map(({ id }) => id)).toEqual([7, 12, 16]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterEvents(events, { query: "definitely-not-a-waic-event" })).toEqual(
      [],
    );
  });

  it("sorts deterministically by date, start time, and id", () => {
    const shuffled = [events[15], events[11], events[6]];

    expect(filterEvents(shuffled).map(({ id }) => id)).toEqual([7, 12, 16]);
  });
});

describe("discovery summaries", () => {
  it("builds deterministic half-hour active-event heatmap cells", () => {
    const heatmap = buildTimeHeatmap(events);
    const morningPeak = heatmap.find(
      (cell) => cell.date === "2026-07-18" && cell.start === "09:30",
    );

    expect(heatmap).toHaveLength(100);
    expect(heatmap[0]).toMatchObject({
      date: "2026-07-17",
      start: "09:00",
      end: "09:30",
      count: 0,
      eventIds: [],
    });
    expect(morningPeak).toMatchObject({
      count: 30,
      eventIds: Array.from({ length: 30 }, (_, index) => index + 27),
    });
  });

  it("summarizes categories by count with stable tie breaks", () => {
    const summary = summarizeCategories(events);

    expect(summary).toHaveLength(13);
    expect(summary[0]).toMatchObject({ category: "综合论坛", count: 45 });
    expect(summary[1]).toMatchObject({ category: "大模型与AI基础", count: 35 });
    expect(summary.reduce((sum, item) => sum + item.share, 0)).toBeCloseTo(1);
    expect(
      summary.every((item) =>
        [...item.eventIds]
          .sort((a, b) => a - b)
          .every((id, index) => id === item.eventIds[index]),
      ),
    ).toBe(true);
  });

  it("summarizes venues by count with stable canonical order", () => {
    const summary = summarizeVenues(events);

    expect(summary).toHaveLength(7);
    expect(summary[0]).toMatchObject({
      venueId: "expo-center",
      zh: "世博中心",
      count: 91,
    });
    expect(summary.at(-1)).toMatchObject({
      venueId: "expo-riverside-hotel",
      count: 5,
    });
  });

  it("calculates the July 18 and 19 golden-day share", () => {
    expect(calculateGoldenDayShare(events)).toEqual({
      count: 129,
      total: 175,
      share: 129 / 175,
    });
  });

  it("handles empty summary inputs", () => {
    expect(summarizeCategories([])).toEqual([]);
    expect(summarizeVenues([])).toEqual([]);
    expect(calculateGoldenDayShare([])).toEqual({ count: 0, total: 0, share: 0 });
  });
});
