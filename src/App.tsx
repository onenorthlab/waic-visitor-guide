import { useEffect, useMemo, useState } from "react";

import rawRows from "./data/waic-raw.json";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { AppShell } from "./components/AppShell";
import { EventExplorer } from "./components/EventExplorer";
import { OpportunityLandscape } from "./components/OpportunityLandscape";
import { Planner } from "./components/Planner";
import { VenueGuide } from "./components/VenueGuide";
import type { ExplorerSelection } from "./components/explorerTypes";
import { displayText } from "./lib/display";
import { normalizeEvents } from "./lib/events";
import {
  DEFAULT_PLANNER_STATE,
  decodePlannerState,
  encodePlannerState,
  loadPlannerState,
  savePlannerState,
} from "./lib/share";
import type { PlannerState } from "./lib/types";

function initialPlannerState(): PlannerState {
  if (typeof window === "undefined") return DEFAULT_PLANNER_STATE;
  return decodePlannerState(window.location.search, loadPlannerState());
}

function initialRouteGenerated(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("view") === "route";
}

function VisitorGuideApp() {
  const events = useMemo(() => normalizeEvents(rawRows), []);
  const [selection, setSelection] = useState<ExplorerSelection | null>(null);
  const [plannerState, setPlannerState] =
    useState<PlannerState>(initialPlannerState);
  const [routeGenerated, setRouteGenerated] = useState(initialRouteGenerated);

  useEffect(() => {
    savePlannerState(plannerState);
    let nextSearch: string;
    try {
      const params = new URLSearchParams(encodePlannerState(plannerState));
      if (routeGenerated) params.set("view", "route");
      nextSearch = `?${params.toString()}`;
    } catch {
      return;
    }
    if (window.location.search !== nextSearch) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${nextSearch}${window.location.hash}`,
      );
    }
  }, [plannerState, routeGenerated]);

  return (
    <AppShell>
      {(language) => (
        <>
          <OpportunityLandscape
            events={events}
            onSelect={setSelection}
            activeSelection={selection}
            language={language}
          />
          <Planner
            events={events}
            state={plannerState}
            onStateChange={setPlannerState}
            routeGenerated={routeGenerated}
            onRouteGeneratedChange={setRouteGenerated}
            language={language}
          />
          <p className="landscape-filter-status" aria-live="polite">
            {selection
              ? language === "zh"
                ? `当前筛选：${displayText(selection.label)}`
                : `Current filter: ${displayText(selection.labelEn ?? selection.label)}`
              : language === "zh"
                ? "选择任一全景节点，下方日程将同步筛选。"
                : "Select any landscape node to filter the schedule below."}
          </p>
          <EventExplorer
            events={events}
            selection={selection}
            onClearSelection={() => setSelection(null)}
            plannerState={plannerState}
            onPlannerStateChange={setPlannerState}
            language={language}
          />
          <VenueGuide language={language} />
        </>
      )}
    </AppShell>
  );
}

export function App() {
  return (
    <AppErrorBoundary>
      <VisitorGuideApp />
    </AppErrorBoundary>
  );
}
