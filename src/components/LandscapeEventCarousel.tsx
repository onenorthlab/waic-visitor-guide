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
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

import { displayText } from "../lib/display";
import { CATEGORY_LABELS_EN, DATE_LABELS } from "../lib/labels";
import type { WaicEvent } from "../lib/types";
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
    count: (count: number) => `${count} ${count === 1 ? "event" : "events"}`,
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const activeEvent = events[activeIndex];
  const autoplaying = events.length > 1 && !reducedMotion && !manualPaused;
  const dialogTitle = `${label}${content.activities}`;

  const move = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((index) => (index + direction + events.length) % events.length);
    },
    [events.length],
  );

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

  if (!activeEvent) return null;

  const title = displayText(activeEvent.title[language]);
  const secondaryTitle = displayText(
    language === "zh" ? activeEvent.title.en : activeEvent.title.zh,
  );
  const category = displayText(
    language === "zh"
      ? activeEvent.category
      : CATEGORY_LABELS_EN[activeEvent.category],
  );

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

        <div className="landscape-carousel-stage" aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait" initial={false}>
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
                  <dd>{DATE_LABELS[activeEvent.date][language]} {activeEvent.startTime}-{activeEvent.endTime}</dd>
                </div>
                <div>
                  <dt><MapPin aria-hidden="true" weight="fill" />{content.venue}</dt>
                  <dd>{displayText(language === "zh" ? activeEvent.venue.zh : activeEvent.venue.en)}</dd>
                </div>
                <div>
                  <dt>{content.location}</dt>
                  <dd>{displayText(activeEvent.location[language])}</dd>
                </div>
              </dl>
            </motion.article>
          </AnimatePresence>
        </div>

        <footer className="landscape-carousel-controls">
          <div className="landscape-carousel-pager">
            <button
              type="button"
              aria-label={content.previous}
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
              onFocus={() => setManualPaused(true)}
              onClick={() => {
                setManualPaused(true);
                move(1);
              }}
            >
              <CaretRight aria-hidden="true" weight="bold" />
            </button>
            <output className="landscape-carousel-position" aria-live="polite">
              {activeIndex + 1} / {events.length}
            </output>
          </div>
          <div className="landscape-carousel-progress" aria-hidden="true">
            <span style={{ width: `${((activeIndex + 1) / events.length) * 100}%` }} />
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
