import type { CanonicalVenue } from "./types";

export const ALLOWED_VENUE_BUFFERS = [10, 15, 25, 30, 45, 60] as const;

export type VenueBufferMinutes = (typeof ALLOWED_VENUE_BUFFERS)[number];

const EXPO_CENTER_PAIR = new Set(["expo-center", "expo-exhibition"]);
const EXPO_HOTELS = new Set([
  "expo-tongsen-hotel",
  "expo-riverside-hotel",
]);
const EXPO_ADJACENT = new Set([
  "expo-center",
  "expo-exhibition",
  "expo-tongsen-hotel",
  "expo-riverside-hotel",
]);
const DISTRIBUTED = new Set(["zhangjiang-science-hall", "other"]);

export function recommendedVenueBuffer(
  from: CanonicalVenue,
  to: CanonicalVenue,
): VenueBufferMinutes {
  if (from.detailId === to.detailId) return 10;

  if (from.id === to.id && from.id !== "other") return 15;

  if (
    EXPO_CENTER_PAIR.has(from.id) &&
    EXPO_CENTER_PAIR.has(to.id) &&
    from.id !== to.id
  ) {
    return 25;
  }

  if (
    EXPO_ADJACENT.has(from.id) &&
    EXPO_ADJACENT.has(to.id) &&
    (EXPO_HOTELS.has(from.id) || EXPO_HOTELS.has(to.id))
  ) {
    return 30;
  }

  if (DISTRIBUTED.has(from.id) || DISTRIBUTED.has(to.id)) return 60;

  return 45;
}
