import {
  CalendarBlank,
  CheckCircle,
  Clock,
  DownloadSimple,
  MapPin,
  ShareNetwork,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState, type FormEvent } from "react";

import { displayText } from "../lib/display";
import { createRouteIcs } from "../lib/ics";
import {
  CATEGORY_LABELS_EN,
  DATE_LABELS,
  GOAL_LABELS_EN,
  IDENTITY_LABELS_EN,
} from "../lib/labels";
import {
  GOAL_LABELS,
  IDENTITY_LABELS,
  PLANNER_GOALS,
  PLANNER_IDENTITIES,
  planRoute,
} from "../lib/planner";
import { encodePlannerState } from "../lib/share";
import {
  WAIC_CATEGORIES,
  WAIC_DATES,
  type PlannedEvent,
  type PlannerReason,
  type PlannerResult,
  type PlannerState,
  type RejectedCandidate,
  type WaicDate,
  type WaicEvent,
} from "../lib/types";
import type { Language } from "./AppShell";

const DEFAULT_AVAILABILITY: Record<
  WaicDate,
  { start: string; end: string }
> = {
  "2026-07-17": { start: "13:30", end: "17:00" },
  "2026-07-18": { start: "09:00", end: "17:00" },
  "2026-07-19": { start: "09:00", end: "17:00" },
  "2026-07-20": { start: "09:00", end: "16:00" },
};

const copy = {
  zh: {
    title: "30 秒生成你的参访路线",
    intro: "选择身份、目标和可用时间，系统按相关性、冲突与换馆缓冲生成路线。",
    identity: "你的身份",
    identityPlaceholder: "请选择身份",
    goals: "参访目标，最多 2 个",
    goalLimit: "最多选择 2 个目标",
    interests: "兴趣类别",
    dates: "日期与每天可用时段",
    invitedNote: "7月17日 13:30-17:00 仅受邀开放，请先确认论坛资格。",
    pace: "参访节奏",
    paceLabels: ["每日 2 场", "每日 3 场", "每日 4 场"],
    generate: "生成我的路线",
    resultTitle: "路线已生成",
    resultIntro: "每项都说明推荐理由与现场注意力成本。",
    emptyBefore: "填写左侧偏好后，这里会显示路线、冲突与换馆成本。",
    noRoute: "没有找到可行路线",
    loosen: "请放宽日期、可用时段或兴趣类别后重试。",
    errorTitle: "路线计算失败",
    errorSource: "来源：WAIC 2026 完整会议活动表。请检查时段后重试。",
    retry: "重新计算",
    manualCount: (count: number) => `已手动加入 ${count} 场`,
    manualTitle: "手动加入的活动",
    remove: "移除",
    rejected: "高相关但未进入路线",
    noRejected: "当前路线没有额外的高相关冲突项。",
  },
  en: {
    title: "Build your visit route in 30 seconds",
    intro: "Choose your role, goals, and available time. The planner balances relevance, conflicts, and venue buffers.",
    identity: "Your role",
    identityPlaceholder: "Select a role",
    goals: "Visit goals, up to 2",
    goalLimit: "Choose up to 2 goals",
    interests: "Topic interests",
    dates: "Dates and daily availability",
    invitedNote: "Jul 17 from 13:30-17:00 is invitation-only. Confirm forum access first.",
    pace: "Visit pace",
    paceLabels: ["2 events per day", "3 events per day", "4 events per day"],
    generate: "Build my route",
    resultTitle: "Route ready",
    resultIntro: "Every item explains why it fits and what it costs in attention.",
    emptyBefore: "Complete the inputs to see a route, conflicts, and venue-change costs.",
    noRoute: "No feasible route found",
    loosen: "Try widening the dates, availability, or topic interests.",
    errorTitle: "Route calculation failed",
    errorSource: "Source: complete WAIC 2026 forum schedule. Check the time windows and retry.",
    retry: "Try again",
    manualCount: (count: number) => `${count} manually added`,
    manualTitle: "Manually added events",
    remove: "Remove",
    rejected: "High-relevance events left out",
    noRejected: "This route has no additional high-relevance conflicts.",
  },
} as const;

