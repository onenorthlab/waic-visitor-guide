import {
  Buildings,
  Bus,
  Clock,
  Ticket,
  WarningCircle,
} from "@phosphor-icons/react";

import type { Language } from "./AppShell";
import { displayText } from "../lib/display";
import { contentLanguage } from "../lib/i18n";

const copy = {
  zh: {
    eyebrow: "场馆移动指南",
    heading: "在四个核心场馆区之间聪明移动",
    intro:
      "先按内容价值选主场，再把跨馆移动视为稀缺时间。下面的定位、开放边界与接驳频率，帮助你减少无效折返。",
    venueLabel: "四个核心场馆定位",
    venues: [
      {
        title: "世博中心前沿思想策源地",
        detail: "高密度论坛主场，适合追踪前沿议题与产业判断。",
      },
      {
        title: "世博展览馆全景应用展示窗",
        detail: "集中观察技术落地、产品体验与行业应用。",
      },
      {
        title: "徐汇西岸未来科技体验场",
        detail: "适合沉浸体验、城市科技与跨界创新探索。",
      },
      {
        title: "张江科学会堂智能算力芯引擎",
        detail: "聚焦算力、芯片、基础设施与硬科技生态。",
      },
    ],
    shuttleHeading: "免费接驳节奏",
    shuttleIntro: "官方接驳班次会随现场交通调整，出发前请再次确认站点信息。",
    shuttles: [
      "西岸↔张江约10分钟一班",
      "西岸↔世博展览馆约15分钟一班",
      "世博展览馆↔张江约15分钟一班",
    ],
    lastShuttle: "末班18:30",
    buffer: "路线中的换馆时间是建议缓冲，不是官方车程。",
    accessHeading: "公众开放时间",
    opening: [
      "7月17日上午不开放",
      "7月17日 13:30-17:00 仅受邀",
      "7月18-19日 9:00-17:00",
      "7月20日 9:00-16:00",
    ],
    ticketHeading: "先确认你的入场权益",
    ticketLead: "",
    ticket:
      "论坛票与展览票权益不同。论坛活动以单场报名或邀请资格为准，展览入场以对应日期门票为准。",
    verify: "最终开放安排与接驳班次以 WAIC 官网和 Hi WAIC APP 当日发布为准。",
  },
  en: {
    eyebrow: "Venue movement guide",
    heading: "Move between four core venue zones",
    intro:
      "Choose a primary venue for its content value, then treat every transfer as scarce time. Use these venue roles, access windows, and shuttle intervals to avoid low-value backtracking.",
    venueLabel: "Four core venue roles",
    venues: [
      {
        title: "Expo Center, frontier ideas hub",
        detail: "The main forum cluster for frontier topics and industry perspectives.",
      },
      {
        title: "World Expo Exhibition Center, panoramic application showcase",
        detail: "A concentrated view of deployed technology, products, and industry use cases.",
      },
      {
        title: "Xuhui West Bund, future technology experience zone",
        detail: "Best for immersive experiences, urban technology, and cross-sector innovation.",
      },
      {
        title: "Zhangjiang Science Hall, intelligent computing and chips engine",
        detail: "Focused on compute, chips, infrastructure, and hard-technology ecosystems.",
      },
    ],
    shuttleHeading: "Free shuttle rhythm",
    shuttleIntro:
      "Official intervals may change with traffic conditions. Confirm the stop before you leave.",
    shuttles: [
      "West Bund ↔ Zhangjiang about every 10 min",
      "West Bund ↔ World Expo Exhibition Center about every 15 min",
      "World Expo Exhibition Center ↔ Zhangjiang about every 15 min",
    ],
    lastShuttle: "Last shuttle 18:30",
    buffer: "Transfer time in your route is a planning buffer, not an official journey time.",
    accessHeading: "Public opening hours",
    opening: [
      "Morning of July 17 closed to the public",
      "July 17, 13:30-17:00 invited guests only",
      "July 18-19, 9:00-17:00",
      "July 20, 9:00-16:00",
    ],
    ticketHeading: "Confirm your access first",
    ticketLead: "Forum and exhibition tickets grant different access.",
    ticket:
      "Forum sessions require registration for that session or an invitation. Exhibition entry requires a ticket valid for the relevant date.",
    verify:
      "Follow the WAIC website and Hi WAIC APP for final opening and shuttle updates on the day.",
  },
} as const;

export function VenueGuide({ language }: { language: Language }) {
  const content = copy[contentLanguage(language)];

  return (
    <section
      className="page-section venue-guide"
      id="venues"
      aria-labelledby="venue-guide-title"
    >
      <header className="section-heading venue-guide-heading">
        <p className="venue-guide-eyebrow">
          <Buildings aria-hidden="true" weight="duotone" />
          {displayText(content.eyebrow)}
        </p>
        <h2 id="venue-guide-title">{displayText(content.heading)}</h2>
        <p>{displayText(content.intro)}</p>
      </header>

      <div className="venue-guide-layout">
        <aside className="venue-index" aria-hidden="true">
          <span>04</span>
          <small>{displayText(content.venueLabel)}</small>
        </aside>
        <ol className="venue-position-list" aria-label={displayText(content.venueLabel)}>
          {content.venues.map((venue, index) => (
            <li key={venue.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{displayText(venue.title)}</strong>
                <p>{displayText(venue.detail)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="venue-logistics-grid">
        <article className="shuttle-panel">
          <header>
            <Bus aria-hidden="true" weight="duotone" />
            <div>
              <h3>{displayText(content.shuttleHeading)}</h3>
              <p>{displayText(content.shuttleIntro)}</p>
            </div>
          </header>
          <div className="shuttle-axis">
            {content.shuttles.map((shuttle, index) => (
              <div className="shuttle-leg" key={shuttle}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <strong>{displayText(shuttle)}</strong>
              </div>
            ))}
          </div>
          <div className="shuttle-last">
            <Clock aria-hidden="true" weight="bold" />
            <strong>{displayText(content.lastShuttle)}</strong>
          </div>
          <p className="venue-buffer-note">
            <WarningCircle aria-hidden="true" weight="fill" />
            {displayText(content.buffer)}
          </p>
        </article>

        <div className="venue-access-stack">
          <article className="access-panel">
            <h3>{displayText(content.accessHeading)}</h3>
            <ul>
              {content.opening.map((window) => (
                <li key={window}>{displayText(window)}</li>
              ))}
            </ul>
          </article>
          <article className="ticket-panel">
            <Ticket aria-hidden="true" weight="duotone" />
            <div>
              <h3>{displayText(content.ticketHeading)}</h3>
              {language === "zh" ? (
                <p>{displayText(content.ticket)}</p>
              ) : (
                <>
                  <strong>{displayText(content.ticketLead)}</strong>
                  <p>{displayText(content.ticket)}</p>
                </>
              )}
              <small>{displayText(content.verify)}</small>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
