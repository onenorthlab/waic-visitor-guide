import { useMemo, useState } from "react";

import rawRows from "./data/waic-raw.json";
import { AppShell } from "./components/AppShell";
import { OpportunityLandscape } from "./components/OpportunityLandscape";
import type { ExplorerSelection } from "./components/explorerTypes";
import { displayText } from "./lib/display";
import { normalizeEvents } from "./lib/events";

export function App() {
  const events = useMemo(() => normalizeEvents(rawRows), []);
  const [selection, setSelection] = useState<ExplorerSelection | null>(null);

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
          <p className="landscape-filter-status" id="schedule" aria-live="polite">
            {selection
              ? language === "zh"
                ? `当前筛选：${displayText(selection.label)}`
                : `Current filter: ${displayText(selection.labelEn ?? selection.label)}`
              : language === "zh"
                ? "选择任一全景节点，下方日程将同步筛选。"
                : "Select any landscape node to filter the schedule below."}
          </p>
        </>
      )}
    </AppShell>
  );
}
