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
