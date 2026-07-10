import type {
  AvailabilityWindow,
  EventCategory,
  PlannedEvent,
  PlannerGoal,
  PlannerIdentity,
  PlannerReason,
  PlannerResult,
  PlannerState,
  RejectedCandidate,
  RejectionReason,
  WaicDate,
  WaicEvent,
} from "./types";
import { WAIC_CATEGORIES, WAIC_DATES } from "./types";
import { recommendedVenueBuffer } from "./venue";

export const PACE_DAILY_LIMIT = {
  relaxed: 2,
  balanced: 3,
  intensive: 4,
} as const;

export const PLANNER_IDENTITIES = [
  "developer",
  "executive",
  "founder",
  "investor",
  "researcher",
  "creator",
  "first-timer",
] as const satisfies readonly PlannerIdentity[];

export const PLANNER_GOALS = [
  "technical-depth",
  "industry-insight",
  "investment-opportunities",
  "policy-understanding",
  "creative-inspiration",
  "talent-network",
  "sustainable-impact",
] as const satisfies readonly PlannerGoal[];

export const IDENTITY_LABELS: Record<PlannerIdentity, string> = {
  developer: "技术研发者",
  executive: "企业决策者",
  founder: "创业者",
  investor: "投资人",
  researcher: "研究者",
  creator: "内容创作者",
  "first-timer": "首次参会者",
};

export const GOAL_LABELS: Record<PlannerGoal, string> = {
  "technical-depth": "技术深度",
  "industry-insight": "产业洞察",
  "investment-opportunities": "投资机会",
  "policy-understanding": "政策理解",
  "creative-inspiration": "创意启发",
  "talent-network": "人才交流",
  "sustainable-impact": "可持续影响",
};

const IDENTITY_CATEGORIES: Record<PlannerIdentity, readonly EventCategory[]> = {
  developer: [
    "大模型与AI基础",
    "算力与AI芯片",
    "前沿科技与探索",
    "机器人与具身智能",
  ],
  executive: ["综合论坛", "产业与工业智能化", "治理标准与政策"],
  founder: [
    "产业与工业智能化",
    "大模型与AI基础",
    "金融与科技投资",
    "综合论坛",
  ],
  investor: [
    "金融与科技投资",
    "产业与工业智能化",
    "机器人与具身智能",
    "算力与AI芯片",
  ],
  researcher: [
    "前沿科技与探索",
    "大模型与AI基础",
    "治理标准与政策",
    "教育与人才发展",
  ],
  creator: ["内容创意与AIGC", "综合论坛", "教育与人才发展"],
  "first-timer": ["综合论坛", "教育与人才发展", "前沿科技与探索"],
};

const GOAL_CATEGORIES: Record<PlannerGoal, readonly EventCategory[]> = {
  "technical-depth": [
    "大模型与AI基础",
    "算力与AI芯片",
    "前沿科技与探索",
    "机器人与具身智能",
  ],
  "industry-insight": ["产业与工业智能化", "综合论坛"],
  "investment-opportunities": [
    "金融与科技投资",
    "产业与工业智能化",
    "机器人与具身智能",
    "算力与AI芯片",
  ],
  "policy-understanding": ["治理标准与政策", "综合论坛"],
  "creative-inspiration": [
    "内容创意与AIGC",
    "教育与人才发展",
    "女性与多元发展",
  ],
  "talent-network": ["教育与人才发展", "女性与多元发展", "综合论坛"],
  "sustainable-impact": [
    "医疗与生命科学",
    "能源与可持续发展",
    "治理标准与政策",
  ],
};

const DIRECT_INTEREST_WEIGHT = 1000;
const IDENTITY_WEIGHT = 100;
const GOAL_WEIGHT = 20;

interface MatchContext {
  interests: ReadonlySet<EventCategory>;
  identity: PlannerIdentity | null;
  identityCategories: ReadonlySet<EventCategory>;
  goals: readonly PlannerGoal[];
}

interface EventMatch {
  score: number;
  directInterest: boolean;
  identityMatch: boolean;
  goals: PlannerGoal[];
  reasons: PlannerReason[];
}

interface RouteOption {
  events: WaicEvent[];
  score: number;
  venueChanges: number;
  goalMask: number;
  categoryMask: number;
  durationMinutes: number;
}

interface AvailabilityMinutes {
  start: number;
  end: number;
}

function compareEvents(left: WaicEvent, right: WaicEvent): number {
  return (
    left.date.localeCompare(right.date) ||
    left.startMinutes - right.startMinutes ||
    left.id - right.id
  );
}

