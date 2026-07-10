// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  DEFAULT_PLANNER_STATE,
  PLANNER_STORAGE_KEY,
  decodePlannerState,
  encodePlannerState,
  loadPlannerState,
  savePlannerState,
} from "./share";
import type { StorageLike } from "./share";
import type { PlannerState } from "./types";

const state: PlannerState = {
  dates: ["2026-07-17", "2026-07-19"],
  availability: {
    "2026-07-17": { start: "13:00", end: "18:30" },
    "2026-07-19": { start: "09:00", end: "17:30" },
  },
  interests: ["大模型与AI基础", "机器人与具身智能"],
  identity: "developer",
  goals: ["technical-depth", "industry-insight"],
  pace: "intensive",
};

function memoryStorage(initial?: Record<string, string>): StorageLike {
  const values = new Map(Object.entries(initial ?? {}));
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe("planner state URL sharing", () => {
  it("roundtrips a complete planner state through URL parameters", () => {
    const encoded = encodePlannerState(state);

    expect(new URLSearchParams(encoded).has("plan")).toBe(true);
    expect(decodePlannerState(`?${encoded}`)).toEqual(state);
  });

  it("canonicalizes selection order for deterministic links", () => {
    const reordered: PlannerState = {
      ...state,
      dates: [...state.dates].reverse(),
      interests: [...state.interests].reverse(),
      goals: [...state.goals].reverse(),
    };

    expect(encodePlannerState(reordered)).toBe(encodePlannerState(state));
  });

  it("falls back safely for malformed JSON or invalid values", () => {
    const invalidValue = new URLSearchParams({
      plan: JSON.stringify({ ...state, dates: ["2026-07-21"] }),
    }).toString();

    expect(decodePlannerState("?plan=%7Bbad-json", state)).toEqual(state);
    expect(decodePlannerState(invalidValue, state)).toEqual(state);
    expect(decodePlannerState("", state)).toEqual(state);
  });

  it("returns a clone of fallback state instead of shared mutable data", () => {
    const decoded = decodePlannerState("", DEFAULT_PLANNER_STATE);
    decoded.dates.push("2026-07-17");

    expect(DEFAULT_PLANNER_STATE.dates).toEqual([]);
  });
});

describe("planner state persistence", () => {
  it("saves and restores validated state with injected storage", () => {
    const storage = memoryStorage();

    expect(savePlannerState(state, storage)).toBe(true);
    expect(loadPlannerState(storage)).toEqual(state);
  });

  it("falls back for corrupted storage", () => {
    const storage = memoryStorage({ [PLANNER_STORAGE_KEY]: "{bad-json" });

    expect(loadPlannerState(storage, state)).toEqual(state);
  });

  it("guards browser storage access when window is unavailable", () => {
    expect(typeof window).toBe("undefined");
    expect(savePlannerState(state)).toBe(false);
    expect(loadPlannerState()).toEqual(DEFAULT_PLANNER_STATE);
  });

  it("guards storage exceptions", () => {
    const storage: StorageLike = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("quota exceeded");
      },
    };

    expect(savePlannerState(state, storage)).toBe(false);
    expect(loadPlannerState(storage, state)).toEqual(state);
  });
});
