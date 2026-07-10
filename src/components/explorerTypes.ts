import type { EventCategory, VenueId, WaicDate } from "../lib/types";

export interface ExplorerSelection {
  label: string;
  labelEn?: string;
  dates?: WaicDate[];
  categories?: EventCategory[];
  venues?: VenueId[];
  eventIds?: number[];
}