function compareIds(left: readonly number[], right: readonly number[]): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return left.length - right.length;
}

function bitCount(value: number): number {
  let remaining = value >>> 0;
  let count = 0;
  while (remaining > 0) {
    remaining &= remaining - 1;
    count += 1;
  }
  return count;
}

function hasVenueChange(from: WaicEvent, to: WaicEvent): boolean {
  return (
    from.venue.id !== to.venue.id ||
    (from.venue.id === "other" && from.venue.detailId !== to.venue.detailId)
  );
}

function canFollow(from: WaicEvent, to: WaicEvent): boolean {
  return (
    from.date === to.date &&
    from.endMinutes + recommendedVenueBuffer(from.venue, to.venue) <=
      to.startMinutes
  );
}

function countVenueChanges(events: readonly WaicEvent[]): number {
  return events.reduce(
    (total, event, index) =>
      total +
      (index > 0 && hasVenueChange(events[index - 1], event) ? 1 : 0),
    0,
  );
}

function isFeasibleDay(events: readonly WaicEvent[]): boolean {
  const sorted = [...events].sort(compareEvents);
  return sorted.every(
    (event, index) => index === 0 || canFollow(sorted[index - 1], event),
  );
}

function parseClock(value: string, fieldName: string): number {
  if (value === "24:00") return 24 * 60;

  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) throw new Error(`${fieldName} must use HH:MM`);
  return Number(match[1]) * 60 + Number(match[2]);
}

function parseAvailability(
  date: WaicDate,
  window?: AvailabilityWindow,
): AvailabilityMinutes {
  if (!window) return { start: 0, end: 24 * 60 };

  const start = parseClock(window.start, `availability ${date} start`);
  const end = parseClock(window.end, `availability ${date} end`);
  if (start >= end) {
    throw new Error(`availability ${date} end must be later than start`);
  }
  return { start, end };
}

function isAvailable(event: WaicEvent, availability: AvailabilityMinutes): boolean {
  return (
    event.startMinutes >= availability.start && event.endMinutes <= availability.end
  );
}

function createMatchContext(state: PlannerState): MatchContext {
  const identity = state.identity;
  return {
    interests: new Set(state.interests),
    identity,
    identityCategories: new Set(
      identity ? IDENTITY_CATEGORIES[identity] : ([] as EventCategory[]),
    ),
    goals: [...new Set(state.goals)],
  };
}

function matchEvent(event: WaicEvent, context: MatchContext): EventMatch {
  const directInterest = context.interests.has(event.category);
  const identityMatch = context.identityCategories.has(event.category);
  const goals = context.goals.filter((goal) =>
    GOAL_CATEGORIES[goal].includes(event.category),
  );
  const reasons: PlannerReason[] = [];

  if (directInterest) {
    reasons.push({ type: "interest", label: `直接兴趣：${event.category}` });
  }
  if (identityMatch && context.identity) {
    reasons.push({
      type: "identity",
      label: `适合${IDENTITY_LABELS[context.identity]}身份`,
    });
  }
  goals.forEach((goal) => {
    reasons.push({ type: "goal", label: `契合目标：${GOAL_LABELS[goal]}` });
  });

  return {
    score:
      (directInterest ? DIRECT_INTEREST_WEIGHT : 0) +
      (identityMatch ? IDENTITY_WEIGHT : 0) +
      goals.length * GOAL_WEIGHT,
    directInterest,
    identityMatch,
    goals,
    reasons,
  };
}

function createRouteOption(
  events: readonly WaicEvent[],
  matches: ReadonlyMap<number, EventMatch>,
  score: number,
  venueChanges: number,
): RouteOption {
  let goalMask = 0;
  let categoryMask = 0;
  let durationMinutes = 0;

  events.forEach((event) => {
    const match = matches.get(event.id);
    match?.goals.forEach((goal) => {
      goalMask |= 1 << PLANNER_GOALS.indexOf(goal);
    });
    categoryMask |= 1 << WAIC_CATEGORIES.indexOf(event.category);
    durationMinutes += event.durationMinutes;
  });

  return {
    events: [...events],
    score,
    venueChanges,
    goalMask,
    categoryMask,
    durationMinutes,
  };
}

function preferSameMasks(candidate: RouteOption, current: RouteOption): boolean {
  if (candidate.durationMinutes !== current.durationMinutes) {
    return candidate.durationMinutes > current.durationMinutes;
  }
  return (
    compareIds(
      candidate.events.map((event) => event.id),
      current.events.map((event) => event.id),
    ) < 0
  );
}

