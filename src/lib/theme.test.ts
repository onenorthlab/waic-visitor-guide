import { describe, expect, it } from "vitest";

import { BUTTON_COLOR_TOKENS, contrastRatio } from "./theme";

describe("primary button contrast", () => {
  it.each(["light", "dark"] as const)(
    "keeps %s normal and hover states at WCAG AA contrast",
    (theme) => {
      const colors = BUTTON_COLOR_TOKENS[theme];

      expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrastRatio(colors.foreground, colors.hover)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
