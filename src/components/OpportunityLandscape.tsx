import { motion, useReducedMotion } from "motion/react";
import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  buildTimeHeatmap,
  summarizeCategories,
  summarizeVenues,
} from "../lib/discovery";
import { displayText } from "../lib/display";
import { CATEGORY_LABELS_EN, DATE_LABELS, categoryLabel, dateLabel, venueLabel } from "../lib/labels";
import { LANDSCAPE_COPY } from "../lib/uiCopy";
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

function localizedSelectionLabel(
  selection: ExplorerSelection,
  language: Language,
): string {
  if (selection.kind === "category" && selection.categories?.[0]) {
    return categoryLabel(selection.categories[0], language);
  }
  if (selection.kind === "venue" && selection.venues?.[0]) {
    return venueLabel(selection.venues[0], language);
  }
  if (language === "zh") return selection.label;
  if (selection.kind === "heatmap" && selection.dates?.[0]) {
    const timeRange = (selection.labelEn ?? selection.label).split(" ").at(-1);
    return `${dateLabel(selection.dates[0], language)} ${timeRange ?? ""}`.trim();
  }
  return selection.labelEn ?? selection.label;
}

export function ScheduleHeatmap({
  cells,
  onSelect,
  activeKey,
  language = "zh",
}: ScheduleHeatmapProps) {
  const content = LANDSCAPE_COPY[language];
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
          <h3 id="heatmap-title">{content.heatTitle}</h3>
          <p>{content.heatIntro}</p>
        </div>
        <strong>
          {content.activeWindows(activeWindowCount)}
        </strong>
      </div>
      <div className="heatmap-days">
        {[...byDate.entries()].map(([date, dateCells]) => (
          <div className="heatmap-day" key={date}>
            <div className="heatmap-day-heading">
              <h4>{dateLabel(date, language)}</h4>
              <span>
                {content.eventPeak(Math.max(...dateCells.map((cell) => cell.count)))}
              </span>
            </div>
            <div className="heatmap-grid">
              {dateCells.map((cell) => {
                const label = `${dateLabel(cell.date, language)} ${cell.start}-${cell.end}`;
                const labelZh = `${DATE_LABELS[cell.date].zh} ${cell.start}-${cell.end}`;
                const labelEn = `${DATE_LABELS[cell.date].en} ${cell.start}-${cell.end}`;
                const separator = language === "zh" ? "，" : ", ";
                const accessibleLabel = `${label}${separator}${content.events(cell.count)}`;
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
          ? content.heatSummary(dateLabel(peak.date, language), peak.start, peak.end, peak.count)
          : content.noWindows}
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
  const content = LANDSCAPE_COPY[language];
  return (
    <section className="data-panel topic-panel" aria-labelledby="topic-title">
      <div className="data-panel-heading">
        <div>
          <h3 id="topic-title">{content.topicTitle}</h3>
          <p>{content.topicIntro}</p>
        </div>
        <strong>
          {content.topicStats}
        </strong>
      </div>
      <div className="topic-atlas">
        {categories.map((item, index) => (
          <button
            className={`topic-node ${topicClass(item)} topic-tone-${index % 4}`}
            type="button"
            aria-label={`${categoryLabel(item.category, language)}${language === "zh" ? "，" : ", "}${language === "zh" ? `${item.count} 场` : content.events(item.count)}`}
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
              {displayText(categoryLabel(item.category, language))}
            </span>
            <strong>{item.count}</strong>
          </button>
        ))}
      </div>
      <p className="chart-fallback">
        {content.topicSummary}
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
  const content = LANDSCAPE_COPY[language];
  return (
    <section className="data-panel venue-panel" aria-labelledby="constellation-title">
      <div className="data-panel-heading">
        <div>
          <h3 id="constellation-title">{content.venueTitle}</h3>
          <p>{content.venueIntro}</p>
        </div>
        <strong>
          {content.venueStats}
        </strong>
      </div>
      <div className="venue-constellation">
        {venues.map((item, index) => {
          const size = 92 + item.share * 116;
          return (
            <button
              className={`venue-node venue-node-${index + 1}`}
              type="button"
              aria-label={`${language === "en" ? item.en : venueLabel(item.venueId, language)}${language === "zh" ? "，" : ", "}${language === "zh" ? `${item.count} 场` : content.events(item.count)}${language === "zh" ? "，" : ", "}${content.schematic}`}
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
                {displayText(language === "en" ? item.en : venueLabel(item.venueId, language))}
              </span>
              <strong>{item.count}</strong>
            </button>
          );
        })}
      </div>
      <p className="chart-fallback">
        {content.venueSummary}
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
  const content = LANDSCAPE_COPY[language];
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
        <h2 id="landscape-title">{content.heading}</h2>
        <p>{content.intro}</p>
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
          label={displayText(localizedSelectionLabel(carouselSelection, language))}
          language={language}
          onClose={closeCarousel}
        />
      ) : null}
    </motion.section>
  );
}