function bestDayRoutes(
  events: readonly WaicEvent[],
  matches: ReadonlyMap<number, EventMatch>,
  dailyLimit: number,
  fixedEvents: readonly WaicEvent[] = [],
): RouteOption[] {
  const fixedIds = new Set(fixedEvents.map((event) => event.id));
  const candidates = events
    .filter(
      (event) =>
        !fixedIds.has(event.id) && (matches.get(event.id)?.score ?? 0) > 0,
    )
    .sort(compareEvents);
  const fixedScore = fixedEvents.reduce(
    (total, event) => total + (matches.get(event.id)?.score ?? 0),
    0,
  );
  let bestScore = -1;
  let bestVenueChanges = Number.POSITIVE_INFINITY;
  let variants = new Map<string, RouteOption>();

  const consider = (autoEvents: readonly WaicEvent[], autoScore: number) => {
    const selected = [...fixedEvents, ...autoEvents].sort(compareEvents);
    const score = fixedScore + autoScore;
    const venueChanges = countVenueChanges(selected);
    if (score < bestScore) return;
    if (score === bestScore && venueChanges > bestVenueChanges) return;

    if (score > bestScore || venueChanges < bestVenueChanges) {
      bestScore = score;
      bestVenueChanges = venueChanges;
      variants = new Map();
    }

    const option = createRouteOption(selected, matches, score, venueChanges);
    const key = `${option.goalMask}:${option.categoryMask}`;
    const existing = variants.get(key);
    if (!existing || preferSameMasks(option, existing)) variants.set(key, option);
  };

  const visit = (
    startIndex: number,
    selected: WaicEvent[],
    score: number,
  ) => {
    consider(selected, score);
    if (fixedEvents.length + selected.length >= dailyLimit) return;

    for (let index = startIndex; index < candidates.length; index += 1) {
      const event = candidates[index];
      selected.push(event);
      if (isFeasibleDay([...fixedEvents, ...selected])) {
        visit(
          index + 1,
          selected,
          score + (matches.get(event.id)?.score ?? 0),
        );
      }
      selected.pop();
    }
  };

  visit(0, [], 0);
  return [...variants.values()];
}

function combineRoutes(left: RouteOption, right: RouteOption): RouteOption {
  return {
    events: [...left.events, ...right.events].sort(compareEvents),
    score: left.score + right.score,
    venueChanges: left.venueChanges + right.venueChanges,
    goalMask: left.goalMask | right.goalMask,
    categoryMask: left.categoryMask | right.categoryMask,
    durationMinutes: left.durationMinutes + right.durationMinutes,
  };
}

function chooseFinalRoute(options: readonly RouteOption[]): RouteOption {
  return options.reduce((best, candidate) => {
    if (candidate.score !== best.score) return candidate.score > best.score ? candidate : best;
    if (candidate.venueChanges !== best.venueChanges) {
      return candidate.venueChanges < best.venueChanges ? candidate : best;
    }
    if (bitCount(candidate.goalMask) !== bitCount(best.goalMask)) {
      return bitCount(candidate.goalMask) > bitCount(best.goalMask) ? candidate : best;
    }
    if (candidate.durationMinutes !== best.durationMinutes) {
      return candidate.durationMinutes > best.durationMinutes ? candidate : best;
    }
    if (bitCount(candidate.categoryMask) !== bitCount(best.categoryMask)) {
      return bitCount(candidate.categoryMask) > bitCount(best.categoryMask)
        ? candidate
        : best;
    }
    return compareIds(
      candidate.events.map((event) => event.id),
      best.events.map((event) => event.id),
    ) < 0
      ? candidate
      : best;
  });
}

function buildItems(
  events: readonly WaicEvent[],
  matches: ReadonlyMap<number, EventMatch>,
  fixedIds: ReadonlySet<number>,
): PlannedEvent[] {
  const seenCategories = new Set<EventCategory>();

  return [...events].sort(compareEvents).map((event, index, sorted) => {
    const previous = sorted[index - 1];
    const reasons = [...(matches.get(event.id)?.reasons ?? [])];
    if (fixedIds.has(event.id)) {
      reasons.unshift({ type: "manual", label: "手动保留活动" });
    }
    if (seenCategories.size > 0 && !seenCategories.has(event.category)) {
      reasons.push({ type: "diversity", label: `补充主题：${event.category}` });
    }
    seenCategories.add(event.category);

    return {
      event,
      reasons,
      bufferFromPreviousMinutes:
        previous && previous.date === event.date
          ? recommendedVenueBuffer(previous.venue, event.venue)
          : 0,
    };
  });
}

