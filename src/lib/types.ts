export const WAIC_DATES = [
  "2026-07-17",
  "2026-07-18",
  "2026-07-19",
  "2026-07-20",
] as const;

export type WaicDate = (typeof WAIC_DATES)[number];

export interface BilingualText {
  zh: string;
  en: string;
}

export const WAIC_CATEGORIES = [
  "综合论坛",
  "大模型与AI基础",
  "算力与AI芯片",
  "产业与工业智能化",
  "机器人与具身智能",
  "前沿科技与探索",
  "治理标准与政策",
  "金融与科技投资",
  "内容创意与AIGC",
  "教育与人才发展",
  "医疗与生命科学",
  "能源与可持续发展",
  "女性与多元发展",
] as const;

export type EventCategory = (typeof WAIC_CATEGORIES)[number];

export type VenueCategory =
  | "世博中心"
  | "世博展览馆"
  | "西岸国际会展中心"
  | "世博桐森酒店"
  | "世博滨江酒店"
  | "张江科学会堂"
  | "其他场馆";

export type VenueId =
  | "expo-center"
  | "expo-exhibition"
  | "west-bund"
  | "expo-tongsen-hotel"
  | "expo-riverside-hotel"
  | "zhangjiang-science-hall"
  | "other";

export interface CanonicalVenue {
  id: VenueId;
  zh: VenueCategory;
  en: string;
  detailId: string;
  detail: BilingualText;
}

export interface TimeRange {
  date: WaicDate;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
}

export interface WaicEvent {
  id: number;
  category: EventCategory;
  title: BilingualText;
  date: WaicDate;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  location: BilingualText;
  venue: CanonicalVenue;
}

export interface DiscoveryFilters {
  query?: string;
  dates?: readonly WaicDate[];
  categories?: readonly EventCategory[];
  venues?: readonly VenueId[];
}

export interface TimeHeatmapCell {
  date: WaicDate;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  count: number;
  eventIds: number[];
}

export interface CategorySummary {
  category: EventCategory;
  count: number;
  share: number;
  eventIds: number[];
}

export interface VenueSummary {
  venueId: VenueId;
  zh: VenueCategory;
  en: string;
  count: number;
  share: number;
  eventIds: number[];
}

export interface ShareSummary {
  count: number;
  total: number;
  share: number;
}

export type PlannerIdentity =
  | "developer"
  | "executive"
  | "founder"
  | "investor"
  | "researcher"
  | "creator"
  | "first-timer";

export type PlannerGoal =
  | "technical-depth"
  | "industry-insight"
  | "investment-opportunities"
  | "policy-understanding"
  | "creative-inspiration"
  | "talent-network"
  | "sustainable-impact";

export type PlannerPace = "relaxed" | "balanced" | "intensive";

export interface AvailabilityWindow {
  start: string;
  end: string;
}

export interface PlannerState {
  dates: WaicDate[];
  availability: Partial<Record<WaicDate, AvailabilityWindow>>;
  interests: EventCategory[];
  identity: PlannerIdentity | null;
  goals: PlannerGoal[];
  pace: PlannerPace;
  selectedEventIds: number[];
}

export type PlannerReasonType =
  | "interest"
  | "identity"
  | "goal"
  | "diversity"
  | "manual";

export interface PlannerReason {
  type: PlannerReasonType;
  label: string;
}

export interface PlannedEvent {
  event: WaicEvent;
  reasons: PlannerReason[];
  bufferFromPreviousMinutes: number;
}

export type RejectionType =
  | "outside-availability"
  | "time-conflict"
  | "venue-buffer"
  | "daily-limit"
  | "lower-match";

export interface RejectionReason {
  type: RejectionType;
  label: string;
  relatedEventIds: number[];
}

export interface RejectedCandidate {
  event: WaicEvent;
  relevanceReasons: PlannerReason[];
  directInterest: boolean;
  rejection: RejectionReason;
}

export interface PlannerMetrics {
  eventCount: number;
  contentMinutes: number;
  venueChanges: number;
  transitionBufferMinutes: number;
  directInterestMatches: number;
  identityMatches: number;
  goalMatches: number;
  goalsCovered: PlannerGoal[];
  goalCoverage: number;
  distinctCategories: number;
  dailyCounts: Partial<Record<WaicDate, number>>;
}

export interface PlannerResult {
  items: PlannedEvent[];
  rejectedHighRelevance: RejectedCandidate[];
  metrics: PlannerMetrics;
}
