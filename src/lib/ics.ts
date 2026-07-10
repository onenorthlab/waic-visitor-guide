import type { PlannedEvent, WaicEvent } from "./types";

const CRLF = "\r\n";
const MAX_CONTENT_LINE_OCTETS = 75;
const UTF8_ENCODER = new TextEncoder();

function unwrapEvent(item: PlannedEvent | WaicEvent): WaicEvent {
  return "event" in item ? item.event : item;
}

function compareEvents(left: WaicEvent, right: WaicEvent): number {
  return (
    left.date.localeCompare(right.date) ||
    left.startMinutes - right.startMinutes ||
    left.id - right.id
  );
}

function localDateTime(event: WaicEvent, time: string): string {
  return `${event.date.replaceAll("-", "")}T${time.replace(":", "")}00`;
}

function foldContentLine(line: string): string {
  const physicalLines: string[] = [];
  let current = "";
  let currentOctets = 0;

  for (const character of line) {
    const characterOctets = UTF8_ENCODER.encode(character).byteLength;
    if (currentOctets + characterOctets > MAX_CONTENT_LINE_OCTETS) {
      physicalLines.push(current);
      current = ` ${character}`;
      currentOctets = 1 + characterOctets;
    } else {
      current += character;
      currentOctets += characterOctets;
    }
  }

  physicalLines.push(current);
  return physicalLines.join(CRLF);
}

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function createRouteIcs(
  items: readonly (PlannedEvent | WaicEvent)[],
): string {
  const events = items.map(unwrapEvent).sort(compareEvents);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WAIC Visitor Guide//ZH-CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:WAIC 2026 访客路线",
    "X-WR-TIMEZONE:Asia/Shanghai",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Shanghai",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0800",
    "TZOFFSETTO:+0800",
    "TZNAME:CST",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  events.forEach((event) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:waic-2026-${event.id}@visitor-guide`,
      "DTSTAMP:20260710T000000Z",
      `DTSTART;TZID=Asia/Shanghai:${localDateTime(event, event.startTime)}`,
      `DTEND;TZID=Asia/Shanghai:${localDateTime(event, event.endTime)}`,
      `SUMMARY:${escapeIcsText(event.title.zh)}`,
      `LOCATION:${escapeIcsText(event.location.zh)}`,
      `DESCRIPTION:${escapeIcsText(event.title.en)}`,
      `CATEGORIES:${escapeIcsText(event.category)}`,
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return `${lines.map(foldContentLine).join(CRLF)}${CRLF}`;
}
