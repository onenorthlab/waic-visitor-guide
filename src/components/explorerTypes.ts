import type { EventCategory, VenueId, WaicDate } from "../lib/types";

export interface ExplorerSelection {
  label: string;
  dates?: WaicDate[];
  categories?: EventCategory[];
  venues?: VenueId[];
  eventIds?: number[];
}
