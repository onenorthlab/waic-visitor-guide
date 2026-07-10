import { PACE_DAILY_LIMIT, PLANNER_GOALS, PLANNER_IDENTITIES } from "./planner";
import type {
  AvailabilityWindow,
  EventCategory,
  PlannerGoal,
  PlannerState,
  WaicDate,
} from "./types";
import { WAIC_CATEGORIES, WAIC_DATES } from "./types";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const PLANNER_STORAGE_KEY = "waic-visitor-guide:planner-state:v1";

export const DEFAULT_PLANNER_STATE: PlannerState = {
  dates: [],
  availability: {},
  interests: [],
  identity: null,
  goals: [],
  pace: "balanced",
  selectedEventIds: [],
  excludedEventIds: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOrderedSelection<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T[] | null {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item): item is T => typeof item === "string" && allowed.includes(item as T),
    )
  ) {
    return null;
  }

  const selected = new Set(value);
  return allowed.filter((item) => selected.has(item));
}

function parseClock(value: string): number | null {
  if (value === "24:00") return 24 * 60;
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function normalizeAvailability(
  value: unknown,
): Partial<Record<WaicDate, AvailabilityWindow>> | null {
  if (!isRecord(value)) return null;

  for (const key of Object.keys(value)) {
    if (!WAIC_DATES.includes(key as WaicDate)) return null;
  }

  const result: Partial<Record<WaicDate, AvailabilityWindow>> = {};
  for (const date of WAIC_DATES) {
    const window = value[date];
    if (window === undefined) continue;
    if (
      !isRecord(window) ||
      typeof window.start !== "string" ||
      typeof window.end !== "string"
    ) {
      return null;
    }

    const start = parseClock(window.start);
    const end = parseClock(window.end);
    if (start === null || end === null || start >= end) return null;
    result[date] = { start: window.start, end: window.end };
  }

  return result;
}

function normalizeSelectedEventIds(value: unknown): number[] | null {
  if (
    !Array.isArray(value) ||
    !value.every(
      (id): id is number =>
        typeof id === "number" && Number.isInteger(id) && id >= 1 && id <= 175,
    ) ||
    new Set(value).size !== value.length
  ) {
    return null;
  }

  return [...value];
}

function normalizePlannerState(value: unknown): PlannerState | null {
  if (!isRecord(value)) return null;

  const dates = normalizeOrderedSelection(value.dates, WAIC_DATES);
  const availability = normalizeAvailability(value.availability);
  const interests = normalizeOrderedSelection<EventCategory>(
    value.interests,
    WAIC_CATEGORIES,
  );
  const goals = normalizeOrderedSelection<PlannerGoal>(value.goals, PLANNER_GOALS);
  const selectedEventIds = normalizeSelectedEventIds(value.selectedEventIds);
  const excludedEventIds = normalizeSelectedEventIds(
    value.excludedEventIds ?? [],
  );
  const identity = value.identity;
  const pace = value.pace;

  if (
    !dates ||
    !availability ||
    !interests ||
    !goals ||
    !selectedEventIds ||
    !excludedEventIds ||
    !(
      identity === null ||
      (typeof identity === "string" &&
        PLANNER_IDENTITIES.includes(identity as (typeof PLANNER_IDENTITIES)[number]))
    ) ||
    typeof pace !== "string" ||
    !Object.hasOwn(PACE_DAILY_LIMIT, pace)
  ) {
    return null;
  }

  return {
    dates,
    availability,
    interests,
    identity: identity as PlannerState["identity"],
    goals,
    pace: pace as PlannerState["pace"],
    selectedEventIds,
    excludedEventIds: excludedEventIds.filter(
      (id) => !selectedEventIds.includes(id),
    ),
  };
}

function cloneState(state: PlannerState): PlannerState {
  return {
    dates: [...state.dates],
    availability: Object.fromEntries(
      Object.entries(state.availability).map(([date, window]) => [
        date,
        window ? { ...window } : window,
      ]),
    ),
    interests: [...state.interests],
    identity: state.identity,
    goals: [...state.goals],
    pace: state.pace,
    selectedEventIds: [...state.selectedEventIds],
    excludedEventIds: [...state.excludedEventIds],
  };
}

function safeFallback(fallback: PlannerState): PlannerState {
  const normalized = normalizePlannerState(fallback);
  return cloneState(normalized ?? DEFAULT_PLANNER_STATE);
}

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function encodePlannerState(state: PlannerState): string {
  const normalized = normalizePlannerState(state);
  if (!normalized) throw new Error("planner state is invalid");

  return new URLSearchParams({ plan: JSON.stringify(normalized) }).toString();
}

export function decodePlannerState(
  search: string,
  fallback: PlannerState = DEFAULT_PLANNER_STATE,
): PlannerState {
  try {
    const source = search.startsWith("?") ? search.slice(1) : search;
    const encoded = new URLSearchParams(source).get("plan");
    if (!encoded) return safeFallback(fallback);

    const normalized = normalizePlannerState(JSON.parse(encoded));
    return normalized ?? safeFallback(fallback);
  } catch {
    return safeFallback(fallback);
  }
}

export function savePlannerState(
  state: PlannerState,
  storage?: StorageLike | null,
): boolean {
  const target = storage === undefined ? browserStorage() : storage;
  const normalized = normalizePlannerState(state);
  if (!target || !normalized) return false;

  try {
    target.setItem(PLANNER_STORAGE_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

export function loadPlannerState(
  storage?: StorageLike | null,
  fallback: PlannerState = DEFAULT_PLANNER_STATE,
): PlannerState {
  const target = storage === undefined ? browserStorage() : storage;
  if (!target) return safeFallback(fallback);

  try {
    const stored = target.getItem(PLANNER_STORAGE_KEY);
    if (!stored) return safeFallback(fallback);
    return normalizePlannerState(JSON.parse(stored)) ?? safeFallback(fallback);
  } catch {
    return safeFallback(fallback);
  }
}