const REASON_LABELS_EN: Record<PlannerReason["type"], string> = {
  interest: "Direct topic interest",
  identity: "Fits your role",
  goal: "Supports a visit goal",
  diversity: "Adds topic breadth",
};

const REJECTION_LABELS_EN: Record<
  RejectedCandidate["rejection"]["type"],
  string
> = {
  "outside-availability": "Outside your availability",
  "time-conflict": "Conflicts with a selected event",
  "venue-buffer": "Not enough venue-change buffer",
  "daily-limit": "Daily event limit reached",
  "lower-match": "Replaced by a better-matching combination",
};

function eventTitle(event: WaicEvent, language: Language): string {
  return displayText(event.title[language]);
}

function formatHours(minutes: number, language: Language): string {
  const hours = Math.round((minutes / 60) * 10) / 10;
  return language === "zh" ? `${hours} 小时` : `${hours} hr`;
}

function uniqueEvents(events: readonly WaicEvent[]): WaicEvent[] {
  return [...new Map(events.map((event) => [event.id, event])).values()].sort(
    (left, right) =>
      left.date.localeCompare(right.date) ||
      left.startMinutes - right.startMinutes ||
      left.id - right.id,
  );
}

interface AttentionBudgetProps {
  result: PlannerResult;
  language?: Language;
}

export function AttentionBudget({
  result,
  language = "zh",
}: AttentionBudgetProps) {
  const metrics =
    language === "zh"
      ? [
          ["活动场数", `${result.metrics.eventCount} 场`],
          ["有效内容小时", formatHours(result.metrics.contentMinutes, language)],
          ["目标覆盖", `${Math.round(result.metrics.goalCoverage * 100)}%`],
          ["主题数", `${result.metrics.distinctCategories} 类`],
          ["换馆次数", `${result.metrics.venueChanges} 次`],
          ["建议缓冲", `${result.metrics.transitionBufferMinutes} 分钟`],
        ]
      : [
          ["Events", String(result.metrics.eventCount)],
          ["Content hours", formatHours(result.metrics.contentMinutes, language)],
          ["Goal coverage", `${Math.round(result.metrics.goalCoverage * 100)}%`],
          ["Topics", String(result.metrics.distinctCategories)],
          ["Venue changes", String(result.metrics.venueChanges)],
          ["Suggested buffer", `${result.metrics.transitionBufferMinutes} min`],
        ];

  return (
    <section className="attention-budget" aria-label={language === "zh" ? "路线注意力预算" : "Route attention budget"}>
      {metrics.map(([label, value]) => (
        <div className="attention-metric" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  );
}

interface RouteTimelineProps {
  items: readonly PlannedEvent[];
  language?: Language;
}

export function RouteTimeline({ items, language = "zh" }: RouteTimelineProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="route-timeline">
      {items.map((item, index) => {
        const showDate = index === 0 || items[index - 1].event.date !== item.event.date;
        return (
          <div className="route-entry-wrap" key={item.event.id}>
            {showDate ? (
              <h4 className="route-date">{DATE_LABELS[item.event.date][language]}</h4>
            ) : null}
            <motion.article
              className="route-entry"
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: reducedMotion ? 0 : index * 0.04 }}
            >
              <div className="route-time">
                <strong>{item.event.startTime}</strong>
                <span>{item.event.endTime}</span>
              </div>
              <div className="route-entry-main">
                <p className="route-category">
                  {displayText(
                    language === "zh"
                      ? item.event.category
                      : CATEGORY_LABELS_EN[item.event.category],
                  )}
                </p>
                <h4>{eventTitle(item.event, language)}</h4>
                <p className="route-location">
                  <MapPin aria-hidden="true" weight="fill" />
                  {displayText(item.event.location[language])}
                </p>
                <div className="route-reasons" aria-label={language === "zh" ? "推荐理由" : "Recommendation reasons"}>
                  {item.reasons.map((reason, reasonIndex) => (
                    <span key={`${reason.type}-${reasonIndex}`}>
                      {language === "zh"
                        ? displayText(reason.label)
                        : REASON_LABELS_EN[reason.type]}
                    </span>
                  ))}
                </div>
                {item.bufferFromPreviousMinutes > 0 ? (
                  <p className="route-buffer">
                    <Clock aria-hidden="true" weight="bold" />
                    {language === "zh"
                      ? `换馆提示：建议缓冲 ${item.bufferFromPreviousMinutes} 分钟`
                      : `Venue note: allow a suggested ${item.bufferFromPreviousMinutes}-minute buffer`}
                  </p>
                ) : null}
              </div>
            </motion.article>
          </div>
        );
      })}
    </div>
  );
}

