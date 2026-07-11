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
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { displayText } from "../lib/display";
import { createRouteIcs } from "../lib/ics";
import { defineTranslations, sourceText } from "../lib/i18n";
import { categoryLabel, dateLabel, goalLabel, identityLabel } from "../lib/labels";
import { PLANNER_AUX_COPY } from "../lib/uiCopy";
import {
  PLANNER_GOALS,
  PLANNER_IDENTITIES,
  planRoute,
} from "../lib/planner";
import { DEFAULT_AVAILABILITY } from "../lib/plannerDefaults";
import { encodePlannerState } from "../lib/share";
import {
  WAIC_CATEGORIES,
  WAIC_DATES,
  type PlannedEvent,
  type PlannerResult,
  type PlannerState,
  type WaicDate,
  type WaicEvent,
} from "../lib/types";
import type { Language } from "./AppShell";

const copy = defineTranslations({
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
    routeSummary: (count: number) => `路线包含 ${count} 场活动`,
    emptySummary: "规划结果：0 场可行活动",
    icsFailure: "ICS 生成失败，请重试",
    eligibilityLabel: "入场资格提醒",
    eligibility:
      "路线推荐不等于入场资格。论坛活动仍需单场报名或邀请。",
    officialRegistration: "前往 WAIC 官方注册",
    excludeRecommendation: "移除并重算",
    excludeRecommendationLabel: (title: string) =>
      `从推荐路线移除并重算：${title}`,
    routeRecalculated: (title: string) =>
      `已移除「${title}」，路线已重新计算。`,
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
    routeSummary: (count: number) => `Route includes ${count} events`,
    emptySummary: "Planner result: no feasible events",
    icsFailure: "ICS creation failed. Try again.",
    eligibilityLabel: "Admission reminder",
    eligibility:
      "A route recommendation does not grant admission. Forum sessions still require individual registration or an invitation.",
    officialRegistration: "Open WAIC official registration",
    excludeRecommendation: "Remove and recalculate",
    excludeRecommendationLabel: (title: string) =>
      `Remove and recalculate recommendation: ${title}`,
    routeRecalculated: (title: string) =>
      `Removed “${title}” and recalculated the route.`,
  },
  ja: {
    title: "30秒で来場ルートを作成", intro: "役割、目的、参加可能時間を選ぶと、関連性、重複、会場移動を考慮してルートを作成します。", identity: "あなたの役割", identityPlaceholder: "役割を選択", goals: "来場目的、最大2つ", goalLimit: "目的は2つまで選択できます", interests: "関心テーマ", dates: "日付と参加可能時間", invitedNote: "7月17日 13:30-17:00は招待者限定です。参加資格をご確認ください。", pace: "参加ペース", paceLabels: ["1日2件", "1日3件", "1日4件"], generate: "ルートを作成", resultTitle: "ルートを作成しました", resultIntro: "各項目に推薦理由と移動・集中コストを表示します。", emptyBefore: "左側の条件を入力すると、ルート、重複、会場移動コストが表示されます。", noRoute: "実行可能なルートが見つかりません", loosen: "日付、参加可能時間、関心テーマを広げてください。", errorTitle: "ルート計算に失敗しました", errorSource: "出典：WAIC 2026全フォーラム日程。時間帯を確認して再試行してください。", retry: "再計算", manualCount: (n: number) => `手動追加 ${n}件`, manualTitle: "手動で追加したイベント", remove: "削除", rejected: "関連性は高いがルート外のイベント", noRejected: "追加の高関連競合イベントはありません。", routeSummary: (n: number) => `ルートは${n}件です`, emptySummary: "計画結果：実行可能なイベント0件", icsFailure: "ICSの作成に失敗しました。", eligibilityLabel: "入場資格の注意", eligibility: "ルート推薦は入場資格ではありません。各フォーラムへの登録または招待が必要です。", officialRegistration: "WAIC公式登録を開く", excludeRecommendation: "削除して再計算", excludeRecommendationLabel: (title: string) => `推薦から削除して再計算：${title}`, routeRecalculated: (title: string) => `「${title}」を削除し、ルートを再計算しました。`,
  },
  ko: {
    title: "30초 만에 방문 동선 만들기", intro: "역할, 목표, 가능한 시간을 선택하면 관련성, 일정 충돌, 장소 이동을 고려해 동선을 만듭니다.", identity: "나의 역할", identityPlaceholder: "역할 선택", goals: "방문 목표, 최대 2개", goalLimit: "목표는 2개까지 선택할 수 있습니다", interests: "관심 주제", dates: "날짜와 가능한 시간", invitedNote: "7월 17일 13:30-17:00은 초청자만 참여할 수 있습니다.", pace: "방문 속도", paceLabels: ["하루 2개", "하루 3개", "하루 4개"], generate: "동선 만들기", resultTitle: "동선이 준비되었습니다", resultIntro: "각 항목에 추천 이유와 이동·집중 비용을 표시합니다.", emptyBefore: "왼쪽 조건을 입력하면 동선, 충돌, 장소 이동 비용이 표시됩니다.", noRoute: "가능한 동선을 찾지 못했습니다", loosen: "날짜, 가능한 시간 또는 관심 주제를 넓혀 보세요.", errorTitle: "동선 계산 실패", errorSource: "출처: WAIC 2026 전체 포럼 일정. 시간을 확인하고 다시 시도하세요.", retry: "다시 계산", manualCount: (n: number) => `수동 추가 ${n}개`, manualTitle: "수동으로 추가한 행사", remove: "제거", rejected: "관련성이 높지만 동선에서 제외된 행사", noRejected: "추가로 충돌하는 고관련 행사가 없습니다.", routeSummary: (n: number) => `동선에 ${n}개 행사 포함`, emptySummary: "계획 결과: 가능한 행사 없음", icsFailure: "ICS 생성에 실패했습니다.", eligibilityLabel: "입장 자격 안내", eligibility: "동선 추천은 입장 자격이 아닙니다. 각 포럼 등록 또는 초청이 필요합니다.", officialRegistration: "WAIC 공식 등록 열기", excludeRecommendation: "제거 후 재계산", excludeRecommendationLabel: (title: string) => `추천에서 제거 후 재계산: ${title}`, routeRecalculated: (title: string) => `‘${title}’을 제거하고 동선을 다시 계산했습니다.`,
  },
  fr: {
    title: "Créez votre parcours en 30 secondes", intro: "Choisissez votre rôle, vos objectifs et vos disponibilités. Le planificateur équilibre pertinence, conflits et changements de lieu.", identity: "Votre rôle", identityPlaceholder: "Choisir un rôle", goals: "Objectifs, 2 maximum", goalLimit: "Choisissez au maximum 2 objectifs", interests: "Thèmes d’intérêt", dates: "Dates et disponibilités", invitedNote: "Le 17 juillet de 13:30 à 17:00 est réservé aux invités.", pace: "Rythme de visite", paceLabels: ["2 événements par jour", "3 événements par jour", "4 événements par jour"], generate: "Créer mon parcours", resultTitle: "Parcours prêt", resultIntro: "Chaque étape explique sa pertinence et son coût en attention.", emptyBefore: "Renseignez vos préférences pour afficher le parcours, les conflits et les changements de lieu.", noRoute: "Aucun parcours réalisable", loosen: "Élargissez les dates, les horaires ou les thèmes.", errorTitle: "Échec du calcul", errorSource: "Source : programme complet WAIC 2026. Vérifiez les horaires et réessayez.", retry: "Recalculer", manualCount: (n: number) => `${n} ajoutés manuellement`, manualTitle: "Événements ajoutés manuellement", remove: "Retirer", rejected: "Événements pertinents non retenus", noRejected: "Aucun autre conflit à forte pertinence.", routeSummary: (n: number) => `Le parcours comprend ${n} événements`, emptySummary: "Résultat : aucun événement réalisable", icsFailure: "Échec de la création du fichier ICS.", eligibilityLabel: "Rappel d’accès", eligibility: "Une recommandation ne donne pas accès. Chaque forum exige une inscription ou une invitation.", officialRegistration: "Ouvrir l’inscription WAIC", excludeRecommendation: "Retirer et recalculer", excludeRecommendationLabel: (title: string) => `Retirer et recalculer : ${title}`, routeRecalculated: (title: string) => `« ${title} » a été retiré et le parcours recalculé.`,
  },
  de: {
    title: "Besuchsroute in 30 Sekunden erstellen", intro: "Wählen Sie Rolle, Ziele und verfügbare Zeit. Der Planer berücksichtigt Relevanz, Konflikte und Ortswechsel.", identity: "Ihre Rolle", identityPlaceholder: "Rolle wählen", goals: "Besuchsziele, höchstens 2", goalLimit: "Wählen Sie höchstens 2 Ziele", interests: "Interessenthemen", dates: "Daten und Verfügbarkeit", invitedNote: "Der 17. Juli von 13:30-17:00 ist nur für eingeladene Gäste.", pace: "Besuchstempo", paceLabels: ["2 Veranstaltungen pro Tag", "3 Veranstaltungen pro Tag", "4 Veranstaltungen pro Tag"], generate: "Route erstellen", resultTitle: "Route ist bereit", resultIntro: "Jeder Eintrag erklärt Relevanz und Aufmerksamkeitskosten.", emptyBefore: "Füllen Sie die Präferenzen aus, um Route, Konflikte und Ortswechsel zu sehen.", noRoute: "Keine mögliche Route gefunden", loosen: "Erweitern Sie Daten, Zeiten oder Themen.", errorTitle: "Routenberechnung fehlgeschlagen", errorSource: "Quelle: vollständiges WAIC-2026-Programm. Prüfen Sie die Zeiten.", retry: "Neu berechnen", manualCount: (n: number) => `${n} manuell hinzugefügt`, manualTitle: "Manuell hinzugefügte Veranstaltungen", remove: "Entfernen", rejected: "Relevante, nicht aufgenommene Veranstaltungen", noRejected: "Keine weiteren Konflikte mit hoher Relevanz.", routeSummary: (n: number) => `Route enthält ${n} Veranstaltungen`, emptySummary: "Ergebnis: keine mögliche Veranstaltung", icsFailure: "ICS-Erstellung fehlgeschlagen.", eligibilityLabel: "Zugangshinweis", eligibility: "Eine Empfehlung gewährt keinen Zutritt. Foren erfordern Anmeldung oder Einladung.", officialRegistration: "Offizielle WAIC-Anmeldung öffnen", excludeRecommendation: "Entfernen und neu berechnen", excludeRecommendationLabel: (title: string) => `Entfernen und neu berechnen: ${title}`, routeRecalculated: (title: string) => `„${title}“ wurde entfernt und die Route neu berechnet.`,
  },
  es: {
    title: "Crea tu ruta de visita en 30 segundos", intro: "Elige tu perfil, objetivos y tiempo disponible. El planificador equilibra relevancia, conflictos y cambios de recinto.", identity: "Tu perfil", identityPlaceholder: "Selecciona un perfil", goals: "Objetivos, máximo 2", goalLimit: "Elige como máximo 2 objetivos", interests: "Temas de interés", dates: "Fechas y disponibilidad", invitedNote: "El 17 de julio de 13:30 a 17:00 es solo con invitación.", pace: "Ritmo de visita", paceLabels: ["2 actividades al día", "3 actividades al día", "4 actividades al día"], generate: "Crear mi ruta", resultTitle: "Ruta preparada", resultIntro: "Cada paso explica su relevancia y coste de atención.", emptyBefore: "Completa tus preferencias para ver la ruta, conflictos y traslados.", noRoute: "No se encontró una ruta viable", loosen: "Amplía las fechas, horarios o temas.", errorTitle: "Error al calcular la ruta", errorSource: "Fuente: programa completo WAIC 2026. Revisa los horarios.", retry: "Volver a calcular", manualCount: (n: number) => `${n} añadidas manualmente`, manualTitle: "Actividades añadidas manualmente", remove: "Quitar", rejected: "Actividades relevantes no incluidas", noRejected: "No hay más conflictos de alta relevancia.", routeSummary: (n: number) => `La ruta incluye ${n} actividades`, emptySummary: "Resultado: ninguna actividad viable", icsFailure: "No se pudo crear el archivo ICS.", eligibilityLabel: "Recordatorio de acceso", eligibility: "Una recomendación no concede acceso. Cada foro requiere inscripción o invitación.", officialRegistration: "Abrir registro oficial de WAIC", excludeRecommendation: "Quitar y recalcular", excludeRecommendationLabel: (title: string) => `Quitar y recalcular: ${title}`, routeRecalculated: (title: string) => `Se quitó «${title}» y se recalculó la ruta.`,
  },
  ar: {
    title: "أنشئ مسار زيارتك في 30 ثانية", intro: "اختر دورك وأهدافك ووقتك المتاح. يوازن المخطط بين الصلة والتعارض والتنقل بين الأماكن.", identity: "دورك", identityPlaceholder: "اختر دوراً", goals: "أهداف الزيارة، بحد أقصى هدفان", goalLimit: "اختر هدفين كحد أقصى", interests: "الموضوعات المهمة", dates: "التواريخ والأوقات المتاحة", invitedNote: "يوم 17 يوليو من 13:30 إلى 17:00 مخصص للمدعوين فقط.", pace: "وتيرة الزيارة", paceLabels: ["فعاليتان يومياً", "3 فعاليات يومياً", "4 فعاليات يومياً"], generate: "أنشئ مساري", resultTitle: "المسار جاهز", resultIntro: "يوضح كل بند سبب التوصية وتكلفة الانتباه.", emptyBefore: "أكمل تفضيلاتك لعرض المسار والتعارضات وتكلفة التنقل.", noRoute: "لم يتم العثور على مسار ممكن", loosen: "وسّع التواريخ أو الأوقات أو الموضوعات.", errorTitle: "فشل حساب المسار", errorSource: "المصدر: جدول منتديات WAIC 2026 الكامل. تحقق من الأوقات.", retry: "إعادة الحساب", manualCount: (n: number) => `أضيفت ${n} يدوياً`, manualTitle: "فعاليات أضيفت يدوياً", remove: "إزالة", rejected: "فعاليات مهمة لم تدخل المسار", noRejected: "لا توجد تعارضات إضافية عالية الصلة.", routeSummary: (n: number) => `يتضمن المسار ${n} فعالية`, emptySummary: "النتيجة: لا توجد فعاليات ممكنة", icsFailure: "فشل إنشاء ملف ICS.", eligibilityLabel: "تذكير بالدخول", eligibility: "توصية المسار لا تمنح حق الدخول. تتطلب كل جلسة تسجيلاً أو دعوة.", officialRegistration: "فتح تسجيل WAIC الرسمي", excludeRecommendation: "إزالة وإعادة الحساب", excludeRecommendationLabel: (title: string) => `إزالة وإعادة الحساب: ${title}`, routeRecalculated: (title: string) => `تمت إزالة «${title}» وإعادة حساب المسار.`,
  },
});

