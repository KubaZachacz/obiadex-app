# Playwright E2E setup

This folder contains the Playwright test harness. Scenarios should mirror the priorities in `.ai/tests/test-plan.md` (auth protection, dishes/tags CRUD, day plans, mobile overlays, a11y smoke).

## Quickstart

1) Install browsers once: `npm run test:e2e:install` (requires network).  
2) Ensure `.env` is populated (Supabase URL/key) and start any required services (e.g., Supabase).  
3) Run tests: `npm run test:e2e` (starts the dev server automatically) or `npm run test:e2e:headed` for debug.  
4) View the latest HTML report: `npm run test:e2e:report`.

## Configuration notes

- Base URL defaults to `http://localhost:4321`; override with `PLAYWRIGHT_BASE_URL`. Override the dev server command with `PLAYWRIGHT_WEB_SERVER_COMMAND` when testing against a preview build.
- Two projects are pre-wired: `chromium` (desktop) and `mobile-chrome` (Pixel 7) to cover desktop/mobile behaviors called out in the test plan.
- Traces, screenshots, and videos are captured on failure. Reports live under `playwright-report/` (ignored by git).

## Auth and data setup

- For authenticated flows, store storage state files under `tests/e2e/.auth/` (git-ignored) and point tests or fixtures to them via `storageState`.
- Use `npm run seed` to load sample data or prepare dedicated Supabase test users before running destructive flows (tag deletes, day plan overwrites).

Add real test suites under `tests/e2e/` and remove the `example.spec.ts` placeholder once scenarios from `.ai/tests/test-plan.md` are implemented.
