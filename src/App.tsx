import { useEffect, useMemo, useState } from "react";

import rawRows from "./data/waic-raw.json";
import { AppShell } from "./components/AppShell";
import { EventExplorer } from "./components/EventExplorer";
import { OpportunityLandscape } from "./components/OpportunityLandscape";
import { Planner } from "./components/Planner";
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

export function App() {
  const events = useMemo(() => normalizeEvents(rawRows), []);
  const [selection, setSelection] = useState<ExplorerSelection | null>(null);
  const [plannerState, setPlannerState] =
    useState<PlannerState>(initialPlannerState);

  useEffect(() => {
    savePlannerState(plannerState);
    let nextSearch: string;
    try {
      nextSearch = `?${encodePlannerState(plannerState)}`;
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
  }, [plannerState]);

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
        </>
      )}
    </AppShell>
  );
}
