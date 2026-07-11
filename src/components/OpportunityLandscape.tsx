import { motion, useReducedMotion } from "motion/react";
import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  buildTimeHeatmap,
  summarizeCategories,
  summarizeVenues,
} from "../lib/discovery";
import { displayText } from "../lib/display";
import { CATEGORY_LABELS_EN, DATE_LABELS } from "../lib/labels";
import type {
  CategorySummary,
  TimeHeatmapCell,
  VenueSummary,
  WaicDate,
  WaicEvent,
} from "../lib/types";
import type { Language } from "./AppShell";
import type { ExplorerSelection } from "./explorerTypes";
import { LandscapeEventCarousel } from "./LandscapeEventCarousel";

interface LandscapePartProps {
  onSelect: (selection: ExplorerSelection) => void;
  activeKey?: string;
  language?: Language;
}

interface ScheduleHeatmapProps extends LandscapePartProps {
  cells: readonly TimeHeatmapCell[];
}

function heatLevel(count: number, maximum: number): number {
  if (count === 0 || maximum === 0) return 0;
  return Math.max(1, Math.ceil((count / maximum) * 5));
}

function englishEventCount(count: number): string {
  return `${count} ${count === 1 ? "event" : "events"}`;
}

export function ScheduleHeatmap({
  cells,
  onSelect,
  activeKey,
  language = "zh",
}: ScheduleHeatmapProps) {
  const maximum = Math.max(...cells.map((cell) => cell.count), 0);
  const peak = cells.reduce<TimeHeatmapCell | null>(
    (current, cell) => (!current || cell.count > current.count ? cell : current),
    null,
  );
  const activeWindowCount = cells.filter((cell) => cell.count > 0).length;
  const byDate = cells.reduce<Map<WaicDate, TimeHeatmapCell[]>>((groups, cell) => {
    const group = groups.get(cell.date) ?? [];
    group.push(cell);
    groups.set(cell.date, group);
    return groups;
  }, new Map());

  return (
    <section className="data-panel heatmap-panel" aria-labelledby="heatmap-title">
      <div className="data-panel-heading">
        <div>
          <h3 id="heatmap-title">{language === "zh" ? "时间热力" : "Time heatmap"}</h3>
          <p>
            {language === "zh"
              ? "四天按半小时查看同时进行的活动数。"
              : "Concurrent events across four days in half-hour windows."}
          </p>
        </div>
        <strong>
          {language === "zh"
            ? `${activeWindowCount} 个活跃时段`
            : `${activeWindowCount} active half-hour windows`}
        </strong>
      </div>
      <div className="heatmap-days">
        {[...byDate.entries()].map(([date, dateCells]) => (
          <div className="heatmap-day" key={date}>
            <div className="heatmap-day-heading">
              <h4>{DATE_LABELS[date][language]}</h4>
              <span>
                {language === "zh"
                  ? `${Math.max(...dateCells.map((cell) => cell.count))} 场峰值`
                  : `${Math.max(...dateCells.map((cell) => cell.count))} event peak`}
              </span>
            </div>
            <div className="heatmap-grid">
              {dateCells.map((cell) => {
                const label = `${DATE_LABELS[cell.date][language]} ${cell.start}-${cell.end}`;
                const labelZh = `${DATE_LABELS[cell.date].zh} ${cell.start}-${cell.end}`;
                const labelEn = `${DATE_LABELS[cell.date].en} ${cell.start}-${cell.end}`;
                const accessibleLabel =
                  language === "zh"
                    ? `${label}，${cell.count} 场活动`
                    : `${label}, ${englishEventCount(cell.count)}`;
                return (
                  <button
                    className={`heat-cell heat-${heatLevel(cell.count, maximum)}`}
                    type="button"
                    disabled={cell.count === 0}
                    aria-label={accessibleLabel}
                    aria-pressed={activeKey === `${cell.date}-${cell.start}`}
                    key={`${cell.date}-${cell.start}`}
                    onClick={() =>
                      onSelect({
                        kind: "heatmap",
                        key: `${cell.date}-${cell.start}`,
                        label: labelZh,
                        labelEn,
                        dates: [cell.date],
                        eventIds: cell.eventIds,
                      })
                    }
                  >
                    <span>{cell.start}</span>
                    <strong>{cell.count}</strong>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="chart-fallback">
        {peak
          ? language === "zh"
            ? `文字摘要：${DATE_LABELS[peak.date].zh} ${peak.start}-${peak.end} 为全程峰值，同时进行 ${peak.count} 场活动。颜色越深代表同一时段选择越多，每格仍标注具体场数。`
            : `Text summary: ${DATE_LABELS[peak.date].en} at ${peak.start}-${peak.end} is the overall peak with ${peak.count} concurrent events. Darker cells mean more choices, and every cell includes its count.`
          : language === "zh"
            ? "文字摘要：当前没有可显示的活动时段。"
            : "Text summary: no event windows are available."}
      </p>
    </section>
  );
}

interface TopicAtlasProps extends LandscapePartProps {
  categories: readonly CategorySummary[];
}

function topicClass(item: CategorySummary): string {
  if (item.count >= 30) return "topic-major";
  if (item.count >= 7) return "topic-medium";
  return "topic-small";
}

export function TopicAtlas({
  categories,
  onSelect,
  activeKey,
  language = "zh",
}: TopicAtlasProps) {
  return (
    <section className="data-panel topic-panel" aria-labelledby="topic-title">
      <div className="data-panel-heading">
        <div>
          <h3 id="topic-title">{language === "zh" ? "主题星群" : "Topic atlas"}</h3>
          <p>
            {language === "zh"
              ? "面积随真实活动数量变化，点击即可聚焦主题。"
              : "Area follows real event counts. Select a topic to focus."}
          </p>
        </div>
        <strong>
          {language === "zh"
            ? "13 个真实主题类别，共 175 场"
            : "13 real topic categories, 175 events"}
        </strong>
      </div>
      <div className="topic-atlas">
        {categories.map((item, index) => (
          <button
            className={`topic-node ${topicClass(item)} topic-tone-${index % 4}`}
            type="button"
            aria-label={
              language === "zh"
                ? `${displayText(item.category)}，${item.count} 场`
                : `${CATEGORY_LABELS_EN[item.category]}, ${englishEventCount(item.count)}`
            }
            aria-pressed={activeKey === item.category}
            key={item.category}
            onClick={() =>
              onSelect({
                kind: "category",
                key: item.category,
                label: item.category,
                labelEn: CATEGORY_LABELS_EN[item.category],
                categories: [item.category],
              })
            }
          >
            <span>
              {displayText(
                language === "zh"
                  ? item.category
                  : CATEGORY_LABELS_EN[item.category],
              )}
            </span>
            <strong>{item.count}</strong>
          </button>
        ))}
      </div>
      <p className="chart-fallback">
        {language === "zh"
          ? "文字摘要：综合论坛 45 场，大模型与AI基础 35 场，产业与工业智能化 32 场，算力与AI芯片 22 场，其余 9 类共 41 场。"
          : "Text summary: Comprehensive Forums 45, Foundation Models & AI 35, Industrial AI 32, Compute & AI Chips 22, and the remaining nine topics 41."}
      </p>
    </section>
  );
}

interface VenueConstellationProps extends LandscapePartProps {
  venues: readonly VenueSummary[];
}

export function VenueConstellation({
  venues,
  onSelect,
  activeKey,
  language = "zh",
}: VenueConstellationProps) {
  return (
    <section className="data-panel venue-panel" aria-labelledby="constellation-title">
      <div className="data-panel-heading">
        <div>
          <h3 id="constellation-title">
            {language === "zh" ? "场馆星座" : "Venue constellation"}
          </h3>
          <p>
            {language === "zh"
              ? "位置为场馆类别关系示意，不代表精确地图坐标。"
              : "Positions show venue-category relationships, not precise map coordinates."}
          </p>
        </div>
        <strong>
          {language === "zh"
            ? "7 类场馆，共 175 场"
            : "7 venue categories, 175 events"}
        </strong>
      </div>
      <div className="venue-constellation">
        {venues.map((item, index) => {
          const size = 92 + item.share * 116;
          return (
            <button
              className={`venue-node venue-node-${index + 1}`}
              type="button"
              aria-label={
                language === "zh"
                  ? `${displayText(item.zh)}，${item.count} 场，示意位置`
                  : `${displayText(item.en)}, ${englishEventCount(item.count)}, schematic position`
              }
              aria-pressed={activeKey === item.venueId}
              key={item.venueId}
              style={{ "--venue-size": `${size}px` } as CSSProperties}
              onClick={() =>
                onSelect({
                  kind: "venue",
                  key: item.venueId,
                  label: item.zh,
                  labelEn: item.en,
                  venues: [item.venueId],
                })
              }
            >
              <span>
                {displayText(language === "zh" ? item.zh : item.en)}
              </span>
              <strong>{item.count}</strong>
            </button>
          );
        })}
      </div>
      <p className="chart-fallback">
        {language === "zh"
          ? "文字摘要：世博中心 91 场，世博展览馆 28 场，西岸国际会展中心 25 场，酒店、张江与其他场馆共 31 场。"
          : "Text summary: Expo Center 91, Expo Exhibition and Convention Center 28, West Bund 25, and hotels, Zhangjiang, and other venues 31."}
      </p>
    </section>
  );
}

interface OpportunityLandscapeProps {
  events: readonly WaicEvent[];
  onSelect: (selection: ExplorerSelection) => void;
  activeSelection?: ExplorerSelection | null;
  language?: Language;
}

export function OpportunityLandscape({
  events,
  onSelect,
  activeSelection,
  language = "zh",
}: OpportunityLandscapeProps) {
  const reducedMotion = useReducedMotion();
  const [carouselSelection, setCarouselSelection] =
    useState<ExplorerSelection | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const cells = useMemo(() => buildTimeHeatmap(events), [events]);
  const categories = useMemo(() => summarizeCategories(events), [events]);
  const venues = useMemo(() => summarizeVenues(events), [events]);
  const carouselEvents = useMemo(() => {
    if (!carouselSelection) return [];
    const allowedIds = carouselSelection.eventIds
      ? new Set(carouselSelection.eventIds)
      : null;
    return events.filter((event) => {
      if (allowedIds && !allowedIds.has(event.id)) return false;
      if (
        carouselSelection.categories &&
        !carouselSelection.categories.includes(event.category)
      ) return false;
      if (
        carouselSelection.venues &&
        !carouselSelection.venues.includes(event.venue.id)
      ) return false;
      if (
        carouselSelection.dates &&
        !carouselSelection.dates.includes(event.date)
      ) return false;
      return true;
    });
  }, [carouselSelection, events]);

  const inspectSelection = useCallback(
    (selection: ExplorerSelection) => {
      onSelect(selection);
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      setCarouselSelection(selection);
    },
    [onSelect],
  );

  const closeCarousel = useCallback(() => {
    setCarouselSelection(null);
    queueMicrotask(() => returnFocusRef.current?.focus());
  }, []);
  return (
    <motion.section
      className="page-section landscape-section"
      id="landscape"
      aria-labelledby="landscape-title"
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <header className="section-heading">
        <h2 id="landscape-title">
          {language === "zh" ? "先看哪里机会最密集" : "See where opportunity concentrates"}
        </h2>
        <p>
          {language === "zh"
            ? "从时间、主题、场馆三个维度先缩小选择，再进入完整日程。"
            : "Narrow the program by time, topic, and venue before reviewing the schedule."}
        </p>
      </header>
      <ScheduleHeatmap
        cells={cells}
        onSelect={inspectSelection}
        activeKey={activeSelection?.key}
        language={language}
      />
      <div className="landscape-secondary-grid">
        <TopicAtlas
          categories={categories}
          onSelect={inspectSelection}
          activeKey={activeSelection?.key}
          language={language}
        />
        <VenueConstellation
          venues={venues}
          onSelect={inspectSelection}
          activeKey={activeSelection?.key}
          language={language}
        />
      </div>
      {carouselSelection && carouselEvents.length > 0 ? (
        <LandscapeEventCarousel
          key={`${carouselSelection.kind}-${carouselSelection.key}`}
          events={carouselEvents}
          label={displayText(
            language === "zh"
              ? carouselSelection.label
              : carouselSelection.labelEn ?? carouselSelection.label,
          )}
          language={language}
          onClose={closeCarousel}
        />
      ) : null}
    </motion.section>
  );
}
