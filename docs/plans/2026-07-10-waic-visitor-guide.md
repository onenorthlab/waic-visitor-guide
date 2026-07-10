# WAIC 2026 Visitor Guide Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and deploy an independent, responsive WAIC 2026 visitor guide that turns 175 forum records into an explainable, conflict-free personal route.

**Architecture:** A static React/Vite SPA normalizes a checked-in raw schedule at load time, computes filters and routes entirely in the browser, and persists user selections in the URL and localStorage. Cloudflare Workers Static Assets serves the generated `dist` directory with SPA fallback; v1 has no database, login, map key, or server API.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Phosphor Icons, Vitest, Testing Library, Playwright CLI, Cloudflare Wrangler.

---

### Task 1: Project skeleton and isolated Cloudflare target

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `wrangler.jsonc`
- Create: `.gitignore`
- Create: `src/main.tsx`

**Step 1: Add package scripts and dependencies**

Use scripts:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "typecheck": "tsc -b --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "data:check": "vitest run src/data/data-integrity.test.ts",
  "deploy": "pnpm build && wrangler deploy"
}
```

Install only the requested stack. Verify every imported package exists in `package.json` before using it.

**Step 2: Configure the Worker**

`wrangler.jsonc` must use a new name and no bindings:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "waic-visitor-guide",
  "compatibility_date": "2026-07-10",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  },
  "observability": { "enabled": true }
}
```

**Step 3: Install and verify the empty shell**

Run: `pnpm install`

Run: `pnpm typecheck`

Expected: exit 0 with no production page beyond a minimal root mount.

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig*.json vite.config.ts index.html wrangler.jsonc .gitignore src/main.tsx
git commit -m "chore: scaffold isolated WAIC visitor guide"
```

### Task 2: Raw schedule and data integrity gate

**Files:**
- Create: `src/data/waic-raw.json`
- Create: `src/data/data-integrity.test.ts`
- Create: `src/lib/events.ts`
- Create: `src/lib/types.ts`

**Step 1: Copy the audited source rows**

Copy the artifact-tool extraction into `src/data/waic-raw.json`. The file includes the header row and 175 data rows. Do not manually translate or enrich rows.

**Step 2: Write the failing integrity test**

```ts
import rawRows from "./waic-raw.json";
import { normalizeEvents } from "../lib/events";

it("normalizes the complete 175-event WAIC schedule", () => {
  const events = normalizeEvents(rawRows);
  expect(events).toHaveLength(175);
  expect(new Set(events.map((event) => event.id)).size).toBe(175);
  expect(events[0]).toMatchObject({
    id: 1,
    date: "2026-07-17",
    startTime: "14:00",
    endTime: "17:00",
    venueGroup: "expo-center",
  });
});

it("keeps source totals stable", () => {
  const events = normalizeEvents(rawRows);
  expect(countBy(events, "date")).toEqual({
    "2026-07-17": 27,
    "2026-07-18": 65,
    "2026-07-19": 64,
    "2026-07-20": 19,
  });
});
```

**Step 3: Run to verify failure**

Run: `pnpm test src/data/data-integrity.test.ts`

Expected: module or export missing. Add the minimal module signatures, rerun, and confirm assertion failure before implementing parsing.

**Step 4: Implement minimal normalization**

Implement:

```ts
export function splitBilingual(value: string): [string, string?];
export function parseDate(value: string): EventDate;
export function parseTimeRange(value: string): ParsedTimeRange;
export function canonicalVenue(value: string, locationZh: string): VenueGroupId;
export function normalizeEvents(rows: RawRows): Event[];
export function countBy<T>(items: T[], key: keyof T): Record<string, number>;
```

Throw a descriptive error for missing cells, duplicate IDs, unknown dates, invalid times, or `endMinutes <= startMinutes`.

**Step 5: Verify green**

Run: `pnpm run data:check`

Expected: all integrity tests pass, including exact category and venue totals.

**Step 6: Commit**

```bash
git add src/data src/lib/events.ts src/lib/types.ts
git commit -m "feat: normalize the complete WAIC schedule"
```

### Task 3: Search, filter, and opportunity summaries

**Files:**
- Create: `src/lib/discovery.test.ts`
- Create: `src/lib/discovery.ts`

**Step 1: Write failing behavior tests**

Cover Chinese search, English search, combined date/category/venue filters, zero-result filters, day-slot counts, category counts, and venue counts.

```ts
it("finds an event by English title", () => {
  expect(filterEvents(events, { query: "memory-native" }).map((event) => event.id)).toContain(16);
});

