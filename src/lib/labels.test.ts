import { describe, expect, it } from "vitest";

import {
  categoryLabel,
  dateLabel,
  goalLabel,
  identityLabel,
  venueLabel,
} from "./labels";

describe("localized visitor labels", () => {
  it("localizes categories and venues beyond Chinese and English", () => {
    expect(categoryLabel("产业与工业智能化", "ja")).toBe("産業・製造AI");
    expect(categoryLabel("产业与工业智能化", "es")).toBe("IA industrial");
    expect(categoryLabel("产业与工业智能化", "ar")).toBe(
      "الذكاء الاصطناعي الصناعي",
    );
    expect(venueLabel("expo-center", "ja")).toBe("上海世博センター");
    expect(venueLabel("expo-center", "es")).toBe("Centro de Exposiciones de Shanghái");
    expect(venueLabel("expo-center", "ar")).toBe("مركز شنغهاي إكسبو");
  });

  it("localizes planner identities and goals", () => {
    expect(identityLabel("founder", "ja")).toBe("創業者");
    expect(identityLabel("researcher", "ko")).toBe("연구자");
    expect(goalLabel("technical-depth", "fr")).toBe("Approfondissement technique");
    expect(goalLabel("industry-insight", "de")).toBe("Brancheneinblicke");
  });

  it("uses deterministic localized labels for every WAIC date", () => {
    expect(dateLabel("2026-07-18", "zh")).toBe("7月18日");
    expect(dateLabel("2026-07-18", "ja")).toBe("7月18日");
    expect(dateLabel("2026-07-18", "ko")).toBe("7월 18일");
    expect(dateLabel("2026-07-18", "fr")).toBe("18 juil.");
    expect(dateLabel("2026-07-18", "ar")).toBe("18 يوليو");
  });
});
