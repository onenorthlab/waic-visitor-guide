# Agent Instructions

## Working Style

- State material assumptions and tradeoffs before implementation.
- Prefer the smallest implementation that satisfies the visitor outcome.
- Keep changes surgical and match established project style.
- Define verifiable success criteria, then run the checks before claiming completion.

## Project Rules

- This is a standalone Cloudflare Workers Static Assets app. Do not reuse or deploy the existing `waic-side-events` Worker, D1 database, R2 bucket, routes, or credentials.
- `CLAUDE.md` is the source of truth. `AGENTS.md` must remain a symlink to `CLAUDE.md`; never edit `AGENTS.md` directly.
- Keep source data traceable to `source-data/WAIC-2026-full-schedule.xlsx`. Do not invent schedules, speakers, capacity, live status, or travel times.
- Label the site as an independent visitor guide, not the official WAIC website. Link back to official sources and show the data update date.
- Keep credentials out of source. Use Cloudflare OAuth or environment secrets when deployment needs authentication.
- New behavior follows TDD. Run unit tests, typecheck, build, and browser verification before deployment.
- Chinese is the default UI. Preserve English titles from the source data and provide a language toggle.
- Visible UI copy must not use em dashes or en dashes.

## Product Priorities

- Optimize for fast decisions on mobile: what is worth attending, whether it conflicts, and whether a venue change is realistic.
- Expose recommendation reasons and route costs. Do not present an opaque universal activity ranking.
- Animations must explain hierarchy, state, or data relationships and must honor reduced-motion preferences.