it("returns real golden-day share", () => {
  expect(goldenDayShare(events)).toBeCloseTo(129 / 175, 5);
});
```

**Step 2: Verify red**

Run: `pnpm test src/lib/discovery.test.ts`

Expected: missing implementation, then assertion failures after minimal signatures are added.

**Step 3: Implement minimal pure functions**

Implement `filterEvents`, `buildTimeHeatmap`, `buildCategorySummary`, `buildVenueSummary`, and `goldenDayShare`. Keep all returned arrays deterministically sorted.

**Step 4: Verify green**

Run: `pnpm test src/lib/discovery.test.ts src/data/data-integrity.test.ts`

Expected: all pass.

**Step 5: Commit**

```bash
git add src/lib/discovery.ts src/lib/discovery.test.ts
git commit -m "feat: add schedule discovery transforms"
```

### Task 4: Explainable route planner

**Files:**
- Create: `src/lib/venue.ts`
- Create: `src/lib/planner.test.ts`
- Create: `src/lib/planner.ts`
- Modify: `src/lib/types.ts`

**Step 1: Write failing route tests**

Required cases:

- never choose overlapping events;
- enforce same-venue and cross-venue buffer;
- respect selected days and available time;
- prefer direct interests;
- use identity goals only as secondary weights;
- use a diversity tie-breaker;
- cap events by pace;
- produce metrics and human-readable reasons;
- report a rejected high-relevance conflict alternative.

```ts
it("rejects a cross-venue event that cannot satisfy the suggested buffer", () => {
  const result = planRoute(fixtures, request);
  expect(result.events.map((event) => event.id)).toEqual([1, 3]);
  expect(result.rejected.find((item) => item.event.id === 2)?.reason).toBe("transfer-buffer");
});
```

**Step 2: Verify red**

Run: `pnpm test src/lib/planner.test.ts`

Expected: assertions fail because planning behavior is absent.

**Step 3: Implement venue suggestions**

`suggestedTransferMinutes(from, to)` must return 10, 15, 25, 30, 45, or 60 according to the approved model. Keep the official shuttle frequency in separate display metadata; never call the suggested minutes official travel time.

**Step 4: Implement weighted interval scheduling**

Use a dynamic-programming state that tracks selected items, total match weight, event count, venue switches, covered targets, and content minutes. Comparator order:

1. higher match weight;
2. fewer venue switches;
3. more target coverage;
4. more content minutes;
5. stable ascending event IDs.

**Step 5: Verify green**

Run: `pnpm test src/lib/planner.test.ts`

Expected: all route cases pass.

**Step 6: Commit**

```bash
git add src/lib/venue.ts src/lib/planner.ts src/lib/planner.test.ts src/lib/types.ts
git commit -m "feat: add explainable conflict-free route planning"
```

### Task 5: Share state, local persistence, and calendar export

**Files:**
- Create: `src/lib/share.test.ts`
- Create: `src/lib/share.ts`
- Create: `src/lib/ics.test.ts`
- Create: `src/lib/ics.ts`

**Step 1: Write failing tests**

Test URL round-trip for profile, goals, dates, categories, pace, and selected event IDs. Test malformed parameters fall back safely. Test generated ICS uses Asia/Shanghai local times, escapes commas and semicolons, and emits one VEVENT per route item.

**Step 2: Verify red**

Run: `pnpm test src/lib/share.test.ts src/lib/ics.test.ts`

Expected: missing functions, followed by intentional assertion failures after signatures.

**Step 3: Implement minimal pure functions**

Implement `encodePlannerState`, `decodePlannerState`, `loadLocalState`, `saveLocalState`, and `routeToIcs`. Guard browser-only APIs.

**Step 4: Verify green**

Run: `pnpm test src/lib/share.test.ts src/lib/ics.test.ts`

Expected: all pass.

**Step 5: Commit**

```bash
git add src/lib/share* src/lib/ics*
git commit -m "feat: persist and export visitor routes"
```

### Task 6: Design system and application shell

**Files:**
- Create: `src/App.test.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/components/SiteHeader.tsx`
- Create: `src/components/Hero.tsx`
- Create: `src/components/Section.tsx`
- Create: `src/components/SiteFooter.tsx`
- Modify: `src/main.tsx`

**Step 1: Write failing shell tests**

Test the H1, source disclaimer, official register link, one-line navigation labels, language toggle, and planner anchor.

**Step 2: Verify red**

Run: `pnpm test src/App.test.tsx`

Expected: render assertions fail.

**Step 3: Implement the shell**

Use the approved tokens, generated hero asset, semantic landmarks, and exactly one page-level theme. Hero copy must fit in the initial viewport. Use Phosphor Icons only. Ensure all visible copy contains zero em or en dash characters.

**Step 4: Verify green**

Run: `pnpm test src/App.test.tsx`

Run: `pnpm typecheck`

Expected: all pass.

**Step 5: Commit**

```bash
git add src/App* src/main.tsx src/styles.css src/components public/assets/waic-data-terrain.webp
git commit -m "feat: build the WAIC data-story shell"
```

### Task 7: Opportunity landscape visualizations

**Files:**
- Create: `src/components/OpportunityLandscape.test.tsx`
- Create: `src/components/OpportunityLandscape.tsx`
- Create: `src/components/ScheduleHeatmap.tsx`
- Create: `src/components/TopicAtlas.tsx`
- Create: `src/components/VenueConstellation.tsx`

**Step 1: Write failing interaction tests**

Test real totals, heatmap cell labels, category filter activation, keyboard activation, and static list fallback.

**Step 2: Verify red**

Run: `pnpm test src/components/OpportunityLandscape.test.tsx`

Expected: failures before implementation.

**Step 3: Implement accessible charts**

Use CSS Grid and semantic buttons for the heatmap. Data SVG is allowed for the venue relationship visual, but icons must remain from Phosphor. Every chart needs an accessible title, description, value labels, and text fallback.

**Step 4: Add motion with reduction support**

Use Motion layout transitions for selection and opacity/transform entry only. Use `useReducedMotion` and render static values when reduction is requested.

**Step 5: Verify green**

Run: `pnpm test src/components/OpportunityLandscape.test.tsx`

Expected: all pass.

**Step 6: Commit**

```bash
git add src/components/OpportunityLandscape* src/components/ScheduleHeatmap.tsx src/components/TopicAtlas.tsx src/components/VenueConstellation.tsx
git commit -m "feat: visualize WAIC opportunity density"
```

### Task 8: Planner controls and route workbench

**Files:**
- Create: `src/components/Planner.test.tsx`
- Create: `src/components/Planner.tsx`
- Create: `src/components/RouteTimeline.tsx`
- Create: `src/components/AttentionBudget.tsx`
- Create: `src/components/RouteActions.tsx`

**Step 1: Write failing user-flow tests**

Test defaults, multi-select limits, route generation, visible explanation, swap/remove action, no-result state, share action fallback, and ICS action. When a high-relevance rejected candidate exists, show at least one with its rejection reason; when none exists, render an explicit empty explanation and never invent a candidate.

**Step 2: Verify red**

Run: `pnpm test src/components/Planner.test.tsx`

Expected: UI behavior is absent.

**Step 3: Implement the minimal planner UI**

Keep all labels above controls. No placeholder-as-label. Show outcomes as event count, content time, targets covered, venue switches, and suggested buffer. Do not render an opaque universal score.

**Step 4: Implement error and empty states**

When no route fits, preserve inputs and explain which constraint to relax. When data fails, link to the source disclaimer and provide retry.

**Step 5: Verify green**

Run: `pnpm test src/components/Planner.test.tsx`

Expected: all pass.

**Step 6: Commit**

```bash
git add src/components/Planner* src/components/Route* src/components/AttentionBudget.tsx
git commit -m "feat: add the visitor route workbench"
```

### Task 9: Full schedule explorer and event detail

**Files:**
- Create: `src/components/EventExplorer.test.tsx`
- Create: `src/components/EventExplorer.tsx`
- Create: `src/components/EventList.tsx`
- Create: `src/components/EventDetailSheet.tsx`
- Create: `src/components/VenueGuide.tsx`

**Step 1: Write failing tests**

Test Chinese and English search, combined filters, progressive reveal, clear filters, detail opening, Escape close, focus restoration, official link, Amap search URL, and bilingual fallback.

**Step 2: Verify red**

Run: `pnpm test src/components/EventExplorer.test.tsx`

Expected: assertions fail.

**Step 3: Implement explorer and detail sheet**

Start with 24 results and reveal more on request. Use grouped timeline rows, not three equal generic cards. Show source and qualification reminders. The Amap link must be a search URL based on the exact Chinese location, not a claimed route duration.

**Step 4: Implement venue guide**

Include the four official venue roles and three official shuttle frequencies. Label buffer values as planning suggestions.

**Step 5: Verify green**

Run: `pnpm test src/components/EventExplorer.test.tsx`

Expected: all pass.

**Step 6: Commit**

```bash
git add src/components/Event* src/components/VenueGuide.tsx
git commit -m "feat: add the complete searchable WAIC schedule"
```

### Task 10: Responsive, accessibility, and visual pre-flight

**Files:**
- Modify: relevant components and `src/styles.css`
- Create during verification only: `output/playwright/` screenshots and snapshots, kept out of the shipped bundle

**Step 1: Start the preview and open a Playwright CLI session**

Use the installed Playwright skill wrapper. Snapshot before every element-ref interaction and re-snapshot after significant state changes.

Cover:

- desktop 1440×900;
- mobile 390×844;
- no horizontal overflow;
- first route generated from keyboard;
- empty filters recover;
- share URL restores state;
- reduced motion disables automatic motion;
- light and dark mode both readable;
- console has no errors.

**Step 2: Record observed browser failures**

Capture concrete failures with CLI snapshots, screenshots, console output, and DOM overflow checks before changing the UI.

**Step 3: Fix only demonstrated failures**

Run the design pre-flight mechanically: one-line nav, hero viewport fit, eyebrow count, one accent system, shape consistency, button/form contrast, no wrapped desktop CTA, no em/en dashes, reduced motion, explicit mobile collapse, loading/empty/error states.

**Step 4: Verify green**

Run: `pnpm test`

Run: `pnpm typecheck`

Run: `pnpm build`

Run: `git diff --check`

Expected: all commands exit 0.

**Step 5: Commit**

```bash
git add src
git commit -m "test: verify responsive visitor planning flows"
```

### Task 11: Cloudflare deployment and live verification

**Files:**
- Modify only if necessary: `wrangler.jsonc`
- Create: `README.md`

**Step 1: Verify auth and dry run**

Run: `pnpm exec wrangler whoami`

Expected: authenticated account without printing or storing credentials.

Run: `pnpm exec wrangler deploy --dry-run`

Expected: independent Worker package only, no D1/R2 bindings.

**Step 2: Deploy**

Run: `pnpm exec wrangler deploy`

Expected: `https://waic-visitor-guide.ingle.workers.dev` or the account-provided equivalent.

**Step 3: Verify the live surface**

Check HTTP 200, cache headers, SPA fallback, asset loading, 175-event search, planner generation, share restore, desktop and mobile screenshots, console, and official external links.

**Step 4: Consider custom domain**

Only after the workers.dev verification, inspect whether `waytoagi.com` is manageable in the current account. If it is, add `waic.waytoagi.com` as a custom domain without changing the existing `event.waytoagi.com` surface. If not, keep the verified workers.dev URL and report the precise missing authority.

**Step 5: Document and final verify**

README must include source provenance, update workflow, local commands, deploy target, independent-tool disclaimer, and no credentials.

Run fresh:

```bash
pnpm run data:check
pnpm test
pnpm typecheck
pnpm build
git status --short
```

**Step 6: Commit**

```bash
git add README.md wrangler.jsonc
git commit -m "docs: document WAIC visitor guide deployment"
```
