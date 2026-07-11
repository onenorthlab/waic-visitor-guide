import {
  ArrowDown,
  ArrowSquareOut,
  Check,
  Clock,
  MagnifyingGlass,
  MapPin,
  Plus,
  X,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import { filterEvents, summarizeVenues } from "../lib/discovery";
import { displayText } from "../lib/display";
import { sourceText } from "../lib/i18n";
import { categoryLabel, dateLabel, venueLabel } from "../lib/labels";
import { DEFAULT_AVAILABILITY } from "../lib/plannerDefaults";
import {
  WAIC_CATEGORIES,
  WAIC_DATES,
  type EventCategory,
  type PlannerState,
  type VenueId,
  type WaicDate,
  type WaicEvent,
} from "../lib/types";
import type { Language } from "./AppShell";
import type { ExplorerSelection } from "./explorerTypes";

const PAGE_SIZE = 24;

const copy = {
  zh: {
    title: "在 175 场活动里精确筛选",
    intro: "搜索中英文标题，并组合日期、类别与场馆。首屏只展开 24 条，保持现场决策清晰。",
    search: "搜索活动",
    searchPlaceholder: "搜索论坛、地点或英文关键词",
    date: "按日期筛选",
    category: "按类别筛选",
    venue: "按场馆筛选",
    allDates: "全部日期",
    allCategories: "全部类别",
    allVenues: "全部场馆",
    resultCount: (count: number) => `${count} 场活动符合当前筛选`,
    pagination: (shown: number, total: number) => `已显示 ${shown}/${total} 场`,
    view: "查看活动",
    more: "显示更多活动",
    empty: "没有匹配的活动",
    emptyHelp: "换一个关键词，或清除日期、类别与场馆筛选。",
    clear: "清除筛选",
    close: "关闭活动详情",
    time: "时间",
    location: "精确地点",
    venueLabel: "场馆",
    categoryLabel: "类别",
    add: "加入路线",
    remove: "移出路线",
    official: "官方注册页",
    amap: "在高德地图搜索",
  },
  en: {
    title: "Filter all 175 events precisely",
    intro: "Search Chinese or English titles, then combine date, topic, and venue filters. Only 24 rows open first.",
    search: "Search events",
    searchPlaceholder: "Search forums, places, or English keywords",
    date: "Filter by date",
    category: "Filter by category",
    venue: "Filter by venue",
    allDates: "All dates",
    allCategories: "All categories",
    allVenues: "All venues",
    resultCount: (count: number) =>
      `${count} ${count === 1 ? "event" : "events"} match the filters`,
    pagination: (shown: number, total: number) =>
      `Showing ${shown}/${total} ${total === 1 ? "event" : "events"}`,
    view: "View event",
    more: "Show more events",
    empty: "No matching events",
    emptyHelp: "Try another keyword, or clear the date, topic, and venue filters.",
    clear: "Clear filters",
    close: "Close event details",
    time: "Time",
    location: "Exact location",
    venueLabel: "Venue",
    categoryLabel: "Category",
    add: "Add to route",
    remove: "Remove from route",
    official: "Official registration",
    amap: "Search in Amap",
  },
  ja: {
    title: "175件のイベントを詳しく絞り込む", intro: "中国語・英語のタイトルを検索し、日付、テーマ、会場を組み合わせて絞り込めます。", search: "イベントを検索", searchPlaceholder: "フォーラム、場所、英語キーワードを検索", date: "日付で絞り込む", category: "テーマで絞り込む", venue: "会場で絞り込む", allDates: "すべての日付", allCategories: "すべてのテーマ", allVenues: "すべての会場", resultCount: (count: number) => `${count}件が条件に一致`, pagination: (shown: number, total: number) => `${shown}/${total}件を表示`, view: "詳細を見る", more: "さらに表示", empty: "一致するイベントはありません", emptyHelp: "別のキーワードを試すか、絞り込みを解除してください。", clear: "絞り込みを解除", close: "詳細を閉じる", time: "時間", location: "詳細場所", venueLabel: "会場", categoryLabel: "テーマ", add: "ルートに追加", remove: "ルートから削除", official: "公式登録ページ", amap: "高徳地図で検索",
  },
  ko: {
    title: "175개 행사를 정밀하게 필터링", intro: "중국어·영어 제목을 검색하고 날짜, 주제, 장소 필터를 조합하세요.", search: "행사 검색", searchPlaceholder: "포럼, 장소 또는 영어 키워드 검색", date: "날짜로 필터", category: "주제로 필터", venue: "장소로 필터", allDates: "모든 날짜", allCategories: "모든 주제", allVenues: "모든 장소", resultCount: (count: number) => `${count}개 행사가 조건에 맞습니다`, pagination: (shown: number, total: number) => `${shown}/${total}개 표시`, view: "행사 보기", more: "더 보기", empty: "일치하는 행사가 없습니다", emptyHelp: "다른 검색어를 입력하거나 필터를 지우세요.", clear: "필터 지우기", close: "행사 상세 닫기", time: "시간", location: "상세 위치", venueLabel: "장소", categoryLabel: "주제", add: "동선에 추가", remove: "동선에서 제거", official: "공식 등록", amap: "Amap에서 검색",
  },
  fr: {
    title: "Filtrer précisément les 175 événements", intro: "Recherchez les titres chinois ou anglais et combinez date, thème et lieu.", search: "Rechercher", searchPlaceholder: "Forum, lieu ou mot-clé anglais", date: "Filtrer par date", category: "Filtrer par thème", venue: "Filtrer par lieu", allDates: "Toutes les dates", allCategories: "Tous les thèmes", allVenues: "Tous les lieux", resultCount: (count: number) => `${count} événement${count > 1 ? "s" : ""} correspondant${count > 1 ? "s" : ""}`, pagination: (shown: number, total: number) => `${shown}/${total} affichés`, view: "Voir l’événement", more: "Afficher plus", empty: "Aucun événement correspondant", emptyHelp: "Essayez un autre mot-clé ou effacez les filtres.", clear: "Effacer les filtres", close: "Fermer les détails", time: "Horaire", location: "Emplacement exact", venueLabel: "Lieu", categoryLabel: "Thème", add: "Ajouter au parcours", remove: "Retirer du parcours", official: "Inscription officielle", amap: "Rechercher dans Amap",
  },
  de: {
    title: "Alle 175 Veranstaltungen präzise filtern", intro: "Durchsuchen Sie chinesische oder englische Titel und kombinieren Sie Datum, Thema und Ort.", search: "Veranstaltungen suchen", searchPlaceholder: "Forum, Ort oder englisches Stichwort", date: "Nach Datum filtern", category: "Nach Thema filtern", venue: "Nach Ort filtern", allDates: "Alle Daten", allCategories: "Alle Themen", allVenues: "Alle Orte", resultCount: (count: number) => `${count} passende Veranstaltungen`, pagination: (shown: number, total: number) => `${shown}/${total} angezeigt`, view: "Veranstaltung ansehen", more: "Mehr anzeigen", empty: "Keine passenden Veranstaltungen", emptyHelp: "Versuchen Sie ein anderes Stichwort oder löschen Sie die Filter.", clear: "Filter löschen", close: "Details schließen", time: "Zeit", location: "Genauer Ort", venueLabel: "Ort", categoryLabel: "Thema", add: "Zur Route hinzufügen", remove: "Aus Route entfernen", official: "Offizielle Registrierung", amap: "In Amap suchen",
  },
  es: {
    title: "Filtra con precisión las 175 actividades", intro: "Busca títulos en chino o inglés y combina fecha, tema y recinto.", search: "Buscar actividades", searchPlaceholder: "Foro, lugar o palabra clave en inglés", date: "Filtrar por fecha", category: "Filtrar por tema", venue: "Filtrar por recinto", allDates: "Todas las fechas", allCategories: "Todos los temas", allVenues: "Todos los recintos", resultCount: (count: number) => `${count} actividades coincidentes`, pagination: (shown: number, total: number) => `${shown}/${total} mostradas`, view: "Ver actividad", more: "Mostrar más", empty: "No hay actividades coincidentes", emptyHelp: "Prueba otra palabra o borra los filtros.", clear: "Borrar filtros", close: "Cerrar detalles", time: "Hora", location: "Ubicación exacta", venueLabel: "Recinto", categoryLabel: "Tema", add: "Añadir a la ruta", remove: "Quitar de la ruta", official: "Registro oficial", amap: "Buscar en Amap",
  },
  ar: {
    title: "صفّ 175 فعالية بدقة", intro: "ابحث في العناوين الصينية أو الإنجليزية واجمع فلاتر التاريخ والموضوع والمكان.", search: "البحث في الفعاليات", searchPlaceholder: "ابحث عن منتدى أو مكان أو كلمة إنجليزية", date: "تصفية حسب التاريخ", category: "تصفية حسب الموضوع", venue: "تصفية حسب المكان", allDates: "كل التواريخ", allCategories: "كل الموضوعات", allVenues: "كل الأماكن", resultCount: (count: number) => `${count} فعالية مطابقة`, pagination: (shown: number, total: number) => `عرض ${shown}/${total}`, view: "عرض الفعالية", more: "عرض المزيد", empty: "لا توجد فعاليات مطابقة", emptyHelp: "جرّب كلمة أخرى أو امسح الفلاتر.", clear: "مسح الفلاتر", close: "إغلاق التفاصيل", time: "الوقت", location: "الموقع الدقيق", venueLabel: "المكان", categoryLabel: "الموضوع", add: "إضافة إلى المسار", remove: "إزالة من المسار", official: "التسجيل الرسمي", amap: "البحث في Amap",
  },
} as const;

function titleFor(event: WaicEvent, language: Language): string {
  return displayText(sourceText(event.title, language));
}

function categoryFor(event: WaicEvent, language: Language): string {
  return displayText(categoryLabel(event.category, language));
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.closest("[inert]") &&
      element.getAttribute("aria-hidden") !== "true",
  );
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

interface EventDetailSheetProps {
  event: WaicEvent;
  selected: boolean;
  onToggle: (event: WaicEvent) => void;
  onClose: () => void;
  language?: Language;
}

export function EventDetailSheet({
  event,
  selected,
  onToggle,
  onClose,
  language = "zh",
}: EventDetailSheetProps) {
  const content = copy[language];
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const restoreBackground = backdropRef.current
      ? makeBackgroundInert(backdropRef.current)
      : () => undefined;
    closeButtonRef.current?.focus();
    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        onClose();
        return;
      }
      if (keyboardEvent.key !== "Tab" || !dialogRef.current) return;

      const focusable = focusableElements(dialogRef.current);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) {
        keyboardEvent.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const activeElement = document.activeElement;
      if (
        keyboardEvent.shiftKey &&
        (activeElement === first || !dialogRef.current.contains(activeElement))
      ) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (
        !keyboardEvent.shiftKey &&
        (activeElement === last || !dialogRef.current.contains(activeElement))
      ) {
        keyboardEvent.preventDefault();
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

  const closeFromBackdrop = (mouseEvent: MouseEvent<HTMLDivElement>) => {
    if (mouseEvent.target === mouseEvent.currentTarget) onClose();
  };

  const title = titleFor(event, language);
  const secondaryTitle = displayText(
    language === "zh" ? event.title.en : event.title.zh,
  );
  const mapUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(event.location.zh)}`;

  return (
    <div
      className="detail-backdrop"
      ref={backdropRef}
      onMouseDown={closeFromBackdrop}
    >
      <motion.section
        className="event-detail-sheet"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-detail-title"
        tabIndex={-1}
        initial={reducedMotion ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0, y: 24 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          className="detail-close"
          type="button"
          ref={closeButtonRef}
          aria-label={content.close}
          onClick={onClose}
        >
          <X aria-hidden="true" weight="bold" />
        </button>
        <div className="detail-content">
          <p className="detail-category">{categoryFor(event, language)}</p>
          <h2 id="event-detail-title">{title}</h2>
          {secondaryTitle !== title ? (
            <p className="detail-secondary-title">{secondaryTitle}</p>
          ) : null}
          <dl className="detail-facts">
            <div>
              <dt>
                <Clock aria-hidden="true" weight="bold" />
                {content.time}
              </dt>
              <dd>
                {dateLabel(event.date, language)} {event.startTime}-{event.endTime}
              </dd>
            </div>
            <div>
              <dt>
                <MapPin aria-hidden="true" weight="fill" />
                {content.location}
              </dt>
              <dd>{displayText(sourceText(event.location, language))}</dd>
            </div>
            <div>
              <dt>{content.venueLabel}</dt>
              <dd>{venueLabel(event.venue.id, language)}</dd>
            </div>
            <div>
              <dt>{content.categoryLabel}</dt>
              <dd>{categoryFor(event, language)}</dd>
            </div>
          </dl>
          <div className="detail-actions">
            <button
              className={`button ${selected ? "button-secondary" : "button-primary"}`}
              type="button"
              onClick={() => onToggle(event)}
            >
              {selected ? (
                <Check aria-hidden="true" weight="bold" />
              ) : (
                <Plus aria-hidden="true" weight="bold" />
              )}
              {selected ? content.remove : content.add}
            </button>
            <a
              className="button button-secondary"
              href="https://www.worldaic.com.cn/register"
              target="_blank"
              rel="noreferrer"
            >
              {content.official}
              <ArrowSquareOut aria-hidden="true" weight="bold" />
            </a>
            <a
              className="button button-secondary"
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              {content.amap}
              <MapPin aria-hidden="true" weight="bold" />
            </a>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

interface EventExplorerProps {
  events: readonly WaicEvent[];
  selection?: ExplorerSelection | null;
  onClearSelection?: () => void;
  plannerState: PlannerState;
  onPlannerStateChange: (state: PlannerState) => void;
  language?: Language;
}

export function EventExplorer({
  events,
  selection,
  onClearSelection,
  plannerState,
  onPlannerStateChange,
  language = "zh",
}: EventExplorerProps) {
  const content = copy[language];
  const [query, setQuery] = useState("");
  const [date, setDate] = useState<WaicDate | "">("");
  const [category, setCategory] = useState<EventCategory | "">("");
  const [venue, setVenue] = useState<VenueId | "">("");
  const [eventIds, setEventIds] = useState<number[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeEvent, setActiveEvent] = useState<WaicEvent | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const venues = useMemo(() => summarizeVenues(events), [events]);

  useEffect(() => {
    if (!selection) return;
    setQuery("");
    setDate(selection.dates?.[0] ?? "");
    setCategory(selection.categories?.[0] ?? "");
    setVenue(selection.venues?.[0] ?? "");
    setEventIds(selection.eventIds ?? null);
    setVisibleCount(PAGE_SIZE);
  }, [selection]);

  const filteredEvents = useMemo(() => {
    const filtered = filterEvents(events, {
      query,
      dates: date ? [date] : undefined,
      categories: category ? [category] : undefined,
      venues: venue ? [venue] : undefined,
    });
    if (eventIds === null) return filtered;
    const allowedIds = new Set(eventIds);
    return filtered.filter((event) => allowedIds.has(event.id));
  }, [category, date, eventIds, events, query, venue]);

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const groupedEvents = visibleEvents.reduce<
    Array<{ date: WaicDate; events: WaicEvent[] }>
  >((groups, event) => {
    const current = groups.at(-1);
    if (current?.date === event.date) current.events.push(event);
    else groups.push({ date: event.date, events: [event] });
    return groups;
  }, []);

  const clearExternalSelection = () => {
    setEventIds(null);
    onClearSelection?.();
  };

  const clearFilters = () => {
    setQuery("");
    setDate("");
    setCategory("");
    setVenue("");
    setEventIds(null);
    setVisibleCount(PAGE_SIZE);
    onClearSelection?.();
  };

  const openDetail = (event: WaicEvent, trigger: HTMLElement) => {
    returnFocusRef.current = trigger;
    setActiveEvent(event);
  };

  const closeDetail = useCallback(() => {
    setActiveEvent(null);
    queueMicrotask(() => returnFocusRef.current?.focus());
  }, []);

  const toggleSelectedEvent = (event: WaicEvent) => {
    const selected = plannerState.selectedEventIds.includes(event.id);
    const currentAvailability =
      plannerState.availability[event.date] ?? DEFAULT_AVAILABILITY[event.date];
    onPlannerStateChange({
      ...plannerState,
      dates:
        selected || plannerState.dates.includes(event.date)
          ? plannerState.dates
          : WAIC_DATES.filter(
              (date) => date === event.date || plannerState.dates.includes(date),
            ),
      availability: selected
        ? plannerState.availability
        : {
            ...plannerState.availability,
            [event.date]: {
              start:
                event.startTime < currentAvailability.start
                  ? event.startTime
                  : currentAvailability.start,
              end:
                event.endTime > currentAvailability.end
                  ? event.endTime
                  : currentAvailability.end,
            },
          },
      selectedEventIds: selected
        ? plannerState.selectedEventIds.filter((id) => id !== event.id)
        : [...plannerState.selectedEventIds, event.id],
      excludedEventIds: selected
        ? [...new Set([...plannerState.excludedEventIds, event.id])]
        : plannerState.excludedEventIds.filter((id) => id !== event.id),
    });
  };

  return (
    <section className="page-section explorer-section" id="schedule" aria-labelledby="explorer-title">
      <header className="section-heading explorer-heading">
        <h2 id="explorer-title">{content.title}</h2>
        <p>{content.intro}</p>
      </header>
      <div className="explorer-filters">
        <label className="explorer-search">
          <span>{content.search}</span>
          <div>
            <MagnifyingGlass aria-hidden="true" weight="bold" />
            <input
              type="search"
              value={query}
              placeholder={content.searchPlaceholder}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </div>
        </label>
        <label>
          <span>{content.date}</span>
          <select
            value={date}
            onChange={(event) => {
              clearExternalSelection();
              setDate(event.target.value as WaicDate | "");
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <option value="">{content.allDates}</option>
            {WAIC_DATES.map((item) => (
              <option key={item} value={item}>
                {dateLabel(item, language)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{content.category}</span>
          <select
            value={category}
            onChange={(event) => {
              clearExternalSelection();
              setCategory(event.target.value as EventCategory | "");
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <option value="">{content.allCategories}</option>
            {WAIC_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {displayText(
                  categoryLabel(item, language),
                )}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{content.venue}</span>
          <select
            value={venue}
            onChange={(event) => {
              clearExternalSelection();
              setVenue(event.target.value as VenueId | "");
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <option value="">{content.allVenues}</option>
            {venues.map((item) => (
              <option key={item.venueId} value={item.venueId}>
                {displayText(language === "zh" ? item.zh : item.en)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="explorer-result-bar">
        <span>
          <strong>{content.resultCount(filteredEvents.length)}</strong>{" "}
          <small aria-live="polite" aria-atomic="true">
            {content.pagination(
              Math.min(visibleCount, filteredEvents.length),
              filteredEvents.length,
            )}
          </small>
        </span>
        {filteredEvents.length > 0 &&
        (query || date || category || venue || eventIds !== null) ? (
          <button className="text-button" type="button" onClick={clearFilters}>
            {content.clear}
          </button>
        ) : null}
      </div>

      {filteredEvents.length ? (
        <div className="event-timeline">
          {groupedEvents.map((group) => (
            <section className="event-day-group" key={group.date}>
              <h3>{dateLabel(group.date, language)}</h3>
              <div>
                {group.events.map((event) => (
                  <button
                    className="event-row"
                    type="button"
                    aria-label={`${content.view}：${titleFor(event, language)}`}
                    key={event.id}
                    onClick={(mouseEvent) =>
                      openDetail(event, mouseEvent.currentTarget)
                    }
                  >
                    <span className="event-row-time">
                      <strong>{event.startTime}</strong>
                      <small>{event.endTime}</small>
                    </span>
                    <span className="event-row-main">
                      <small>{categoryFor(event, language)}</small>
                      <strong>{titleFor(event, language)}</strong>
                    </span>
                    <span className="event-row-venue">
                      <MapPin aria-hidden="true" weight="fill" />
                      {displayText(
                        venueLabel(event.venue.id, language),
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {visibleCount < filteredEvents.length ? (
            <button
              className="button button-secondary explorer-more"
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              {content.more}
              <ArrowDown aria-hidden="true" weight="bold" />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="explorer-empty">
          <MagnifyingGlass aria-hidden="true" weight="duotone" />
          <h3>{content.empty}</h3>
          <p>{content.emptyHelp}</p>
          <button className="button button-primary" type="button" onClick={clearFilters}>
            {content.clear}
          </button>
        </div>
      )}

      {activeEvent ? (
        <EventDetailSheet
          event={activeEvent}
          selected={plannerState.selectedEventIds.includes(activeEvent.id)}
          onToggle={toggleSelectedEvent}
          onClose={closeDetail}
          language={language}
        />
      ) : null}
    </section>
  );
}
