import type { BilingualText } from "./types";

export const LANGUAGES = [
  { code: "zh", nativeLabel: "简体中文", htmlTag: "zh-CN", direction: "ltr" },
  { code: "en", nativeLabel: "English", htmlTag: "en", direction: "ltr" },
  { code: "ja", nativeLabel: "日本語", htmlTag: "ja", direction: "ltr" },
  { code: "ko", nativeLabel: "한국어", htmlTag: "ko", direction: "ltr" },
  { code: "fr", nativeLabel: "Français", htmlTag: "fr", direction: "ltr" },
  { code: "de", nativeLabel: "Deutsch", htmlTag: "de", direction: "ltr" },
  { code: "es", nativeLabel: "Español", htmlTag: "es", direction: "ltr" },
  { code: "ar", nativeLabel: "العربية", htmlTag: "ar", direction: "rtl" },
] as const;

export type Locale = (typeof LANGUAGES)[number]["code"];
export type ContentLanguage = "zh" | "en";

export function defineTranslations<T>(
  translations: Record<Locale, T>,
): Record<Locale, T> {
  return translations;
}

const metadata = Object.fromEntries(
  LANGUAGES.map((language) => [language.code, language]),
) as Record<Locale, (typeof LANGUAGES)[number]>;

export function isLocale(value: string | null | undefined): value is Locale {
  return LANGUAGES.some((language) => language.code === value);
}

export function languageHtmlTag(locale: Locale): string {
  return metadata[locale].htmlTag;
}

export function languageDirection(locale: Locale): "ltr" | "rtl" {
  return metadata[locale].direction;
}

export function contentLanguage(locale: Locale): ContentLanguage {
  return locale === "zh" ? "zh" : "en";
}

export function sourceText(source: BilingualText, locale: Locale): string {
  return source[contentLanguage(locale)];
}
