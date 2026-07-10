import type { AvailabilityWindow, WaicDate } from "./types";

export const DEFAULT_AVAILABILITY: Record<WaicDate, AvailabilityWindow> = {
  "2026-07-17": { start: "13:30", end: "17:00" },
  "2026-07-18": { start: "09:00", end: "17:00" },
  "2026-07-19": { start: "09:00", end: "17:00" },
  "2026-07-20": { start: "09:00", end: "16:00" },
};
