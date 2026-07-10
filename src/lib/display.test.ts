import { describe, expect, it } from "vitest";

import { displayText } from "./display";

describe("displayText", () => {
  it("replaces source em and en dashes without changing the source value", () => {
    const source = "AI治理——主论坛 — 7月17日 – 7月20日";

    expect(displayText(source)).toBe("AI治理--主论坛 - 7月17日 - 7月20日");
    expect(source).toBe("AI治理——主论坛 — 7月17日 – 7月20日");
  });
});
