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
import { categoryLabel, dateLabel, venueLabel } from "./lib/labels";
import {
  DEFAULT_PLANNER_STATE,
  decodePlannerState,
  encodePlannerState,
  loadPlannerState,
  savePlannerState,
} from "./lib/share";
import type { PlannerState } from "./lib/types";
import { APP_STATUS_COPY } from "./lib/uiCopy";

function explorerSelectionLabel(
  selection: ExplorerSelection,
  language: Parameters<typeof categoryLabel>[1],
): string {
  if (selection.categories?.[0]) return categoryLabel(selection.categories[0], language);
  if (selection.venues?.[0]) return venueLabel(selection.venues[0], language);
  if (selection.dates?.[0]) {
    const range = (selection.labelEn ?? selection.label).split(" ").at(-1) ?? "";
    return `${dateLabel(selection.dates[0], language)} ${range}`.trim();
  }
  return language === "zh" ? selection.label : selection.labelEn ?? selection.label;
}

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
        <>{/* UI copy is selected by exact locale; only source event text may fall back to English. */}
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
              ? APP_STATUS_COPY[language].current(
                  displayText(explorerSelectionLabel(selection, language)),
                )
              : APP_STATUS_COPY[language].prompt}
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
