import {
  CaretLeft,
  CaretRight,
  Clock,
  MapPin,
  Pause,
  Play,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

import { displayText } from "../lib/display";
import { sourceText } from "../lib/i18n";
import { categoryLabel, dateLabel, venueLabel } from "../lib/labels";
import type { EventCategory, VenueId, WaicDate, WaicEvent } from "../lib/types";
import type { Language } from "./AppShell";

const AUTO_ADVANCE_MS = 5_000;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const copy = {
  zh: {
    activities: "的活动",
    close: "关闭活动轮播",
    previous: "上一个活动",
    next: "下一个活动",
    pause: "暂停自动播放",
    play: "继续自动播放",
    time: "时间",
    venue: "场馆",
    location: "地点",
    viewSchedule: "在完整日程中查看",
    filterDate: "按日期筛选",
    filterVenue: "按场馆筛选",
    filterTopic: "按主题筛选",
    allDates: "全部日期",
    allVenues: "全部场馆",
    allTopics: "全部主题",
    noResults: "没有符合这组筛选条件的活动",
    result: (count: number) => `筛选结果：${count} 场活动`,
    count: (count: number) => `共 ${count} 场活动`,
  },
  en: {
    activities: " events",
    close: "Close activity carousel",
    previous: "Previous event",
    next: "Next event",
    pause: "Pause autoplay",
    play: "Resume autoplay",
    time: "Time",
    venue: "Venue",
    location: "Location",
    viewSchedule: "View in full schedule",
    filterDate: "Filter by date",
    filterVenue: "Filter by venue",
    filterTopic: "Filter by topic",
    allDates: "All dates",
    allVenues: "All venues",
    allTopics: "All topics",
    noResults: "No events match these filters",
    result: (count: number) => `${count} matching ${count === 1 ? "event" : "events"}`,
    count: (count: number) => `${count} ${count === 1 ? "event" : "events"}`,
  },
  ja: {
    activities: "のイベント", close: "イベント一覧を閉じる", previous: "前のイベント", next: "次のイベント", pause: "自動再生を一時停止", play: "自動再生を再開", time: "時間", venue: "会場", location: "場所", viewSchedule: "全日程で見る", filterDate: "日付で絞り込む", filterVenue: "会場で絞り込む", filterTopic: "テーマで絞り込む", allDates: "すべての日付", allVenues: "すべての会場", allTopics: "すべてのテーマ", noResults: "条件に一致するイベントはありません", result: (count: number) => `絞り込み結果：${count}件`, count: (count: number) => `全${count}件`,
  },
  ko: {
    activities: " 행사", close: "행사 목록 닫기", previous: "이전 행사", next: "다음 행사", pause: "자동 재생 일시정지", play: "자동 재생 계속", time: "시간", venue: "장소", location: "상세 위치", viewSchedule: "전체 일정에서 보기", filterDate: "날짜로 필터", filterVenue: "장소로 필터", filterTopic: "주제로 필터", allDates: "모든 날짜", allVenues: "모든 장소", allTopics: "모든 주제", noResults: "조건에 맞는 행사가 없습니다", result: (count: number) => `필터 결과: ${count}개 행사`, count: (count: number) => `총 ${count}개 행사`,
  },
  fr: {
    activities: " : événements", close: "Fermer la liste", previous: "Événement précédent", next: "Événement suivant", pause: "Mettre le défilement en pause", play: "Reprendre le défilement", time: "Horaire", venue: "Lieu", location: "Emplacement", viewSchedule: "Voir dans le programme", filterDate: "Filtrer par date", filterVenue: "Filtrer par lieu", filterTopic: "Filtrer par thème", allDates: "Toutes les dates", allVenues: "Tous les lieux", allTopics: "Tous les thèmes", noResults: "Aucun événement ne correspond", result: (count: number) => `${count} événement${count > 1 ? "s" : ""} correspondant${count > 1 ? "s" : ""}`, count: (count: number) => `${count} événement${count > 1 ? "s" : ""}`,
  },
  de: {
    activities: " Veranstaltungen", close: "Veranstaltungsliste schließen", previous: "Vorherige Veranstaltung", next: "Nächste Veranstaltung", pause: "Automatik pausieren", play: "Automatik fortsetzen", time: "Zeit", venue: "Ort", location: "Genauer Ort", viewSchedule: "Im Programm ansehen", filterDate: "Nach Datum filtern", filterVenue: "Nach Ort filtern", filterTopic: "Nach Thema filtern", allDates: "Alle Daten", allVenues: "Alle Orte", allTopics: "Alle Themen", noResults: "Keine passenden Veranstaltungen", result: (count: number) => `${count} passende Veranstaltungen`, count: (count: number) => `${count} Veranstaltungen`,
  },
  es: {
    activities: ": actividades", close: "Cerrar lista de actividades", previous: "Actividad anterior", next: "Actividad siguiente", pause: "Pausar reproducción", play: "Reanudar reproducción", time: "Hora", venue: "Recinto", location: "Ubicación", viewSchedule: "Ver en el programa", filterDate: "Filtrar por fecha", filterVenue: "Filtrar por recinto", filterTopic: "Filtrar por tema", allDates: "Todas las fechas", allVenues: "Todos los recintos", allTopics: "Todos los temas", noResults: "No hay actividades que coincidan", result: (count: number) => `${count} actividades coincidentes`, count: (count: number) => `${count} actividades`,
  },
  ar: {
    activities: " من الفعاليات", close: "إغلاق قائمة الفعاليات", previous: "الفعالية السابقة", next: "الفعالية التالية", pause: "إيقاف العرض التلقائي", play: "متابعة العرض التلقائي", time: "الوقت", venue: "المكان", location: "الموقع", viewSchedule: "عرض في الجدول الكامل", filterDate: "تصفية حسب التاريخ", filterVenue: "تصفية حسب المكان", filterTopic: "تصفية حسب الموضوع", allDates: "كل التواريخ", allVenues: "كل الأماكن", allTopics: "كل الموضوعات", noResults: "لا توجد فعاليات مطابقة", result: (count: number) => `${count} فعالية مطابقة`, count: (count: number) => `${count} فعالية`,
  },
} as const;

interface LandscapeEventCarouselProps {
  events: readonly WaicEvent[];
  label: string;
  language: Language;
  onClose: () => void;
}

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => element.getAttribute("aria-hidden") !== "true");
}