interface RouteActionsProps {
  state: PlannerState;
  events: readonly WaicEvent[];
  language?: Language;
}

export function RouteActions({
  state,
  events,
  language = "zh",
}: RouteActionsProps) {
  const [status, setStatus] = useState("");

  const shareRoute = async () => {
    const query = encodePlannerState(state);
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: "WAIC 2026 Visitor Guide",
          text:
            language === "zh"
              ? "这是我的 WAIC 2026 参访路线。"
              : "Here is my WAIC 2026 visit route.",
          url,
        });
        setStatus(language === "zh" ? "已打开系统分享" : "Share sheet opened");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setStatus(language === "zh" ? "链接已复制" : "Link copied");
      } else {
        setStatus(language === "zh" ? "无法复制，请从地址栏分享" : "Copy unavailable. Share from the address bar.");
      }
    } catch (error) {
      setStatus(
        error instanceof DOMException && error.name === "AbortError"
          ? language === "zh"
            ? "已取消分享"
            : "Sharing cancelled"
          : language === "zh"
            ? "分享失败，请重试"
            : "Sharing failed. Try again.",
      );
    }
  };

  const downloadIcs = () => {
    const ics = createRouteIcs(events);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "waic-2026-route.ics";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(language === "zh" ? "ICS 已生成" : "ICS created");
  };

  return (
    <div className="route-actions">
      <button className="button button-secondary" type="button" onClick={shareRoute}>
        <ShareNetwork aria-hidden="true" weight="bold" />
        {language === "zh" ? "分享路线" : "Share route"}
      </button>
      <button
        className="button button-secondary"
        type="button"
        onClick={downloadIcs}
        disabled={events.length === 0}
      >
        <DownloadSimple aria-hidden="true" weight="bold" />
        {language === "zh" ? "下载 ICS" : "Download ICS"}
      </button>
      <span className="route-action-status" role="status">
        {status}
      </span>
    </div>
  );
}

interface PlannerProps {
  events: readonly WaicEvent[];
  state: PlannerState;
  onStateChange: (state: PlannerState) => void;
  language?: Language;
}