function eventTitle(event: WaicEvent, language: Language): string {
  return displayText(sourceText(event.title, language));
}

function formatHours(minutes: number, language: Language): string {
  const hours = Math.round((minutes / 60) * 10) / 10;
  return PLANNER_AUX_COPY[language].hour(hours);
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
  hasSelectedGoals: boolean;
  language?: Language;
}

export function AttentionBudget({
  result,
  hasSelectedGoals,
  language = "zh",
}: AttentionBudgetProps) {
  const aux = PLANNER_AUX_COPY[language];
  const metrics = [
    [aux.metricLabels[0], aux.metricValues[0](result.metrics.eventCount)],
    [aux.metricLabels[1], formatHours(result.metrics.contentMinutes, language)],
    [aux.metricLabels[2], hasSelectedGoals ? `${Math.round(result.metrics.goalCoverage * 100)}%` : aux.notSet],
    [aux.metricLabels[3], aux.metricValues[1](result.metrics.distinctCategories)],
    [aux.metricLabels[4], aux.metricValues[2](result.metrics.venueChanges)],
    [aux.metricLabels[5], aux.metricValues[3](result.metrics.transitionBufferMinutes)],
  ];

  return (
    <section className="attention-budget" aria-label={aux.attention}>
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
  fixedEventIds?: ReadonlySet<number>;
  onExclude?: (event: WaicEvent) => void;
  language?: Language;
}

export function RouteTimeline({
  items,
  fixedEventIds = new Set<number>(),
  onExclude,
  language = "zh",
}: RouteTimelineProps) {
  const reducedMotion = useReducedMotion();
  const content = copy[language];
  const aux = PLANNER_AUX_COPY[language];

  return (
    <div className="route-timeline">
      {items.map((item, index) => {
        const showDate = index === 0 || items[index - 1].event.date !== item.event.date;
        return (
          <div className="route-entry-wrap" key={item.event.id}>
            {showDate ? (
              <h4 className="route-date">{dateLabel(item.event.date, language)}</h4>
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
                    categoryLabel(item.event.category, language),
                  )}
                </p>
                <h4>{eventTitle(item.event, language)}</h4>
                <p className="route-location">
                  <MapPin aria-hidden="true" weight="fill" />
                  {displayText(sourceText(item.event.location, language))}
                </p>
                <div className="route-reasons" aria-label={aux.reasonsLabel}>
                  {item.reasons.map((reason, reasonIndex) => (
                    <span key={`${reason.type}-${reasonIndex}`}>
                      {aux.reasons[reason.type]}
                    </span>
                  ))}
                </div>
                {item.bufferFromPreviousMinutes > 0 ? (
                  <p className="route-buffer">
                    <Clock aria-hidden="true" weight="bold" />
                    {aux.buffer(item.bufferFromPreviousMinutes)}
                  </p>
                ) : null}
                {!fixedEventIds.has(item.event.id) && onExclude ? (
                  <button
                    className="route-exclude-button"
                    type="button"
                    aria-label={content.excludeRecommendationLabel(
                      eventTitle(item.event, language),
                    )}
                    onClick={() => onExclude(item.event)}
                  >
                    <X aria-hidden="true" weight="bold" />
                    {content.excludeRecommendation}
                  </button>
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
  const aux = PLANNER_AUX_COPY[language];

  const shareRoute = async () => {
    try {
      const params = new URLSearchParams(encodePlannerState(state));
      params.set("view", "route");
      const url = `${window.location.origin}${window.location.pathname}?${params.toString()}#planner`;
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: "WAIC 2026 Visitor Guide",
          text: aux.shareText,
          url,
        });
        setStatus(aux.shareOpened);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setStatus(aux.copied);
      } else {
        setStatus(aux.copyUnavailable);
      }
    } catch (error) {
      setStatus(
        error instanceof DOMException && error.name === "AbortError"
          ? aux.cancelled
          : aux.shareFailed,
      );
    }
  };

  const downloadIcs = () => {
    let url: string | null = null;
    let anchor: HTMLAnchorElement | null = null;
    try {
      const ics = createRouteIcs(events);
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      url = URL.createObjectURL(blob);
      anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "waic-2026-route.ics";
      document.body.append(anchor);
      anchor.click();
      setStatus(aux.icsCreated);
    } catch {
      setStatus(copy[language].icsFailure);
    } finally {
      anchor?.remove();
      if (url) {
        const objectUrl = url;
        window.setTimeout(() => {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {
            // The download has already been handed off; revocation is best effort.
          }
        }, 0);
      }
    }
  };

  return (
    <div className="route-actions">
      <button className="button button-secondary" type="button" onClick={shareRoute}>
        <ShareNetwork aria-hidden="true" weight="bold" />
        {aux.shareRoute}
      </button>
      <button
        className="button button-secondary"
        type="button"
        onClick={downloadIcs}
        disabled={events.length === 0}
      >
        <DownloadSimple aria-hidden="true" weight="bold" />
        {aux.downloadIcs}
      </button>
      <span className="route-action-status" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}

interface PlannerProps {
  events: readonly WaicEvent[];
  state: PlannerState;
  onStateChange: (state: PlannerState) => void;
  routeGenerated?: boolean;
  onRouteGeneratedChange?: (generated: boolean) => void;
  language?: Language;
}

function initialPlannerComputation(
  events: readonly WaicEvent[],
  state: PlannerState,
  generated: boolean,
): { result: PlannerResult | null; error: string } {
  if (!generated) return { result: null, error: "" };
  try {
    return { result: planRoute(events, state), error: "" };
  } catch (routeError) {
    return {
      result: null,
      error: routeError instanceof Error ? routeError.message : String(routeError),
    };
  }
}

export function Planner({
  events,
  state,
  onStateChange,
  routeGenerated,
  onRouteGeneratedChange,
  language = "zh",
}: PlannerProps) {
  const content = copy[language];
  const [initialComputation] = useState(() =>
    initialPlannerComputation(events, state, routeGenerated === true),
  );
  const [result, setResult] = useState<PlannerResult | null>(
    initialComputation.result,
  );
  const [internalRouteGenerated, setInternalRouteGenerated] = useState(false);
  const hasGenerated = routeGenerated ?? internalRouteGenerated;
  const [goalMessage, setGoalMessage] = useState("");
  const [routeUpdateMessage, setRouteUpdateMessage] = useState("");
  const [error, setError] = useState(initialComputation.error);
  const routeSummaryRef = useRef<HTMLParagraphElement>(null);
  const eventById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  );
  const manualEvents = uniqueEvents(
    state.selectedEventIds
      .map((id) => eventById.get(id))
      .filter((event): event is WaicEvent => Boolean(event)),
  );
  const fixedEventIds = useMemo(
    () => new Set(state.selectedEventIds),
    [state.selectedEventIds],
  );

  const setRouteGenerated = (generated: boolean) => {
    if (routeGenerated === undefined) setInternalRouteGenerated(generated);
    onRouteGeneratedChange?.(generated);
  };

  const update = (next: PlannerState, affectsRoute = true) => {
    onStateChange(next);
    if (affectsRoute) {
      setResult(null);
      setRouteGenerated(false);
      setRouteUpdateMessage("");
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
    setRouteGenerated(true);
    setRouteUpdateMessage("");
    setError("");
    try {
      setResult(planRoute(events, state));
    } catch (routeError) {
      setResult(null);
      setError(routeError instanceof Error ? routeError.message : String(routeError));
    }
  };

  useEffect(() => {
    if (!hasGenerated) return;
    setError("");
    try {
      setResult(planRoute(events, state));
    } catch (routeError) {
      setResult(null);
      setError(routeError instanceof Error ? routeError.message : String(routeError));
    }
  }, [events, hasGenerated, state]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    generateRoute();
  };

  const removeManualEvent = (event: WaicEvent) => {
    const next = {
      ...state,
      selectedEventIds: state.selectedEventIds.filter((id) => id !== event.id),
      excludedEventIds: [
        ...new Set([...state.excludedEventIds, event.id]),
      ],
    };
    onStateChange(next);
    if (hasGenerated) {
      setError("");
      try {
        setResult(planRoute(events, next));
      } catch (routeError) {
        setResult(null);
        setError(routeError instanceof Error ? routeError.message : String(routeError));
      }
    }
  };

  const excludeRecommendedEvent = (event: WaicEvent) => {
    setRouteUpdateMessage(
      content.routeRecalculated(eventTitle(event, language)),
    );
    onStateChange({
      ...state,
      excludedEventIds: [
        ...new Set([...state.excludedEventIds, event.id]),
      ],
    });
    window.setTimeout(() => routeSummaryRef.current?.focus(), 0);
  };

  const actionEvents = result?.items.map((item) => item.event) ?? [];

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
                  {identityLabel(identity, language)}
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
                    {goalLabel(goal, language)}
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
                      categoryLabel(category, language),
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
                    <span>{dateLabel(date, language)}</span>
                  </label>
                  {state.dates.includes(date) ? (
                    <div className="availability-row">
                      <label>
                        <span>
                          {PLANNER_AUX_COPY[language].startTime(dateLabel(date, language))}
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
                          {PLANNER_AUX_COPY[language].endTime(dateLabel(date, language))}
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
          <p
            className="control-message"
            ref={routeSummaryRef}
            tabIndex={-1}
            aria-live="polite"
          >
            {!error && hasGenerated
              ? result?.items.length
                ? content.routeSummary(result.items.length)
                : content.emptySummary
              : ""}
          </p>
          <p className="route-update-status" role="status" aria-live="polite">
            {routeUpdateMessage}
          </p>
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
              <aside
                className="route-eligibility-note"
                role="note"
                aria-label={content.eligibilityLabel}
              >
                <WarningCircle aria-hidden="true" weight="fill" />
                <div>
                  <p>{content.eligibility}</p>
                  <a
                    href="https://www.worldaic.com.cn/register"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {content.officialRegistration}
                  </a>
                </div>
              </aside>
              <AttentionBudget
                result={result}
                hasSelectedGoals={state.goals.length > 0}
                language={language}
              />
              <RouteTimeline
                items={result.items}
                fixedEventIds={fixedEventIds}
                onExclude={excludeRecommendedEvent}
                language={language}
              />
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
                          {PLANNER_AUX_COPY[language].rejections[candidate.rejection.type]}
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
                      {dateLabel(event.date, language)} {event.startTime}-{event.endTime}
                    </span>
                    <strong>{eventTitle(event, language)}</strong>
                  </div>
                  <button
                    className="remove-event-button"
                    type="button"
                    aria-label={`${PLANNER_AUX_COPY[language].removeFromRoute}：${eventTitle(event, language)}`}
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