function resolveFixedEvents(
  events: readonly WaicEvent[],
  state: PlannerState,
  selectedDates: readonly WaicDate[],
  availabilityByDate: ReadonlyMap<WaicDate, AvailabilityMinutes>,
  dailyLimit: number,
): WaicEvent[] {
  const eventById = new Map(events.map((event) => [event.id, event]));
  const fixedEvents = [...new Set(state.selectedEventIds)].map((id) => {
    const event = eventById.get(id);
    if (!event) throw new Error(`Fixed event ${id} was not found`);
    return event;
  });
  const selectedDateSet = new Set(selectedDates);

  fixedEvents.forEach((event) => {
    if (!selectedDateSet.has(event.date)) {
      throw new Error(`Fixed event ${event.id} is outside the selected dates`);
    }
    const availability = availabilityByDate.get(event.date);
    if (!availability || !isAvailable(event, availability)) {
      throw new Error(`Fixed event ${event.id} is outside availability`);
    }
  });

  selectedDates.forEach((date) => {
    const fixedDay = fixedEvents
      .filter((event) => event.date === date)
      .sort(compareEvents);
    if (fixedDay.length > dailyLimit) {
      throw new Error(
        `Fixed events exceed the ${dailyLimit}-event daily pace on ${date}`,
      );
    }

    fixedDay.slice(1).forEach((event, index) => {
      const previous = fixedDay[index];
      if (previous.endMinutes > event.startMinutes) {
        throw new Error(`Fixed events ${previous.id} and ${event.id} overlap`);
      }
      const buffer = recommendedVenueBuffer(previous.venue, event.venue);
      if (previous.endMinutes + buffer > event.startMinutes) {
        throw new Error(
          `Fixed events ${previous.id} and ${event.id} need a ${buffer}-minute venue-transfer buffer`,
        );
      }
    });
  });

  return fixedEvents.sort(compareEvents);
}

const REJECTION_LABELS: Record<RejectionReason["type"], string> = {
  "outside-availability": "不在可用时段内",
  "time-conflict": "与已选活动时间冲突",
  "venue-buffer": "换馆缓冲不足",
  "daily-limit": "已达到当日活动上限",
  "lower-match": "被更匹配的组合替代",
};

function rejectionReason(
  type: RejectionReason["type"],
  relatedEventIds: number[] = [],
): RejectionReason {
  return {
    type,
    label: REJECTION_LABELS[type],
    relatedEventIds: [...new Set(relatedEventIds)].sort((left, right) => left - right),
  };
}

function classifyRejection(
  event: WaicEvent,
  selected: readonly WaicEvent[],
  availability: AvailabilityMinutes,
  dailyLimit: number,
): RejectionReason {
  if (!isAvailable(event, availability)) {
    return rejectionReason("outside-availability");
  }

  const overlaps = selected.filter(
    (chosen) =>
      event.startMinutes < chosen.endMinutes && event.endMinutes > chosen.startMinutes,
  );
  if (overlaps.length > 0) {
    return rejectionReason(
      "time-conflict",
      overlaps.map((chosen) => chosen.id),
    );
  }

  const previous = selected
    .filter((chosen) => chosen.endMinutes <= event.startMinutes)
    .at(-1);
  const next = selected.find((chosen) => chosen.startMinutes >= event.endMinutes);
  const bufferConflicts: number[] = [];

  if (
    previous &&
    previous.endMinutes + recommendedVenueBuffer(previous.venue, event.venue) >
      event.startMinutes
  ) {
    bufferConflicts.push(previous.id);
  }
  if (
    next &&
    event.endMinutes + recommendedVenueBuffer(event.venue, next.venue) >
      next.startMinutes
  ) {
    bufferConflicts.push(next.id);
  }
  if (bufferConflicts.length > 0) {
    return rejectionReason("venue-buffer", bufferConflicts);
  }

  if (selected.length >= dailyLimit) return rejectionReason("daily-limit");
  return rejectionReason("lower-match");
}

