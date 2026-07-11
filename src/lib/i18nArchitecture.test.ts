import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const UI_FILES = [
  "src/App.tsx",
  "src/components/OpportunityLandscape.tsx",
  "src/components/Planner.tsx",
  "src/components/VenueGuide.tsx",
];

describe("complete UI localization architecture", () => {
  it("does not route interface copy through the Chinese-or-English source fallback", () => {
    for (const file of UI_FILES) {
      expect(readFileSync(file, "utf8"), file).not.toContain("contentLanguage(");
    }
  });

  it("keeps the language menu out of document flow in a bounded grid", () => {
    const css = readFileSync("src/styles.css", "utf8");
    expect(css).toMatch(/\.language-menu\s*\{[\s\S]*?position:\s*absolute;/u);
    expect(css).toMatch(/\.language-menu\s*\{[\s\S]*?grid-template-columns:/u);
    expect(css).toMatch(/\.language-menu\s*\{[\s\S]*?max-width:/u);
  });

  it("keeps the desktop carousel controls visible with a compact content stage", () => {
    const css = readFileSync("src/styles.css", "utf8");
    expect(css).toMatch(/\.landscape-carousel-stage\s*\{[\s\S]*?min-height:\s*280px;/u);
    expect(css).toMatch(/\.landscape-event-card h3\s*\{[\s\S]*?42px/u);
  });
});
