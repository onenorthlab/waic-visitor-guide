import rawRows from "../data/waic-raw.json";
import { describe, expect, it } from "vitest";

import {
  canonicalVenue,
  countBy,
  normalizeEvents,
  parseDate,
  parseTimeRange,
  splitBilingual,
} from "./events";

type MutableRows = Array<Array<string | number>>;

const cloneRows = () => structuredClone(rawRows) as MutableRows;

describe("splitBilingual", () => {
  it("splits and trims Chinese and English lines", () => {
    expect(splitBilingual(" 中文标题 \n English title ")).toEqual({
      zh: "中文标题",
      en: "English title",
    });
  });

  it("falls back safely when no English line exists", () => {
    expect(splitBilingual("只有一行")).toEqual({
      zh: "只有一行",
      en: "只有一行",
    });
  });

  it("rejects missing text with a clear field name", () => {
    expect(() => splitBilingual("  ", "title")).toThrow(
      "title must be a non-empty string",
    );
  });
});

describe("date and time parsing", () => {
  it.each([
    ["7月17日", "2026-07-17"],
    ["7月18日", "2026-07-18"],
    ["7月19日", "2026-07-19"],
    ["7月20日", "2026-07-20"],
  ] as const)("maps %s to %s", (source, expected) => {
    expect(parseDate(source)).toBe(expected);
  });

  it("rejects dates outside WAIC 2026", () => {
    expect(() => parseDate("7月21日")).toThrow(
      "date must be one of 7月17日, 7月18日, 7月19日, 7月20日",
    );
  });

  it("parses the Chinese first line and computes duration", () => {
    expect(
      parseTimeRange(
        "7月18日 09:30-12:00\nJuly 18th 09:30-12:00",
        "2026-07-18",
      ),
    ).toEqual({
      date: "2026-07-18",
      start: "09:30",
      end: "12:00",
      startMinutes: 570,
      endMinutes: 720,
      durationMinutes: 150,
    });
  });

  it("rejects a time whose date disagrees with the date column", () => {
    expect(() =>
      parseTimeRange("7月19日 09:30-12:00", "2026-07-18"),
    ).toThrow("time date 2026-07-19 does not match event date 2026-07-18");
  });

  it("requires the end to be later than the start", () => {
    expect(() => parseTimeRange("7月18日 12:00-09:30")).toThrow(
      "time end must be later than start",
    );
  });
});

describe("canonicalVenue", () => {
  it.each([
    ["世博中心", "expo-center"],
    ["世博展览馆", "expo-exhibition"],
    ["西岸国际会展中心", "west-bund"],
    ["世博桐森酒店", "expo-tongsen-hotel"],
    ["世博滨江酒店", "expo-riverside-hotel"],
    ["张江科学会堂", "zhangjiang-science-hall"],
    ["其他场馆", "other"],
  ] as const)("maps %s to %s", (source, expected) => {
    expect(canonicalVenue(source, "测试地点").id).toBe(expected);
  });

  it("uses a stable, location-specific detail id for other venues", () => {
    const first = canonicalVenue("其他场馆", "临港观潮厅");
    const same = canonicalVenue("其他场馆", " 临港观潮厅 ");
    const different = canonicalVenue("其他场馆", "西岸穹顶艺术中心");

    expect(first.detailId).toBe(same.detailId);
    expect(first.detailId).not.toBe(different.detailId);
    expect(first.detailId).toMatch(/^other:/);
  });

  it("rejects unknown venue categories", () => {
    expect(() => canonicalVenue("不存在的场馆", "测试地点")).toThrow(
      'unknown venue category "不存在的场馆"',
    );
  });
});

describe("normalizeEvents", () => {
  it("normalizes the complete source dataset", () => {
    const events = normalizeEvents(rawRows);

    expect(events).toHaveLength(175);
    expect(events.map((event) => event.id)).toEqual(
      Array.from({ length: 175 }, (_, index) => index + 1),
    );
    expect(countBy(events, (event) => event.date)).toEqual({
      "2026-07-17": 27,
      "2026-07-18": 65,
      "2026-07-19": 64,
      "2026-07-20": 19,
    });
    expect(Object.keys(countBy(events, (event) => event.category))).toHaveLength(
      13,
    );
    expect(countBy(events, (event) => event.venue.zh)).toEqual({
      世博中心: 91,
      西岸国际会展中心: 25,
      世博展览馆: 28,
      其他场馆: 8,
      世博桐森酒店: 13,
      张江科学会堂: 5,
      世博滨江酒店: 5,
    });
  });

  it("preserves bilingual text and single-language fallback", () => {
    const events = normalizeEvents(rawRows);

    expect(events.find((event) => event.id === 16)?.title.en).toContain(
      "Memory-Native",
    );
    expect(events.find((event) => event.id === 84)?.title).toEqual({
      zh: "WAICA - Main Track Session 1",
      en: "WAICA - Main Track Session 1",
    });
  });

  it("reuses detail ids for repeated other-venue locations", () => {
    const events = normalizeEvents(rawRows);
    const byId = new Map(events.map((event) => [event.id, event]));

    expect(byId.get(26)?.venue.detailId).toBe(byId.get(174)?.venue.detailId);
    expect(byId.get(8)?.venue.detailId).not.toBe(byId.get(26)?.venue.detailId);
  });

  it("rejects missing fields with row context", () => {
    const rows = cloneRows();
    rows[1][1] = "";

    expect(() => normalizeEvents(rows)).toThrow(
      "event 1 category must be a non-empty string",
    );
  });

  it("rejects duplicate ids", () => {
    const rows = cloneRows();
    rows[2][0] = 1;

    expect(() => normalizeEvents(rows)).toThrow("duplicate event id 1");
  });

  it("rejects malformed time ranges with row context", () => {
    const rows = cloneRows();
    rows[1][4] = "7月17日 18:00-17:00";

    expect(() => normalizeEvents(rows)).toThrow(
      "event 1 time end must be later than start",
    );
  });
});
