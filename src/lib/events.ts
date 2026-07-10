import type {
  BilingualText,
  CanonicalVenue,
  EventCategory,
  TimeRange,
  WaicDate,
  WaicEvent,
  VenueCategory,
  VenueId,
} from "./types";
import { WAIC_CATEGORIES } from "./types";

const DATE_MAP = {
  "7月17日": "2026-07-17",
  "7月18日": "2026-07-18",
  "7月19日": "2026-07-19",
  "7月20日": "2026-07-20",
} as const satisfies Record<string, WaicDate>;

const VENUE_MAP: Record<
  VenueCategory,
  { id: VenueId; en: string }
> = {
  世博中心: { id: "expo-center", en: "Expo Center" },
  世博展览馆: {
    id: "expo-exhibition",
    en: "Expo Exhibition and Convention Center",
  },
  西岸国际会展中心: {
    id: "west-bund",
    en: "West Bund International Convention and Exhibition Center",
  },
  世博桐森酒店: { id: "expo-tongsen-hotel", en: "Expo Tongsen Hotel" },
  世博滨江酒店: {
    id: "expo-riverside-hotel",
    en: "Expo Riverside Hotel",
  },
  张江科学会堂: {
    id: "zhangjiang-science-hall",
    en: "Zhangjiang Science Hall",
  },
  其他场馆: { id: "other", en: "Other venue" },
};

const EXPECTED_HEADER = [
  "序号",
  "赛道分类",
  "论坛名称",
  "日期",
  "时间",
  "地点",
  "展馆",
] as const;

const EXPECTED_DATE_COUNTS: Record<WaicDate, number> = {
  "2026-07-17": 27,
  "2026-07-18": 65,
  "2026-07-19": 64,
  "2026-07-20": 19,
};

const EXPECTED_CATEGORY_COUNTS: Record<EventCategory, number> = {
  综合论坛: 45,
  大模型与AI基础: 35,
  算力与AI芯片: 22,
  产业与工业智能化: 32,
  机器人与具身智能: 5,
  前沿科技与探索: 5,
  治理标准与政策: 7,
  金融与科技投资: 4,
  内容创意与AIGC: 4,
  教育与人才发展: 9,
  医疗与生命科学: 3,
  能源与可持续发展: 3,
  女性与多元发展: 1,
};

const EXPECTED_VENUE_COUNTS: Record<VenueCategory, number> = {
  世博中心: 91,
  世博展览馆: 28,
  西岸国际会展中心: 25,
  世博桐森酒店: 13,
  世博滨江酒店: 5,
  张江科学会堂: 5,
  其他场馆: 8,
};

function requireText(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  return value.trim();
}

function stableDetailId(venueId: VenueId, location: string): string {
  const normalized = location.normalize("NFKC").replace(/\s+/g, " ").trim();
  let hash = 0x811c9dc5;

  for (const character of normalized) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }

  return `${venueId}:${(hash >>> 0).toString(36)}`;
}

function withEventContext<T>(id: number, operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`event ${id} ${message}`);
  }
}

function assertDistribution<T>(
  items: readonly T[],
  label: string,
  expected: Readonly<Record<string, number>>,
  keyOf: (item: T) => string,
): void {
  const actual = countBy(items, keyOf);
  const entries = Object.entries(expected);
  const matches =
    Object.keys(actual).length === entries.length &&
    entries.every(([key, count]) => actual[key] === count);

  if (!matches) {
    const format = (counts: Readonly<Record<string, number>>) =>
      entries.map(([key]) => `${key}:${counts[key] ?? 0}`).join(", ");
    throw new Error(
      `${label} distribution does not match the WAIC source; expected ${format(expected)}; received ${format(actual)}`,
    );
  }
}

export function splitBilingual(
  value: unknown,
  fieldName = "value",
): BilingualText {
  const lines = requireText(value, fieldName)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  const [zh, ...englishLines] = lines;
  return {
    zh,
    en: englishLines.length > 0 ? englishLines.join(" ") : zh,
  };
}

export function parseDate(value: unknown): WaicDate {
  const source = requireText(value, "date");
  const date = DATE_MAP[source as keyof typeof DATE_MAP];

  if (!date) {
    throw new Error(
      "date must be one of 7月17日, 7月18日, 7月19日, 7月20日",
    );
  }

  return date;
}

