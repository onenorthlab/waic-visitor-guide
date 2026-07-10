import { describe, expect, it } from "vitest";

import rawRows from "../data/waic-raw.json";
import { canonicalVenue } from "./events";
import { normalizeEvents } from "./events";
import { createRouteIcs, escapeIcsText } from "./ics";
import type { PlannedEvent, WaicEvent } from "./types";

function makeEvent(id: number, startTime: string, endTime: string): WaicEvent {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  const location = {
    zh: "世博中心,金厅;A\n入口\\东",
    en: "Expo Center, Gold Hall; A\nEast\\Entrance",
  };

  return {
    id,
    category: "大模型与AI基础",
    title: {
      zh: "AI,未来;论坛\n第二行",
      en: "AI, Future; Forum\nSecond line",
    },
    date: "2026-07-17",
    startTime,
    endTime,
    startMinutes,
    endMinutes,
    durationMinutes: endMinutes - startMinutes,
    location,
    venue: canonicalVenue("世博中心", location),
  };
}

function routeItem(event: WaicEvent): PlannedEvent {
  return { event, reasons: [], bufferFromPreviousMinutes: 0 };
}

function physicalLines(ics: string): string[] {
  return ics.split("\r\n").slice(0, -1);
}

function unfoldIcs(ics: string): string {
  return ics.replace(/\r\n[ \t]/g, "");
}

describe("escapeIcsText", () => {
  it("escapes backslashes, commas, semicolons, and newlines", () => {
    expect(escapeIcsText("a,b;c\\d\nnext")).toBe("a\\,b\\;c\\\\d\\nnext");
  });
});

describe("createRouteIcs", () => {
  it("uses Asia/Shanghai local date-times and escaped event text", () => {
    const ics = createRouteIcs([routeItem(makeEvent(1, "14:00", "17:00"))]);

    expect(ics).toContain("TZID:Asia/Shanghai\r\n");
    expect(ics).toContain(
      "DTSTART;TZID=Asia/Shanghai:20260717T140000\r\n",
    );
    expect(ics).toContain("DTEND;TZID=Asia/Shanghai:20260717T170000\r\n");
    expect(ics).toContain("SUMMARY:AI\\,未来\\;论坛\\n第二行\r\n");
    expect(ics).toContain(
      "LOCATION:世博中心\\,金厅\\;A\\n入口\\\\东\r\n",
    );
    expect(ics).toContain(
      "DESCRIPTION:AI\\, Future\\; Forum\\nSecond line\r\n",
    );
  });

  it("creates one deterministic VEVENT per route event", () => {
    const items = [
      routeItem(makeEvent(2, "17:10", "18:00")),
      routeItem(makeEvent(1, "14:00", "17:00")),
    ];
    const first = createRouteIcs(items);
    const second = createRouteIcs(items);

    expect(first.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(first).toBe(second);
    expect(first.indexOf("UID:waic-2026-1@visitor-guide")).toBeLessThan(
      first.indexOf("UID:waic-2026-2@visitor-guide"),
    );
    expect(first.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("folds long multilingual content without changing its logical value", () => {
    const event = makeEvent(1, "14:00", "17:00");
    event.title.zh =
      "从记忆原生智能到可信人工智能治理的超长论坛标题与现场实践分享🚀";
    event.title.en =
      "From Memory-Native Intelligence to Trustworthy AI Governance and Practical Field Insights";
    event.location.zh =
      "上海世博中心特别会议区域超长地点说明，入口位于东侧大厅并请由指定通道进入";

    const ics = createRouteIcs([event]);
    const unfolded = unfoldIcs(ics);
    const continuations = physicalLines(ics).filter((line) => line.startsWith(" "));

    expect(continuations.length).toBeGreaterThan(0);
    expect(continuations.every((line) => !line.startsWith("  "))).toBe(true);
    expect(unfolded).toContain(`SUMMARY:${escapeIcsText(event.title.zh)}\r\n`);
    expect(unfolded).toContain(`DESCRIPTION:${escapeIcsText(event.title.en)}\r\n`);
    expect(unfolded).toContain(`LOCATION:${escapeIcsText(event.location.zh)}\r\n`);
    expect(ics).not.toContain("\uFFFD");
  });

  it("keeps every physical line within 75 UTF-8 octets for all 175 events", () => {
    const events = normalizeEvents(rawRows);
    const ics = createRouteIcs(events);
    const lines = physicalLines(ics);
    const unfolded = unfoldIcs(ics);

    expect(lines.every((line) => Buffer.byteLength(line, "utf8") <= 75)).toBe(
      true,
    );
    expect(
      lines.every(
        (line) =>
          line.startsWith(" ") ||
          /^[A-Z][A-Z0-9-]*(?:;[^:]*)?:/.test(line),
      ),
    ).toBe(true);
    expect(lines.some((line) => line.startsWith(" "))).toBe(true);

    events.forEach((event) => {
      expect(unfolded).toContain(`SUMMARY:${escapeIcsText(event.title.zh)}\r\n`);
      expect(unfolded).toContain(
        `DESCRIPTION:${escapeIcsText(event.title.en)}\r\n`,
      );
      expect(unfolded).toContain(`LOCATION:${escapeIcsText(event.location.zh)}\r\n`);
    });
  });
});
