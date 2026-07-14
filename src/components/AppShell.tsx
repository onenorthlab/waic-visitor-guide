import {
  ArrowDownRight,
  ArrowUpRight,
  CaretDown,
  Moon,
  Sun,
  Translate,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { displayText } from "../lib/display";
import {
  LANGUAGES,
  isLocale,
  languageDirection,
  languageHtmlTag,
  type Locale,
} from "../lib/i18n";

export type Language = Locale;
type Theme = "light" | "dark";
type ThemePreference = Theme | "system";

const THEME_STORAGE_KEY = "waic-visitor-guide:theme";
const LANGUAGE_STORAGE_KEY = "waic-visitor-guide:language";

// 回流 Side Events 站的入口。必须用 rel="noopener"（不能加 noreferrer，那会抹掉
// Referer，导致对方 GA 把访客记成直接访问，无法衡量本站导流）；UTM 里 utm_content
// 区分入口位置，用于判断导航与页脚哪个更有效。
const SIDE_EVENTS_BASE =
  "https://waic.waytoagi.com/?utm_source=waic-guide&utm_medium=referral&utm_campaign=waic2026";
const SIDE_EVENTS_NAV_URL = `${SIDE_EVENTS_BASE}&utm_content=nav`;
const SIDE_EVENTS_FOOTER_URL = `${SIDE_EVENTS_BASE}&utm_content=footer`;

const languagePickerCopy: Record<Locale, { choose: string; menu: string }> = {
  zh: { choose: "选择语言", menu: "语言" },
  en: { choose: "Choose language", menu: "Languages" },
  ja: { choose: "言語を選択", menu: "言語" },
  ko: { choose: "언어 선택", menu: "언어" },
  fr: { choose: "Choisir la langue", menu: "Langues" },
  de: { choose: "Sprache wählen", menu: "Sprachen" },
  es: { choose: "Elegir idioma", menu: "Idiomas" },
  ar: { choose: "اختر اللغة", menu: "اللغات" },
};

const copy = {
  zh: {
    navLabel: "主导航",
    brand: "WAIC 2026 访客指南",
    guideLabel: "访客指南",
    independent: "独立访客规划工具",
    nav: [
      ["总览", "#overview"],
      ["路线工作台", "#planner"],
      ["机会全景", "#landscape"],
      ["全部日程", "#schedule"],
      ["场馆指南", "#venues"],
    ],
    sideEvents: "周边活动",
    heading: "175 场论坛，排成你的高收益路线",
    subcopy: "按目标、时间与场馆，生成无冲突、少折返的 WAIC 参访计划。",
    primary: "开始规划",
    secondary: "查看全景",
    terrainAlt: "WAIC 2026 活动密度地形图",
    switchLanguage: "Switch to English",
    themeToLight: "切换浅色主题",
    themeToDark: "切换深色主题",
    insightsLabel: "数据洞察",
    insights: [
      ["129/175", "黄金两日", "7 月 18-19 日活动最密集"],
      ["112/175", "三大赛道", "综合、大模型、产业智能"],
      ["91/175", "世博中心", "论坛最集中的核心场馆"],
    ],
    footerTrust:
      "WaytoAGI 制作的独立访客规划工具。活动时间与入场规则请以 WAIC 官网和 Hi WAIC APP 最新发布为准。",
    footerSource: "源表：上海 WAIC 完整会议活动情况",
    footerUpdated: "数据更新：2026-07-10",
    footerOfficial: "WAIC 官网",
  },
  en: {
    navLabel: "Primary navigation",
    brand: "WAIC 2026 Visitor Guide",
    guideLabel: "VISITOR GUIDE",
    independent: "Independent visitor planning tool",
    nav: [
      ["Overview", "#overview"],
      ["Route planner", "#planner"],
      ["Landscape", "#landscape"],
      ["Schedule", "#schedule"],
      ["Venue guide", "#venues"],
    ],
    sideEvents: "Side Events",
    heading: "Turn 175 forums into your highest-yield route",
    subcopy: "Build a conflict-free WAIC plan around your goals, time, and venues.",
    primary: "Plan my route",
    secondary: "View landscape",
    terrainAlt: "WAIC 2026 event density terrain",
    switchLanguage: "切换中文",
    themeToLight: "Switch to light theme",
    themeToDark: "Switch to dark theme",
    insightsLabel: "Data insights",
    insights: [
      ["129/175", "Peak two days", "July 18-19 hold the densest schedule"],
      ["112/175", "Three leading tracks", "General, foundation models, industry AI"],
      ["91/175", "Expo Center", "The forum program's main hub"],
    ],
    footerTrust:
      "An independent visitor planning tool by WaytoAGI. Please follow the latest WAIC website and Hi WAIC APP updates for event times and admission rules.",
    footerSource: "Source: complete Shanghai WAIC forum schedule",
    footerUpdated: "Data updated: 2026-07-10",
    footerOfficial: "WAIC official website",
  },
  ja: {
    navLabel: "メインナビゲーション", brand: "WAIC 2026 ビジターガイド", guideLabel: "ビジターガイド", independent: "独立した来場プランニングツール",
    nav: [["概要", "#overview"], ["ルート作成", "#planner"], ["全体像", "#landscape"], ["全日程", "#schedule"], ["会場ガイド", "#venues"]],
    sideEvents: "サイドイベント",
    heading: "175のフォーラムから、最高の一日を組み立てよう", subcopy: "目的、時間、会場に合わせて、重複と移動の少ないWAICプランを作成します。", primary: "ルートを作成", secondary: "全体像を見る", terrainAlt: "WAIC 2026 イベント密度マップ", switchLanguage: "言語を切り替え", themeToLight: "ライトテーマに切り替え", themeToDark: "ダークテーマに切り替え", insightsLabel: "データインサイト",
    insights: [["129/175", "ピークの2日間", "7月18日と19日にイベントが集中"], ["112/175", "主要3分野", "総合、基盤モデル、産業AI"], ["91/175", "世博センター", "フォーラムの中心会場"]],
    footerTrust: "WaytoAGIによる独立した来場プランニングツールです。時間と入場規則はWAIC公式サイトとHi WAIC APPの最新情報をご確認ください。", footerSource: "出典：上海WAIC全フォーラム日程", footerUpdated: "データ更新：2026-07-10", footerOfficial: "WAIC公式サイト",
  },
  ko: {
    navLabel: "주요 탐색", brand: "WAIC 2026 방문자 가이드", guideLabel: "방문자 가이드", independent: "독립 방문 계획 도구",
    nav: [["개요", "#overview"], ["동선 설계", "#planner"], ["전체 보기", "#landscape"], ["전체 일정", "#schedule"], ["장소 안내", "#venues"]],
    sideEvents: "사이드 이벤트",
    heading: "175개 포럼으로 나만의 고효율 동선을 만드세요", subcopy: "목표, 시간, 장소에 맞춰 일정 충돌과 이동을 줄인 WAIC 계획을 세우세요.", primary: "동선 만들기", secondary: "전체 보기", terrainAlt: "WAIC 2026 행사 밀도 지도", switchLanguage: "언어 전환", themeToLight: "라이트 테마로 전환", themeToDark: "다크 테마로 전환", insightsLabel: "데이터 인사이트",
    insights: [["129/175", "가장 붐비는 이틀", "7월 18~19일에 행사가 집중됩니다"], ["112/175", "3대 트랙", "종합, 파운데이션 모델, 산업 AI"], ["91/175", "엑스포 센터", "포럼 프로그램의 중심 장소"]],
    footerTrust: "WaytoAGI가 만든 독립 방문 계획 도구입니다. 행사 시간과 입장 규정은 WAIC 공식 웹사이트와 Hi WAIC APP의 최신 공지를 확인하세요.", footerSource: "출처: 상하이 WAIC 전체 포럼 일정", footerUpdated: "데이터 업데이트: 2026-07-10", footerOfficial: "WAIC 공식 웹사이트",
  },
  fr: {
    navLabel: "Navigation principale", brand: "Guide visiteur WAIC 2026", guideLabel: "GUIDE VISITEUR", independent: "Outil indépendant de préparation de visite",
    nav: [["Aperçu", "#overview"], ["Itinéraire", "#planner"], ["Panorama", "#landscape"], ["Programme", "#schedule"], ["Lieux", "#venues"]],
    sideEvents: "Side Events",
    heading: "Transformez 175 forums en un parcours à fort impact", subcopy: "Créez un programme WAIC sans conflit selon vos objectifs, vos horaires et les lieux.", primary: "Créer mon parcours", secondary: "Voir le panorama", terrainAlt: "Carte de densité des événements WAIC 2026", switchLanguage: "Changer de langue", themeToLight: "Activer le thème clair", themeToDark: "Activer le thème sombre", insightsLabel: "Repères clés",
    insights: [["129/175", "Deux jours de pointe", "Les 18 et 19 juillet concentrent le programme"], ["112/175", "Trois thèmes majeurs", "Général, modèles fondamentaux, IA industrielle"], ["91/175", "Centre Expo", "Le principal pôle des forums"]],
    footerTrust: "Outil indépendant créé par WaytoAGI. Consultez le site WAIC et l’application Hi WAIC pour les horaires et conditions d’accès à jour.", footerSource: "Source : programme complet des forums WAIC de Shanghai", footerUpdated: "Données mises à jour : 2026-07-10", footerOfficial: "Site officiel WAIC",
  },
  de: {
    navLabel: "Hauptnavigation", brand: "WAIC 2026 Besucherleitfaden", guideLabel: "BESUCHERLEITFADEN", independent: "Unabhängiges Tool zur Besuchsplanung",
    nav: [["Überblick", "#overview"], ["Route planen", "#planner"], ["Themenlandschaft", "#landscape"], ["Programm", "#schedule"], ["Orte", "#venues"]],
    sideEvents: "Side Events",
    heading: "Machen Sie aus 175 Foren Ihre ergiebigste Route", subcopy: "Erstellen Sie einen konfliktfreien WAIC-Plan nach Zielen, Zeit und Veranstaltungsorten.", primary: "Route planen", secondary: "Landschaft ansehen", terrainAlt: "WAIC 2026 Veranstaltungsdichte", switchLanguage: "Sprache wechseln", themeToLight: "Helles Design aktivieren", themeToDark: "Dunkles Design aktivieren", insightsLabel: "Dateneinblicke",
    insights: [["129/175", "Zwei Spitzentage", "Am 18. und 19. Juli ist das Programm am dichtesten"], ["112/175", "Drei Hauptthemen", "Übergreifend, Basismodelle, industrielle KI"], ["91/175", "Expo Center", "Das Zentrum des Forenprogramms"]],
    footerTrust: "Ein unabhängiges Planungstool von WaytoAGI. Aktuelle Zeiten und Zutrittsregeln finden Sie auf der WAIC-Website und in der Hi WAIC APP.", footerSource: "Quelle: vollständiges Shanghai-WAIC-Forenprogramm", footerUpdated: "Datenstand: 2026-07-10", footerOfficial: "Offizielle WAIC-Website",
  },
  es: {
    navLabel: "Navegación principal", brand: "Guía del visitante WAIC 2026", guideLabel: "GUÍA DEL VISITANTE", independent: "Herramienta independiente para planificar la visita",
    nav: [["Resumen", "#overview"], ["Plan de ruta", "#planner"], ["Panorama", "#landscape"], ["Programa", "#schedule"], ["Recintos", "#venues"]],
    sideEvents: "Side Events",
    heading: "Convierte 175 foros en tu ruta de mayor provecho", subcopy: "Crea un plan WAIC sin conflictos según tus objetivos, horarios y recintos.", primary: "Crear mi ruta", secondary: "Ver panorama", terrainAlt: "Mapa de densidad de eventos WAIC 2026", switchLanguage: "Cambiar idioma", themeToLight: "Cambiar al tema claro", themeToDark: "Cambiar al tema oscuro", insightsLabel: "Datos clave",
    insights: [["129/175", "Dos días punta", "El 18 y 19 de julio concentran el programa"], ["112/175", "Tres áreas principales", "General, modelos fundacionales e IA industrial"], ["91/175", "Centro Expo", "El núcleo principal de los foros"]],
    footerTrust: "Herramienta independiente de WaytoAGI. Consulta el sitio de WAIC y la aplicación Hi WAIC para conocer horarios y normas de acceso actualizados.", footerSource: "Fuente: programa completo de foros WAIC de Shanghái", footerUpdated: "Datos actualizados: 2026-07-10", footerOfficial: "Sitio oficial de WAIC",
  },
  ar: {
    navLabel: "التنقل الرئيسي", brand: "دليل زائر WAIC 2026", guideLabel: "دليل الزائر", independent: "أداة مستقلة لتخطيط الزيارة",
    nav: [["نظرة عامة", "#overview"], ["خطط مسارك", "#planner"], ["المشهد", "#landscape"], ["الجدول", "#schedule"], ["دليل الأماكن", "#venues"]],
    sideEvents: "الفعاليات الجانبية",
    heading: "حوّل 175 منتدى إلى مسارك الأكثر فائدة", subcopy: "أنشئ خطة WAIC بلا تعارض وفق أهدافك ووقتك والأماكن التي تختارها.", primary: "أنشئ مساري", secondary: "استعرض المشهد", terrainAlt: "خريطة كثافة فعاليات WAIC 2026", switchLanguage: "تغيير اللغة", themeToLight: "التبديل إلى المظهر الفاتح", themeToDark: "التبديل إلى المظهر الداكن", insightsLabel: "رؤى البيانات",
    insights: [["129/175", "أكثر يومين ازدحاماً", "يتركز البرنامج في 18 و19 يوليو"], ["112/175", "ثلاثة مسارات رئيسية", "العام والنماذج الأساسية والذكاء الصناعي"], ["91/175", "مركز إكسبو", "المحور الرئيسي للمنتديات"]],
    footerTrust: "أداة مستقلة من WaytoAGI. راجع موقع WAIC وتطبيق Hi WAIC لأحدث المواعيد وقواعد الدخول.", footerSource: "المصدر: الجدول الكامل لمنتديات WAIC في شنغهاي", footerUpdated: "تحديث البيانات: 2026-07-10", footerOfficial: "الموقع الرسمي لـ WAIC",
  },
} as const;

function savedThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const saved = window.localStorage?.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function currentSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

interface HeaderProps {
  locale: Locale;
  onLanguageChange: (locale: Locale) => void;
}

export function Header({ locale, onLanguageChange }: HeaderProps) {
  const content = copy[locale];
  const pickerCopy = languagePickerCopy[locale];
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  const [themePreference, setThemePreference] =
    useState<ThemePreference>(savedThemePreference);
  const [systemTheme, setSystemTheme] = useState<Theme>(currentSystemTheme);
  const theme = themePreference === "system" ? systemTheme : themePreference;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    try {
      if (themePreference === "system") {
        window.localStorage?.removeItem(THEME_STORAGE_KEY);
      } else {
        window.localStorage?.setItem(THEME_STORAGE_KEY, themePreference);
      }
    } catch {
      // Theme selection remains usable when browser storage is unavailable.
    }

    if (themePreference !== "system") return;
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const onChange = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [themePreference]);

  useEffect(() => {
    if (!languageMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setLanguageMenuOpen(false);
      languageButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [languageMenuOpen]);

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label={displayText(content.navLabel)}>
        <a className="wordmark" href="#overview" aria-label={displayText(content.brand)}>
          <img
            src="https://waic.waytoagi.com/brand/logo.png"
            alt=""
            width="32"
            height="32"
          />
          <span className="wordmark-copy">
            <strong>WAIC 2026</strong>
            <small>{content.guideLabel}</small>
          </span>
        </a>
        <div className="nav-links mobile-scroll-nav">
          {content.nav.map(([label, href]) => (
            <a href={href} key={href}>
              {displayText(label)}
            </a>
          ))}
          <a
            className="nav-external"
            href={SIDE_EVENTS_NAV_URL}
            target="_blank"
            rel="noopener"
          >
            {displayText(content.sideEvents)}
            <ArrowUpRight aria-hidden="true" weight="bold" />
          </a>
        </div>
        <div className="nav-actions">
          <div className="language-menu-wrap">
            <button
              className="icon-button language-toggle"
              type="button"
              ref={languageButtonRef}
              aria-label={pickerCopy.choose}
              aria-haspopup="menu"
              aria-expanded={languageMenuOpen}
              onClick={() => setLanguageMenuOpen((open) => !open)}
            >
              <Translate aria-hidden="true" weight="bold" />
              <span>{LANGUAGES.find((item) => item.code === locale)?.nativeLabel}</span>
              <CaretDown aria-hidden="true" weight="bold" />
            </button>
            {languageMenuOpen ? (
              <div className="language-menu" role="menu" aria-label={pickerCopy.menu}>
                {LANGUAGES.map((item) => (
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={item.code === locale}
                    key={item.code}
                    lang={item.htmlTag}
                    aria-label={item.nativeLabel}
                    onClick={() => {
                      onLanguageChange(item.code);
                      setLanguageMenuOpen(false);
                      queueMicrotask(() => languageButtonRef.current?.focus());
                    }}
                  >
                    <span dir={item.direction}>{item.nativeLabel}</span>
                    <small aria-hidden="true">{item.code.toUpperCase()}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label={displayText(
              theme === "dark" ? content.themeToLight : content.themeToDark,
            )}
            onClick={() =>
              setThemePreference(theme === "dark" ? "light" : "dark")
            }
          >
            {theme === "dark" ? (
              <Sun aria-hidden="true" weight="bold" />
            ) : (
              <Moon aria-hidden="true" weight="bold" />
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}

export function Hero({ language }: { language: Locale }) {
  const content = copy[language];

  return (
    <>
      <section className="hero" id="overview" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">{displayText(content.independent)}</p>
          <h1 id="hero-title">{displayText(content.heading)}</h1>
          <p className="hero-subcopy">{displayText(content.subcopy)}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#planner">
              {displayText(content.primary)}
              <ArrowDownRight aria-hidden="true" weight="bold" />
            </a>
            <a className="button button-secondary" href="#landscape">
              {displayText(content.secondary)}
            </a>
          </div>
        </div>
        <figure className="hero-visual">
          <img
            src="/assets/waic-data-terrain.webp"
            alt={displayText(content.terrainAlt)}
            width="1774"
            height="887"
            fetchPriority="high"
            decoding="async"
          />
        </figure>
      </section>
      <section className="insight-spine" aria-label={displayText(content.insightsLabel)}>
        {content.insights.map(([value, label, detail], index) => (
          <article className={`insight insight-${index + 1}`} key={value}>
            <strong>{displayText(value)}</strong>
            <div>
              <h2>{displayText(label)}</h2>
              <p>{displayText(detail)}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

export function Footer({ language }: { language: Locale }) {
  const content = copy[language];

  return (
    <footer className="site-footer">
      <p>{displayText(content.footerTrust)}</p>
      <div className="footer-meta">
        <span>{displayText(content.footerSource)}</span>
        <span>{displayText(content.footerUpdated)}</span>
        <a href={SIDE_EVENTS_FOOTER_URL} target="_blank" rel="noopener">
          {displayText(content.sideEvents)}
        </a>
        <a href="https://www.worldaic.com.cn/" target="_blank" rel="noreferrer">
          {displayText(content.footerOfficial)}
        </a>
      </div>
    </footer>
  );
}

interface AppShellProps {
  children?: ReactNode | ((language: Language) => ReactNode);
}

export function AppShell({ children }: AppShellProps) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "zh";
    try {
      const saved = window.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
      return isLocale(saved) ? saved : "zh";
    } catch {
      return "zh";
    }
  });

  useEffect(() => {
    document.documentElement.lang = languageHtmlTag(locale);
    document.documentElement.dir = languageDirection(locale);
    try {
      window.localStorage?.setItem(LANGUAGE_STORAGE_KEY, locale);
    } catch {
      // Language selection remains usable when storage is unavailable.
    }
  }, [locale]);

  return (
    <div className="app-shell">
      <Header locale={locale} onLanguageChange={setLocale} />
      <main>
        <Hero language={locale} />
        {typeof children === "function" ? children(locale) : children}
      </main>
      <Footer language={locale} />
    </div>
  );
}
