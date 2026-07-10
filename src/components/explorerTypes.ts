import type { EventCategory, VenueId, WaicDate } from "../lib/types";

export interface ExplorerSelection {
  kind: "heatmap" | "category" | "venue";
  key: string;
  label: string;
  labelEn?: string;
  dates?: WaicDate[];
  categories?: EventCategory[];
  venues?: VenueId[];
  eventIds?: number[];
}
