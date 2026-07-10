import type {
  CategorySummary,
  DiscoveryFilters,
  ShareSummary,
  TimeHeatmapCell,
  VenueSummary,
  WaicEvent,
} from "./types";
import { WAIC_CATEGORIES, WAIC_DATES } from "./types";

const HEATMAP_START_MINUTES = 9 * 60;
const HEATMAP_END_MINUTES = 21 * 60 + 30;
const HEATMAP_STEP_MINUTES = 30;

const VENUE_ORDER = [
  "expo-center",
  "west-bund",
  "expo-exhibition",
  "other",
  "expo-tongsen-hotel",
  "zhangjiang-science-hall",
  "expo-riverside-hotel",
] as const;

function compareEvents(left: WaicEvent, right: WaicEvent): number {
  return (
    left.date.localeCompare(right.date) ||
    left.startMinutes - right.startMinutes ||
    left.id - right.id
  );
}

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US");
}

function searchableText(event: WaicEvent): string {
  return normalizeSearchText(
    [
      event.title.zh,
      event.title.en,
      event.category,
      event.location.zh,
      event.location.en,
      event.venue.zh,
      event.venue.en,
    ].join(" "),
  );
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function filterEvents(
  events: readonly WaicEvent[],
  filters: DiscoveryFilters = {},
): WaicEvent[] {
  const queryTokens = normalizeSearchText(filters.query ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const dateSet = filters.dates?.length ? new Set(filters.dates) : undefined;
  const categorySet = filters.categories?.length
    ? new Set(filters.categories)
    : undefined;
  const venueSet = filters.venues?.length ? new Set(filters.venues) : undefined;

  return events
    .filter((event) => {
      if (dateSet && !dateSet.has(event.date)) return false;
      if (categorySet && !categorySet.has(event.category)) return false;
      if (venueSet && !venueSet.has(event.venue.id)) return false;

      if (queryTokens.length > 0) {
        const haystack = searchableText(event);
        if (!queryTokens.every((token) => haystack.includes(token))) return false;
      }

      return true;
    })
    .sort(compareEvents);
}

export function buildTimeHeatmap(
  events: readonly WaicEvent[],
): TimeHeatmapCell[] {
  return WAIC_DATES.flatMap((date) => {
    const dayEvents = events.filter((event) => event.date === date);
    const cells: TimeHeatmapCell[] = [];

    for (
      let startMinutes = HEATMAP_START_MINUTES;
      startMinutes < HEATMAP_END_MINUTES;
      startMinutes += HEATMAP_STEP_MINUTES
    ) {
      const endMinutes = startMinutes + HEATMAP_STEP_MINUTES;
      const eventIds = dayEvents
        .filter(
          (event) =>
            event.startMinutes < endMinutes && event.endMinutes > startMinutes,
        )
        .map((event) => event.id)
        .sort((left, right) => left - right);

      cells.push({
        date,
        start: formatMinutes(startMinutes),
        end: formatMinutes(endMinutes),
        startMinutes,
        endMinutes,
        count: eventIds.length,
        eventIds,
      });
    }

    return cells;
  });
}

export function summarizeCategories(
  events: readonly WaicEvent[],
): CategorySummary[] {
  if (events.length === 0) return [];

  const groups = new Map<CategorySummary["category"], number[]>();
  for (const event of events) {
    const ids = groups.get(event.category) ?? [];
    ids.push(event.id);
    groups.set(event.category, ids);
  }

  return [...groups.entries()]
    .map(([category, eventIds]) => ({
      category,
      count: eventIds.length,
      share: eventIds.length / events.length,
      eventIds: eventIds.sort((left, right) => left - right),
    }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        WAIC_CATEGORIES.indexOf(left.category) -
          WAIC_CATEGORIES.indexOf(right.category),
    );
}

export function summarizeVenues(
  events: readonly WaicEvent[],
): VenueSummary[] {
  if (events.length === 0) return [];

  const groups = new Map<
    VenueSummary["venueId"],
    Omit<VenueSummary, "count" | "share">
  >();

  for (const event of events) {
    const existing = groups.get(event.venue.id);
    if (existing) {
      existing.eventIds.push(event.id);
    } else {
      groups.set(event.venue.id, {
        venueId: event.venue.id,
        zh: event.venue.zh,
        en: event.venue.en,
        eventIds: [event.id],
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      count: group.eventIds.length,
      share: group.eventIds.length / events.length,
      eventIds: group.eventIds.sort((left, right) => left - right),
    }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        VENUE_ORDER.indexOf(left.venueId) - VENUE_ORDER.indexOf(right.venueId),
    );
}

export function calculateGoldenDayShare(
  events: readonly WaicEvent[],
): ShareSummary {
  const total = events.length;
  const count = events.filter(
    (event) => event.date === "2026-07-18" || event.date === "2026-07-19",
  ).length;

  return {
    count,
    total,
    share: total === 0 ? 0 : count / total,
  };
}
