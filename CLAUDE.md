# Agent Instructions

## Working Style

- State material assumptions and tradeoffs before implementation.
- Prefer the smallest implementation that satisfies the visitor outcome.
- Keep changes surgical and match established project style.
- Define verifiable success criteria, then run the checks before claiming completion.

## Project Rules

- This is a standalone static Vite SPA. Production is served from the main-site ECS origin (121.43.229.39, 1Panel openresty vhost, DNS A record since 2026-07-14) at https://waic-guide.waytoagi.com; merge to main auto-deploys via rsync, with Aliyun OSS + CDN kept in sync as the DNS rollback path (see `docs/DEPLOY-ALIYUN.md`). The old Cloudflare Workers entry is deprecated. Do not reuse or deploy the existing `waic-side-events` Worker, D1 database, R2 bucket, routes, or credentials.
- `CLAUDE.md` is the source of truth. `AGENTS.md` must remain a symlink to `CLAUDE.md`; never edit `AGENTS.md` directly.
- Keep source data traceable to `source-data/WAIC-2026-full-schedule.xlsx`. Do not invent schedules, speakers, capacity, live status, or travel times.
- Label the site as an independent visitor guide, not the official WAIC website. Link back to official sources and show the data update date.
- Keep credentials out of source. Deployment uses GitHub Actions secrets (`ALIYUN_ACCESS_KEY_ID`/`ALIYUN_ACCESS_KEY_SECRET`); locally export the same pair as `ALIBABA_CLOUD_ACCESS_KEY_*` env vars.
- New behavior follows TDD. Run unit tests, typecheck, build, and browser verification before deployment.
- Chinese is the default UI. Preserve English titles from the source data and provide a language toggle.
- Visible UI copy must not use em dashes or en dashes.

## Product Priorities

- Optimize for fast decisions on mobile: what is worth attending, whether it conflicts, and whether a venue change is realistic.
- Expose recommendation reasons and route costs. Do not present an opaque universal activity ranking.
- Animations must explain hierarchy, state, or data relationships and must honor reduced-motion preferences.

## UI 基准

- 基准 URL：https://waic-guide.waytoagi.com （线上正式版，merge 到 main 自动更新）
- 视觉规范：本仓库 `DESIGN.md`，其排版/几何/elevation 与主站 `events-platform/docs/DESIGN.md` 对齐（轻字重、胶囊几何、平面化、CJK 不加负字距）。
- UI 改动交付前跑 ui-acceptance skill：桌面/移动/暗色三截图 + 与线上基准 diff + 行为断言，产物存 `.ui-acceptance/<日期>/`（已 gitignore）。