export function parseTimeRange(
  value: unknown,
  expectedDate?: WaicDate,
): TimeRange {
  const source = requireText(value, "time");
  const firstLine = source.split(/\r?\n/, 1)[0].trim();
  const match = firstLine.match(
    /^(7月(?:17|18|19|20)日)\s+([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$/,
  );

  if (!match) {
    throw new Error(
      "time must use a WAIC date and a valid HH:MM-HH:MM range on the first line",
    );
  }

  const [, sourceDate, startHour, startMinute, endHour, endMinute] = match;
  const date = parseDate(sourceDate);

  if (expectedDate && date !== expectedDate) {
    throw new Error(
      `time date ${date} does not match event date ${expectedDate}`,
    );
  }

  const startMinutes = Number(startHour) * 60 + Number(startMinute);
  const endMinutes = Number(endHour) * 60 + Number(endMinute);

  if (endMinutes <= startMinutes) {
    throw new Error("time end must be later than start");
  }

  return {
    date,
    start: `${startHour}:${startMinute}`,
    end: `${endHour}:${endMinute}`,
    startMinutes,
    endMinutes,
    durationMinutes: endMinutes - startMinutes,
  };
}

export function canonicalVenue(
  venue: unknown,
  location: string | BilingualText,
): CanonicalVenue {
  const source = requireText(venue, "venue");
  const metadata = VENUE_MAP[source as VenueCategory];

  if (!metadata) {
    throw new Error(`unknown venue category "${source}"`);
  }

  const detail =
    typeof location === "string"
      ? splitBilingual(location, "location")
      : {
          zh: requireText(location.zh, "location.zh"),
          en: requireText(location.en, "location.en"),
        };

  return {
    id: metadata.id,
    zh: source as VenueCategory,
    en: metadata.en,
    detailId: stableDetailId(metadata.id, detail.zh),
    detail,
  };
}

export function normalizeEvents(input: unknown): WaicEvent[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("schedule must be a non-empty array");
  }

  const [header, ...rows] = input;
  if (
    !Array.isArray(header) ||
    header.length !== EXPECTED_HEADER.length ||
    !EXPECTED_HEADER.every((column, index) => header[index] === column)
  ) {
    throw new Error(`schedule header must be ${EXPECTED_HEADER.join(" / ")}`);
  }

  if (rows.length !== 175) {
    throw new Error(`expected 175 event rows, received ${rows.length}`);
  }

  const seenIds = new Set<number>();
  const events = rows.map((row, rowIndex): WaicEvent => {
    if (!Array.isArray(row) || row.length !== EXPECTED_HEADER.length) {
      throw new Error(`event row ${rowIndex + 1} must contain 7 columns`);
    }

    const [rawId, rawCategory, rawTitle, rawDate, rawTime, rawLocation, rawVenue] =
      row;

    if (!Number.isInteger(rawId) || (rawId as number) < 1 || (rawId as number) > 175) {
      throw new Error(`event row ${rowIndex + 1} id must be an integer from 1 to 175`);
    }

    const id = rawId as number;
    if (seenIds.has(id)) {
      throw new Error(`duplicate event id ${id}`);
    }
    seenIds.add(id);

    return withEventContext(id, () => {
      const category = requireText(rawCategory, "category");
      if (!(WAIC_CATEGORIES as readonly string[]).includes(category)) {
        throw new Error(`unknown category "${category}"`);
      }

      const title = splitBilingual(rawTitle, "title");
      const date = parseDate(rawDate);
      const time = parseTimeRange(rawTime, date);
      const location = splitBilingual(rawLocation, "location");
      const venue = canonicalVenue(rawVenue, location);

      return {
        id,
        category: category as EventCategory,
        title,
        date,
        startTime: time.start,
        endTime: time.end,
        startMinutes: time.startMinutes,
        endMinutes: time.endMinutes,
        durationMinutes: time.durationMinutes,
        location,
        venue,
      };
    });
  });

  events.sort((left, right) => left.id - right.id);
  events.forEach((event, index) => {
    if (event.id !== index + 1) {
      throw new Error(`missing event id ${index + 1}`);
    }
  });

  assertDistribution(events, "date", EXPECTED_DATE_COUNTS, (event) => event.date);
  assertDistribution(events, "category", EXPECTED_CATEGORY_COUNTS, (event) =>
    event.category,
  );
  assertDistribution(events, "venue", EXPECTED_VENUE_COUNTS, (event) =>
    event.venue.zh,
  );

  return events;
}

export function countBy<T>(
  items: readonly T[],
  keyOf: (item: T) => string | number,
): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = String(keyOf(item));
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
