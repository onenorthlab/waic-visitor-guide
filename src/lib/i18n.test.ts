import { describe, expect, it } from "vitest";

import {
  LANGUAGES,
  languageDirection,
  languageHtmlTag,
  sourceText,
} from "./i18n";

describe("i18n locale foundation", () => {
  it("defines the eight visitor languages with native labels", () => {
    expect(LANGUAGES.map((language) => language.code)).toEqual([
      "zh",
      "en",
      "ja",
      "ko",
      "fr",
      "de",
      "es",
      "ar",
    ]);
    expect(LANGUAGES.map((language) => language.nativeLabel)).toEqual([
      "简体中文",
      "English",
      "日本語",
      "한국어",
      "Français",
      "Deutsch",
      "Español",
      "العربية",
    ]);
  });

  it("maps HTML language and direction metadata", () => {
    expect(languageHtmlTag("zh")).toBe("zh-CN");
    expect(languageHtmlTag("ja")).toBe("ja");
    expect(languageHtmlTag("ar")).toBe("ar");
    expect(languageDirection("es")).toBe("ltr");
    expect(languageDirection("ar")).toBe("rtl");
  });

  it("uses source Chinese only for Chinese and source English for other locales", () => {
    const source = { zh: "人工智能论坛", en: "Artificial Intelligence Forum" };

    expect(sourceText(source, "zh")).toBe("人工智能论坛");
    expect(sourceText(source, "en")).toBe("Artificial Intelligence Forum");
    expect(sourceText(source, "ja")).toBe("Artificial Intelligence Forum");
    expect(sourceText(source, "ar")).toBe("Artificial Intelligence Forum");
  });
});
