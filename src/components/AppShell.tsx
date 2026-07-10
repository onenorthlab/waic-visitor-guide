import {
  ArrowDownRight,
  Moon,
  Sun,
  Translate,
} from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";

export type Language = "zh" | "en";
type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "waic-visitor-guide:theme";

const copy = {
  zh: {
    navLabel: "主导航",
    brand: "WAIC 2026 访客指南",
    independent: "独立访客规划工具",
    nav: [
      ["总览", "#overview"],
      ["机会全景", "#landscape"],
      ["路线工作台", "#planner"],
      ["全部日程", "#schedule"],
      ["场馆指南", "#venues"],
    ],
    heading: "175 场论坛，排成你的高收益路线",
    subcopy: "按目标、时间与场馆，生成无冲突、少折返的 WAIC 参访计划。",
    primary: "开始规划",
    secondary: "查看全景",
    terrainAlt: "WAIC 2026 活动密度地形图",
    switchLanguage: "Switch to English",
    insightsLabel: "数据洞察",
    insights: [
      ["129/175", "黄金两日", "7 月 18-19 日活动最密集"],
      ["112/175", "三大赛道", "综合、大模型、产业智能"],
      ["91/175", "世博中心", "论坛最集中的核心场馆"],
    ],
  },
  en: {
    navLabel: "Primary navigation",
    brand: "WAIC 2026 Visitor Guide",
    independent: "Independent visitor planning tool",
    nav: [
      ["Overview", "#overview"],
      ["Landscape", "#landscape"],
      ["Route planner", "#planner"],
      ["Schedule", "#schedule"],
      ["Venue guide", "#venues"],
    ],
    heading: "Turn 175 forums into your highest-yield route",
    subcopy: "Build a conflict-free WAIC plan around your goals, time, and venues.",
    primary: "Plan my route",
    secondary: "View landscape",
    terrainAlt: "WAIC 2026 event density terrain",
    switchLanguage: "切换中文",
    insightsLabel: "Data insights",
    insights: [
      ["129/175", "Peak two days", "July 18-19 hold the densest schedule"],
      ["112/175", "Three leading tracks", "General, foundation models, industry AI"],
      ["91/175", "Expo Center", "The forum program's main hub"],
    ],
  },
} as const;

function preferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage?.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

interface HeaderProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function Header({ language, onLanguageChange }: HeaderProps) {
  const content = copy[language];
  const [theme, setTheme] = useState<Theme>(preferredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage?.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label={content.navLabel}>
        <a className="wordmark" href="#overview" aria-label={content.brand}>
          <span>WAIC 2026</span>
          <small>{language === "zh" ? "访客指南" : "VISITOR GUIDE"}</small>
        </a>
        <div className="nav-links">
          {content.nav.map(([label, href]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
        </div>
        <div className="nav-actions">
          <button
            className="icon-button language-toggle"
            type="button"
            aria-label={content.switchLanguage}
            onClick={() => onLanguageChange(language === "zh" ? "en" : "zh")}
          >
            <Translate aria-hidden="true" weight="bold" />
            <span>{language === "zh" ? "中 / EN" : "EN / 中"}</span>
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label={theme === "dark" ? "切换浅色主题" : "切换深色主题"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
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

export function Hero({ language }: { language: Language }) {
  const content = copy[language];

  return (
    <>
      <section className="hero" id="overview" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">{content.independent}</p>
          <h1 id="hero-title">{content.heading}</h1>
          <p className="hero-subcopy">{content.subcopy}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#planner">
              {content.primary}
              <ArrowDownRight aria-hidden="true" weight="bold" />
            </a>
            <a className="button button-secondary" href="#landscape">
              {content.secondary}
            </a>
          </div>
        </div>
        <figure className="hero-visual">
          <img
            src="/assets/waic-data-terrain.webp"
            alt={content.terrainAlt}
            width="1774"
            height="887"
            fetchPriority="high"
            decoding="async"
          />
        </figure>
      </section>
      <section className="insight-spine" aria-label={content.insightsLabel}>
        {content.insights.map(([value, label, detail], index) => (
          <article className={`insight insight-${index + 1}`} key={value}>
            <strong>{value}</strong>
            <div>
              <h2>{label}</h2>
              <p>{detail}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <p>
        WaytoAGI 制作的独立访客规划工具。活动时间与入场规则请以 WAIC 官网和 Hi WAIC APP 最新发布为准。
      </p>
      <div className="footer-meta">
        <span>源表：上海 WAIC 完整会议活动情况</span>
        <span>数据更新：2026-07-10</span>
        <a href="https://www.worldaic.com.cn/" target="_blank" rel="noreferrer">
          WAIC 官网
        </a>
      </div>
    </footer>
  );
}

interface AppShellProps {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [language, setLanguage] = useState<Language>("zh");

  return (
    <div className="app-shell">
      <Header language={language} onLanguageChange={setLanguage} />
      <main>
        <Hero language={language} />
        {children}
      </main>
      <Footer />
    </div>
  );
}
