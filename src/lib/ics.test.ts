import { describe, expect, it } from "vitest";

import { canonicalVenue } from "./events";
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
});