export function Planner({
  events,
  state,
  onStateChange,
  language = "zh",
}: PlannerProps) {
  const content = copy[language];
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [goalMessage, setGoalMessage] = useState("");
  const [error, setError] = useState("");
  const eventById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  );
  const manualEvents = state.selectedEventIds
    .map((id) => eventById.get(id))
    .filter((event): event is WaicEvent => Boolean(event));

  const update = (next: PlannerState, affectsRoute = true) => {
    onStateChange(next);
    if (affectsRoute) {
      setResult(null);
      setHasGenerated(false);
      setError("");
    }
  };

  const toggleGoal = (goal: PlannerState["goals"][number], checked: boolean) => {
    if (checked && state.goals.length >= 2) {
      setGoalMessage(content.goalLimit);
      return;
    }
    setGoalMessage("");
    update({
      ...state,
      goals: checked
        ? [...state.goals, goal]
        : state.goals.filter((item) => item !== goal),
    });
  };

  const toggleDate = (date: WaicDate, checked: boolean) => {
    const dates = checked
      ? WAIC_DATES.filter((item) => item === date || state.dates.includes(item))
      : state.dates.filter((item) => item !== date);
    const availability = { ...state.availability };
    if (checked && !availability[date]) availability[date] = DEFAULT_AVAILABILITY[date];
    if (!checked) delete availability[date];
    update({ ...state, dates, availability });
  };

  const generateRoute = () => {
    setHasGenerated(true);
    setError("");
    try {
      setResult(planRoute(events, state));
    } catch (routeError) {
      setResult(null);
      setError(routeError instanceof Error ? routeError.message : String(routeError));
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    generateRoute();
  };

  const removeManualEvent = (event: WaicEvent) => {
    update(
      {
        ...state,
        selectedEventIds: state.selectedEventIds.filter((id) => id !== event.id),
      },
      false,
    );
  };

  const actionEvents = uniqueEvents([
    ...(result?.items.map((item) => item.event) ?? []),
    ...manualEvents,
  ]);

  return (
    <section className="page-section planner-section" id="planner" aria-labelledby="planner-title">
      <header className="section-heading planner-heading">
        <h2 id="planner-title">{content.title}</h2>
        <p>{content.intro}</p>
      </header>
      <div className="planner-layout">
        <form className="planner-form" onSubmit={onSubmit}>
          <div className="planner-control">
            <label htmlFor="planner-identity">{content.identity}</label>
            <select
              id="planner-identity"
              value={state.identity ?? ""}
              onChange={(event) =>
                update({
                  ...state,
                  identity: (event.target.value || null) as PlannerState["identity"],
                })
              }
            >
              <option value="">{content.identityPlaceholder}</option>
              {PLANNER_IDENTITIES.map((identity) => (
                <option key={identity} value={identity}>
                  {language === "zh"
                    ? IDENTITY_LABELS[identity]
                    : IDENTITY_LABELS_EN[identity]}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="planner-control">
            <legend>{content.goals}</legend>
            <div className="choice-cloud compact-choice-cloud">
              {PLANNER_GOALS.map((goal) => (
                <label className="choice-chip" key={goal}>
                  <input
                    type="checkbox"
                    checked={state.goals.includes(goal)}
                    onChange={(event) => toggleGoal(goal, event.target.checked)}
                  />
                  <span>
                    {language === "zh" ? GOAL_LABELS[goal] : GOAL_LABELS_EN[goal]}
                  </span>
                </label>
              ))}
            </div>
            <p className="control-message" aria-live="polite">
              {goalMessage}
            </p>
          </fieldset>

          <fieldset className="planner-control">
            <legend>{content.interests}</legend>
            <div className="choice-cloud interest-cloud">
              {WAIC_CATEGORIES.map((category) => (
                <label className="choice-chip" key={category}>
                  <input
                    type="checkbox"
                    checked={state.interests.includes(category)}
                    onChange={(event) =>
                      update({
                        ...state,
                        interests: event.target.checked
                          ? [...state.interests, category]
                          : state.interests.filter((item) => item !== category),
                      })
                    }
                  />
                  <span>
                    {displayText(
                      language === "zh" ? category : CATEGORY_LABELS_EN[category],
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="planner-control">
            <legend>{content.dates}</legend>
            <div className="planner-dates">
              {WAIC_DATES.map((date) => (
                <div className="planner-date" key={date}>
                  <label className="choice-chip date-chip">
                    <input
                      type="checkbox"
                      checked={state.dates.includes(date)}
                      onChange={(event) => toggleDate(date, event.target.checked)}
                    />
                    <span>{DATE_LABELS[date][language]}</span>
                  </label>
                  {state.dates.includes(date) ? (
                    <div className="availability-row">
                      <label>
                        <span>
                          {language === "zh"
                            ? `${DATE_LABELS[date].zh}开始时间`
                            : `${DATE_LABELS[date].en} start time`}
                        </span>
                        <input
                          type="time"
                          value={state.availability[date]?.start ?? DEFAULT_AVAILABILITY[date].start}
                          onChange={(event) =>
                            update({
                              ...state,
                              availability: {
                                ...state.availability,
                                [date]: {
                                  start: event.target.value,
                                  end:
                                    state.availability[date]?.end ??
                                    DEFAULT_AVAILABILITY[date].end,
                                },
                              },
                            })
                          }
                        />
                      </label>
                      <label>
                        <span>
                          {language === "zh"
                            ? `${DATE_LABELS[date].zh}结束时间`
                            : `${DATE_LABELS[date].en} end time`}
                        </span>
                        <input
                          type="time"
                          value={state.availability[date]?.end ?? DEFAULT_AVAILABILITY[date].end}
                          onChange={(event) =>
                            update({
                              ...state,
                              availability: {
                                ...state.availability,
                                [date]: {
                                  start:
                                    state.availability[date]?.start ??
                                    DEFAULT_AVAILABILITY[date].start,
                                  end: event.target.value,
                                },
                              },
                            })
                          }
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            {state.dates.includes("2026-07-17") ? (
              <p className="invited-note">
                <WarningCircle aria-hidden="true" weight="fill" />
                {content.invitedNote}
              </p>
            ) : null}
          </fieldset>

          <fieldset className="planner-control">
            <legend>{content.pace}</legend>
            <div className="pace-control">
              {(["relaxed", "balanced", "intensive"] as const).map(
                (pace, index) => (
                  <label className="choice-chip" key={pace}>
                    <input
                      type="radio"
                      name="planner-pace"
                      value={pace}
                      checked={state.pace === pace}
                      onChange={() => update({ ...state, pace })}
                    />
                    <span>{content.paceLabels[index]}</span>
                  </label>
                ),
              )}
            </div>
          </fieldset>

          <button className="button button-primary planner-submit" type="submit">
            <CalendarBlank aria-hidden="true" weight="bold" />
            {content.generate}
          </button>
        </form>

        <div className="planner-output">
          {error ? (
            <div className="planner-error" role="alert">
              <WarningCircle aria-hidden="true" weight="fill" />
              <div>
                <h3>{content.errorTitle}</h3>
                <p>{content.errorSource}</p>
                <code>{displayText(error)}</code>
                <button className="text-button" type="button" onClick={generateRoute}>
                  {content.retry}
                </button>
              </div>
            </div>
          ) : result?.items.length ? (
            <>
              <div className="planner-result-heading">
                <div>
                  <p className="result-confirmation">
                    <CheckCircle aria-hidden="true" weight="fill" />
                    {content.resultTitle}
                  </p>
                  <p>{content.resultIntro}</p>
                </div>
                <RouteActions state={state} events={actionEvents} language={language} />
              </div>
              <AttentionBudget result={result} language={language} />
              <RouteTimeline items={result.items} language={language} />
              <section className="rejected-section">
                <h3>{content.rejected}</h3>
                {result.rejectedHighRelevance.length ? (
                  <div className="rejected-list">
                    {result.rejectedHighRelevance.slice(0, 3).map((candidate) => (
                      <article key={candidate.event.id}>
                        <div>
                          <span>
                            {candidate.event.startTime}-{candidate.event.endTime}
                          </span>
                          <strong>{eventTitle(candidate.event, language)}</strong>
                        </div>
                        <p>
                          {language === "zh"
                            ? displayText(candidate.rejection.label)
                            : REJECTION_LABELS_EN[candidate.rejection.type]}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p>{content.noRejected}</p>
                )}
              </section>
            </>
          ) : hasGenerated ? (
            <div className="planner-empty planner-empty-result">
              <WarningCircle aria-hidden="true" weight="fill" />
              <h3>{content.noRoute}</h3>
              <p>{content.loosen}</p>
            </div>
          ) : (
            <div className="planner-empty">
              <CalendarBlank aria-hidden="true" weight="duotone" />
              <p>{content.emptyBefore}</p>
            </div>
          )}

          {manualEvents.length ? (
            <section className="manual-events" aria-labelledby="manual-events-title">
              <div className="manual-events-heading">
                <h3 id="manual-events-title">{content.manualTitle}</h3>
                <strong>{content.manualCount(manualEvents.length)}</strong>
              </div>
              {manualEvents.map((event) => (
                <article key={event.id}>
                  <div>
                    <span>
                      {DATE_LABELS[event.date][language]} {event.startTime}-{event.endTime}
                    </span>
                    <strong>{eventTitle(event, language)}</strong>
                  </div>
                  <button
                    className="remove-event-button"
                    type="button"
                    aria-label={`${language === "zh" ? "从路线移除" : "Remove from route"}：${eventTitle(event, language)}`}
                    onClick={() => removeManualEvent(event)}
                  >
                    <X aria-hidden="true" weight="bold" />
                    {content.remove}
                  </button>
                </article>
              ))}
              {!result?.items.length ? (
                <RouteActions state={state} events={actionEvents} language={language} />
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
