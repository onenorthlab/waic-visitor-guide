# WAIC Brand, Carousel Filters, and Eight-Language i18n Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Match the visitor guide to the WaytoAGI Side Events brand, add cross-filters inside activity carousels, and localize the complete visitor interface into eight languages.

**Architecture:** Add one locale module as the source of truth for locale metadata and source-data fallback behavior. Keep component copy close to each component, but require all copy objects to cover every locale. The carousel continues to receive the exact activity set from the selected visualization and applies date, category, and venue filters within that verified set.

**Tech Stack:** React 19, TypeScript, Motion, Vitest, Testing Library, Vite, Cloudflare Workers Static Assets.

---

### Task 1: Locale foundation and language menu

**Files:**
- Create: `src/lib/i18n.ts`
- Create: `src/lib/i18n.test.ts`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/App.test.tsx`

**Steps:**

1. Write failing tests for eight locale definitions, HTML `lang` and `dir`, language persistence, and source-title fallback.
2. Run `pnpm test src/lib/i18n.test.ts src/App.test.tsx` and confirm the new assertions fail because only `zh` and `en` exist.
3. Implement `Language`, locale metadata, native labels, RTL metadata, and bilingual source fallback in `src/lib/i18n.ts`.
4. Replace the two-way toggle with an accessible eight-language menu and persist the selected locale.
5. Run the targeted tests and confirm they pass.
6. Commit with `feat: add eight-language locale foundation`.

### Task 2: Localized labels and primary shell

**Files:**
- Modify: `src/lib/labels.ts`
- Modify: `src/lib/labels.test.ts`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/App.test.tsx`

**Steps:**

1. Write failing tests for localized date, category, identity, goal, navigation, hero, and footer labels in Japanese, Spanish, and Arabic.
2. Run the tests and verify failures show English fallback or missing locale keys.
3. Add category, venue, identity, goal, and date localization helpers for every locale.
4. Add complete shell copy for all eight locales and set Arabic direction.
5. Run targeted tests and commit with `feat: localize visitor guide shell`.

### Task 3: Cross-filtered activity carousel

**Files:**
- Modify: `src/components/LandscapeEventCarousel.tsx`
- Modify: `src/components/OpportunityLandscape.test.tsx`
- Modify: `src/styles.css`

**Steps:**

1. Write failing interaction tests that open the Industrial AI topic, filter by `2026-07-18` and `expo-center`, verify the result count and first card, clear filters, and verify carousel reset.
2. Add a failing test for a valid empty filter combination and its reset action.
3. Run `pnpm test src/components/OpportunityLandscape.test.tsx` and verify the controls are missing.
4. Add derived date, category, and venue options, filtered events, count messaging, empty state, reset control, and active-index reset.
5. Add localized carousel filter copy for all eight locales.
6. Style the compact filter rail for desktop and mobile.
7. Run targeted tests and commit with `feat: cross-filter landscape activities`.

### Task 4: Complete component localization

**Files:**
- Modify: `src/components/OpportunityLandscape.tsx`
- Modify: `src/components/EventExplorer.tsx`
- Modify: `src/components/Planner.tsx`
- Modify: `src/components/VenueGuide.tsx`
- Modify: `src/components/LandscapeEventCarousel.tsx`
- Modify: related component tests

**Steps:**

1. Add failing tests that switch to Japanese, French, and Arabic and assert each major section has localized headings and controls with no English UI fallback.
2. Run the targeted tests and verify the new locale assertions fail.
3. Complete copy dictionaries for all eight locales and replace binary `language === "zh"` branches with localization helpers.
4. Keep Chinese source titles only in Chinese; use official source English titles and locations for all other locales.
5. Run component tests and commit with `feat: localize visitor workflow`.

### Task 5: WaytoAGI Side Events visual system

**Files:**
- Create: `DESIGN.md`
- Modify: `src/styles.css`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/App.test.tsx`

**Steps:**

1. Add failing tests for the WaytoAGI logo asset, branded wordmark, and language-menu semantics.
2. Update CSS tokens and components to the warm cream, ink, and raspberry system documented in `DESIGN.md`.
3. Add the WaytoAGI deer logo using the verified Side Events brand asset URL.
4. Preserve chart hierarchy, dark theme, AA contrast, and responsive behavior.
5. Run targeted tests and commit with `style: align visitor guide with WaytoAGI`.

### Task 6: Verification, integration, and deployment

**Files:**
- Verify all changed files

**Steps:**

1. Run `pnpm test`, `pnpm data:check`, `pnpm typecheck`, `pnpm build`, `git diff --check`, and `pnpm exec wrangler deploy --dry-run`.
2. Use a production preview and Playwright to verify the branded desktop and 390px mobile layouts, all three carousel entry points, cross-filters, language switching, Arabic RTL, focus behavior, and zero console warnings.
3. Merge the feature branch into `main` after the worktree is clean.
4. Deploy only the `waic-visitor-guide` Worker.
5. Reopen `https://waic-visitor-guide.ingle.workers.dev` and repeat the critical online checks.

