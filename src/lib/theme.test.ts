import { describe, expect, it } from "vitest";

import {
  BUTTON_COLOR_TOKENS,
  SEMANTIC_TEXT_COLOR_TOKENS,
  contrastRatio,
} from "./theme";

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

describe("semantic small-text contrast", () => {
  it.each(["light", "dark"] as const)(
    "keeps %s warning and success text at WCAG AA contrast",
    (theme) => {
      const colors = SEMANTIC_TEXT_COLOR_TOKENS[theme];

      colors.backgrounds.forEach((background) => {
        expect(contrastRatio(colors.orange, background)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(colors.green, background)).toBeGreaterThanOrEqual(4.5);
      });
    },
  );
});
