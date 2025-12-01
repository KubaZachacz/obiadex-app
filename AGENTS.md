# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds Astro pages (`pages/`), shared layouts (`layouts/`), React islands/components (`components/`), domain logic (`lib/`), middleware, and database helpers (`db/`).
- `public/` contains static assets served as-is; `supabase/` holds CLI config and migrations; `dist/` is build output (do not edit).
- Environment contracts live in `src/env.d.ts`; update it when adding new vars, and keep `.env` private (see `.env.example`).

## Build, Test, and Development Commands
- `npm run dev` — start Astro dev server at http://localhost:4321 with HMR.
- `npm run build` / `npm run preview` — produce and smoke-test the production build locally.
- `npm run lint` / `npm run lint:fix` — run ESLint (Astro + React + TypeScript rules) with optional autofix.
- `npm run format` — apply Prettier (Astro plugin enabled).
- `npm run supabase` — access Supabase CLI for local dev/migrations.

## Coding Style & Naming Conventions
- Prettier enforces 2-space indent, 120-char width, double quotes, trailing commas (es5), and Astro-aware parsing; let formatters run.
- ESLint catches React Hooks issues and enforces React Compiler readiness; avoid `console` except for temporary debugging.
- Name React components and files with PascalCase (e.g., `MealPlanner.tsx`); utilities/hooks are camelCase (`useDishFilters.ts`).
- Favor typed helpers in `src/lib/` and keep UI logic inside `src/components/` to preserve separation.

## Testing Guidelines
- No automated test suite is present yet; add Vitest/Playwright coverage alongside features. Prefer colocated `*.test.ts`/`*.test.tsx` near the code.
- When adding Supabase-dependent tests, inject test keys via env vars and avoid hitting production data.
- Always run `npm run lint` and a production `npm run build` before opening a PR.

## Commit & Pull Request Guidelines
- Follow Conventional Commits as seen in history (`refactor: ...`, `docs: ...`); keep messages imperative and scoped.
- PRs should include: summary of change, linked issue/task, screenshots for UI updates, and notes on Supabase schema impacts.
- Ensure branch is rebased, CI/lint/build pass, and mention any new env vars or migrations in the description.

## Security & Configuration Tips
- Never commit `.env` or Supabase secrets; rotate keys after sharing temporary credentials.
- Validate new environment variables in `src/env.d.ts` and document defaults in `.env.example` before shipping.