function makeBackgroundInert(dialogLayer: HTMLElement): () => void {
  const changedElements: Array<{
    element: HTMLElement;
    hadInert: boolean;
    ariaHidden: string | null;
  }> = [];
  let current: HTMLElement | null = dialogLayer;

  while (current && current !== document.body) {
    const parentElement: HTMLElement | null = current.parentElement;
    if (!parentElement) break;
    Array.from(parentElement.children).forEach((sibling) => {
      if (sibling === current || !(sibling instanceof HTMLElement)) return;
      changedElements.push({
        element: sibling,
        hadInert: sibling.hasAttribute("inert"),
        ariaHidden: sibling.getAttribute("aria-hidden"),
      });
      sibling.setAttribute("inert", "");
      sibling.setAttribute("aria-hidden", "true");
    });
    current = parentElement;
  }

  return () => {
    changedElements.forEach(({ element, hadInert, ariaHidden }) => {
      if (!hadInert) element.removeAttribute("inert");
      if (ariaHidden === null) element.removeAttribute("aria-hidden");
      else element.setAttribute("aria-hidden", ariaHidden);
    });
  };
}

export function LandscapeEventCarousel({
  events,
  label,
  language,
  onClose,
}: LandscapeEventCarouselProps) {
  const content = copy[language];
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [selectedDate, setSelectedDate] = useState<WaicDate | "">("");
  const [selectedVenue, setSelectedVenue] = useState<VenueId | "">("");
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "">("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dateOptions = useMemo(
    () => [...new Set(events.map((event) => event.date))].sort(),
    [events],
  );
  const venueOptions = useMemo(
    () => [...new Map(events.map((event) => [event.venue.id, event.venue])).values()],
    [events],
  );
  const categoryOptions = useMemo(
    () => [...new Set(events.map((event) => event.category))],
    [events],
  );
  const filteredEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          (!selectedDate || event.date === selectedDate) &&
          (!selectedVenue || event.venue.id === selectedVenue) &&
          (!selectedCategory || event.category === selectedCategory),
      ),
    [events, selectedCategory, selectedDate, selectedVenue],
  );
  const activeEvent = filteredEvents[activeIndex];
  const autoplaying = filteredEvents.length > 1 && !reducedMotion && !manualPaused;
  const dialogTitle = `${label}${content.activities}`;

  const move = useCallback(
    (direction: 1 | -1) => {
      if (filteredEvents.length === 0) return;
      setActiveIndex(
        (index) =>
          (index + direction + filteredEvents.length) % filteredEvents.length,
      );
    },
    [filteredEvents.length],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [selectedCategory, selectedDate, selectedVenue]);

  useEffect(() => {
    if (!autoplaying) return;
    const timer = window.setInterval(() => move(1), AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [autoplaying, move]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const restoreBackground = backdropRef.current
      ? makeBackgroundInert(backdropRef.current)
      : () => undefined;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = focusableElements(dialogRef.current);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      restoreBackground();
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  if (events.length === 0) return null;

  const title = activeEvent ? displayText(sourceText(activeEvent.title, language)) : "";
  const secondaryTitle = activeEvent
    ? displayText(language === "zh" ? activeEvent.title.en : activeEvent.title.zh)
    : "";
  const category = activeEvent
    ? displayText(
        categoryLabel(activeEvent.category, language),
      )
    : "";

  const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="landscape-carousel-backdrop"
      ref={backdropRef}
      onMouseDown={closeFromBackdrop}
    >
      <motion.section
        className="landscape-carousel"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="landscape-carousel-title"
        initial={reducedMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="landscape-carousel-heading">
          <div>
            <p>{content.count(events.length)}</p>
            <h2 id="landscape-carousel-title">{dialogTitle}</h2>
          </div>
          <button
            className="detail-close"
            type="button"
            ref={closeButtonRef}
            aria-label={content.close}
            onClick={onClose}
          >
            <X aria-hidden="true" weight="bold" />
          </button>
        </header>

        <div className="landscape-carousel-filters">
          <label>
            <span>{content.filterDate}</span>
            <select
              aria-label={content.filterDate}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value as WaicDate | "")}
            >
              <option value="">{content.allDates}</option>
              {dateOptions.map((date) => (
                <option value={date} key={date}>{dateLabel(date, language)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{content.filterVenue}</span>
            <select
              aria-label={content.filterVenue}
              value={selectedVenue}
              onChange={(event) => setSelectedVenue(event.target.value as VenueId | "")}
            >
              <option value="">{content.allVenues}</option>
              {venueOptions.map((venue) => (
                <option value={venue.id} key={venue.id}>
                  {venueLabel(venue.id, language)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{content.filterTopic}</span>
            <select
              aria-label={content.filterTopic}
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value as EventCategory | "")}
            >
              <option value="">{content.allTopics}</option>
              {categoryOptions.map((item) => (
                <option value={item} key={item}>
                  {categoryLabel(item, language)}
                </option>
              ))}
            </select>
          </label>
          <output className="landscape-carousel-filter-result" aria-live="polite">
            {content.result(filteredEvents.length)}
          </output>
        </div>

        <div className="landscape-carousel-stage" aria-live="polite" aria-atomic="true">
          {activeEvent ? <AnimatePresence mode="wait" initial={false}>
            <motion.article
              className="landscape-event-card"
              key={activeEvent.id}
              initial={reducedMotion ? false : { opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, x: -28 }}
              transition={{ duration: 0.22 }}
            >
              <div className="landscape-event-kicker">
                <span>{category}</span>
              </div>
              <h3>{title}</h3>
              {secondaryTitle !== title ? <p>{secondaryTitle}</p> : null}
              <dl className="landscape-event-facts">
                <div>
                  <dt><Clock aria-hidden="true" weight="bold" />{content.time}</dt>
                  <dd>{dateLabel(activeEvent.date, language)} {activeEvent.startTime}-{activeEvent.endTime}</dd>
                </div>
                <div>
                  <dt><MapPin aria-hidden="true" weight="fill" />{content.venue}</dt>
                  <dd>{venueLabel(activeEvent.venue.id, language)}</dd>
                </div>
                <div>
                  <dt>{content.location}</dt>
                  <dd>{displayText(sourceText(activeEvent.location, language))}</dd>
                </div>
              </dl>
            </motion.article>
          </AnimatePresence> : <p className="landscape-carousel-empty">{content.noResults}</p>}
        </div>

        <footer className="landscape-carousel-controls">
          <div className="landscape-carousel-pager">
            <button
              type="button"
              aria-label={content.previous}
              disabled={filteredEvents.length < 2}
              onFocus={() => setManualPaused(true)}
              onClick={() => {
                setManualPaused(true);
                move(-1);
              }}
            >
              <CaretLeft aria-hidden="true" weight="bold" />
            </button>
            <button
              type="button"
              aria-label={autoplaying ? content.pause : content.play}
              disabled={filteredEvents.length < 2}
              onClick={() => setManualPaused((paused) => !paused)}
            >
              {autoplaying ? (
                <Pause aria-hidden="true" weight="fill" />
              ) : (
                <Play aria-hidden="true" weight="fill" />
              )}
            </button>
            <button
              type="button"
              aria-label={content.next}
              disabled={filteredEvents.length < 2}
              onFocus={() => setManualPaused(true)}
              onClick={() => {
                setManualPaused(true);
                move(1);
              }}
            >
              <CaretRight aria-hidden="true" weight="bold" />
            </button>
            <output className="landscape-carousel-position" aria-live="polite">
              {filteredEvents.length === 0 ? 0 : activeIndex + 1} / {filteredEvents.length}
            </output>
          </div>
          <div className="landscape-carousel-progress" aria-hidden="true">
            <span style={{ width: `${filteredEvents.length === 0 ? 0 : ((activeIndex + 1) / filteredEvents.length) * 100}%` }} />
          </div>
          <a className="text-button" href="#schedule" onClick={onClose}>
            {content.viewSchedule}
          </a>
        </footer>
      </motion.section>
    </div>,
    document.body,
  );
}