function buildRejectedCandidates(
  events: readonly WaicEvent[],
  selected: readonly WaicEvent[],
  selectedDates: readonly WaicDate[],
  availabilityByDate: ReadonlyMap<WaicDate, AvailabilityMinutes>,
  dailyLimit: number,
  matches: ReadonlyMap<number, EventMatch>,
): RejectedCandidate[] {
  const selectedIds = new Set(selected.map((event) => event.id));
  const selectedDateSet = new Set(selectedDates);

  return events
    .filter(
      (event) =>
        selectedDateSet.has(event.date) &&
        !selectedIds.has(event.id) &&
        (matches.get(event.id)?.score ?? 0) > 0,
    )
    .map((event) => {
      const match = matches.get(event.id) as EventMatch;
      const selectedDay = selected.filter((chosen) => chosen.date === event.date);
      return {
        candidate: {
          event,
          relevanceReasons: [...match.reasons],
          directInterest: match.directInterest,
          rejection: classifyRejection(
            event,
            selectedDay,
            availabilityByDate.get(event.date) ?? { start: 0, end: 24 * 60 },
            dailyLimit,
          ),
        },
        score: match.score,
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score || compareEvents(left.candidate.event, right.candidate.event),
    )
    .map(({ candidate }) => candidate);
}

export function planRoute(
  events: readonly WaicEvent[],
  state: PlannerState,
): PlannerResult {
  const selectedDates = WAIC_DATES.filter((date) => state.dates.includes(date));
  const dailyLimit = PACE_DAILY_LIMIT[state.pace];
  const context = createMatchContext(state);
  const matches = new Map(events.map((event) => [event.id, matchEvent(event, context)]));
  const availabilityByDate = new Map(
    selectedDates.map((date) => [
      date,
      parseAvailability(date, state.availability[date]),
    ]),
  );
  const fixedEvents = resolveFixedEvents(
    events,
    state,
    selectedDates,
    availabilityByDate,
    dailyLimit,
  );
  const fixedIds = new Set(fixedEvents.map((event) => event.id));

  let combinedRoutes: RouteOption[] = [
    {
      events: [],
      score: 0,
      venueChanges: 0,
      goalMask: 0,
      categoryMask: 0,
      durationMinutes: 0,
    },
  ];

  selectedDates.forEach((date) => {
    const availability = availabilityByDate.get(date) as AvailabilityMinutes;
    const dayEvents = events.filter(
      (event) => event.date === date && isAvailable(event, availability),
    );
    const fixedDay = fixedEvents.filter((event) => event.date === date);
    const dayRoutes = bestDayRoutes(dayEvents, matches, dailyLimit, fixedDay);
    const next = new Map<string, RouteOption>();

    combinedRoutes.forEach((combined) => {
      dayRoutes.forEach((dayRoute) => {
        const candidate = combineRoutes(combined, dayRoute);
        const key = `${candidate.goalMask}:${candidate.categoryMask}`;
        const existing = next.get(key);
        if (!existing || preferSameMasks(candidate, existing)) next.set(key, candidate);
      });
    });

    combinedRoutes = [...next.values()];
  });

  const route = chooseFinalRoute(combinedRoutes);
  const items = buildItems(route.events, matches, fixedIds);
  const selectedMatches = route.events.map((event) => matches.get(event.id) as EventMatch);
  const goalsCovered = PLANNER_GOALS.filter((goal) =>
    selectedMatches.some((match) => match.goals.includes(goal)),
  );
  const dailyCounts = items.reduce<Partial<Record<WaicDate, number>>>((counts, item) => {
    counts[item.event.date] = (counts[item.event.date] ?? 0) + 1;
    return counts;
  }, {});

  return {
    items,
    rejectedHighRelevance: buildRejectedCandidates(
      events,
      route.events,
      selectedDates,
      availabilityByDate,
      dailyLimit,
      matches,
    ),
    metrics: {
      eventCount: items.length,
      contentMinutes: route.durationMinutes,
      venueChanges: route.venueChanges,
      transitionBufferMinutes: items.reduce(
        (total, item) => total + item.bufferFromPreviousMinutes,
        0,
      ),
      directInterestMatches: selectedMatches.filter((match) => match.directInterest)
        .length,
      identityMatches: selectedMatches.filter((match) => match.identityMatch).length,
      goalMatches: selectedMatches.reduce(
        (total, match) => total + match.goals.length,
        0,
      ),
      goalsCovered,
      goalCoverage: context.goals.length === 0 ? 0 : goalsCovered.length / context.goals.length,
      distinctCategories: new Set(route.events.map((event) => event.category)).size,
      dailyCounts,
    },
  };
}
