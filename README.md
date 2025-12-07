# Obiadex

[![Status: MVP in progress](https://img.shields.io/badge/status-MVP_in_progress-orange)](#7-project-status)
[![License: TBD](https://img.shields.io/badge/license-TBD-lightgrey)](#8-license)

Obiadex is a focused meal-planning web app that helps individuals and families
answer “what’s for dinner?” by maintaining a private dish catalog and a simple
daily planner powered by Supabase and Astro.

## Table of Contents

- [1. Project name](#1-project-name)
- [2. Project description](#2-project-description)
- [3. Tech stack](#3-tech-stack)
- [4. Getting started locally](#4-getting-started-locally)
- [5. Available scripts](#5-available-scripts)
- [6. Project scope](#6-project-scope)
- [7. Project status](#7-project-status)
- [8. License](#8-license)

## 1. Project name

**Obiadex** — a lightweight dinner planning assistant designed for quick,
repeatable meal decisions.

## 2. Project description

Obiadex provides a private Supabase-backed workspace where each user can store
their favorite dishes, tag them, and plan exactly one meal per day using a
history-aware selector that promotes underused dishes. The MVP emphasizes manual
control, responsive layouts, and minimal-yet-useful analytics (dish and day
events). Full functional requirements, user stories, and acceptance criteria are
captured in the [Product Requirements Document](.ai/prd.md).

## 3. Tech stack

- **Framework:** Astro 5 with React 19 islands for interactive flows
- **Language & styling:** TypeScript 5, Tailwind CSS 4, shadcn/ui + Radix UI
  primitives, clsx, tailwind-merge, tw-animate-css
- **Backend-as-a-Service:** Supabase (PostgreSQL, Auth, client SDK 2.x)
- **Utilities:** class-variance-authority, lucide-react icon set
- **Tooling:** ESLint 9 (with Astro, React, TypeScript presets), Prettier,
  husky, lint-staged
- **Runtime:** Node.js 22.14.0 (see `.nvmrc`)

## 4. Getting started locally

### Prerequisites

- Node.js **22.14.0** (use `nvm use` to respect `.nvmrc`)
- npm 10+ (bundled with Node 22)
- Supabase project with URL and anon key (for Auth + database access)

### Setup

```bash
git clone https://github.com/<your-org>/obiadex-app.git
cd obiadex-app
npm install

# Configure environment (create .env based on src/env.d.ts expectations)
cp .env.example .env   # if/when an example file is added
# Populate Supabase keys, e.g. SUPABASE_URL and SUPABASE_ANON_KEY

npm run dev
```

The development server runs at `http://localhost:4321` by default. Use `npm run
build` followed by `npm run preview` to test the production build locally.

## 5. Available scripts

| Command                 | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `npm run dev`           | Start Astro dev server with hot reload.                |
| `npm run build`         | Build the production-ready Astro output.               |
| `npm run preview`       | Preview the production build locally.                  |
| `npm run astro`         | Run arbitrary Astro CLI commands.                      |
| `npm run lint`          | Lint all source files with ESLint.                     |
| `npm run lint:fix`      | Lint and auto-fix supported issues.                    |
| `npm run format`        | Format supported files using Prettier.                 |
| `npm run test`          | Run Vitest in watch mode with jsdom globals and setup. |
| `npm run test:run`      | Run Vitest once (passes when no tests are present).    |
| `npm run test:coverage` | Run Vitest once and emit text and lcov coverage.       |
| `npm run supabase`      | Access the Supabase CLI (migrations, local dev, etc.). |

## 6. Project scope

- **Authentication:** Sign-up, login, logout, optional password reset via
  Supabase Auth; private data per user with protected routes.
- **Dish database:** CRUD (minus delete UI) for dishes with fields `name`,
  `tags[]`, optional `recipe_text` and `url`; validation and case-insensitive tag
  normalization/removal rules.
- **Planning UI:** Infinite-scroll day list (past/future), day detail with FAB,
  manual dish assignment with history-based sorting and optional tag filtering.
- **Analytics:** `dish_added` (user_id, dish_id, tags_count) and `day_planned`
  (user_id, date, dish_id) events stored in the database; failures never block
  UX.
- **UX guidelines:** Clear empty states, responsive design for desktop/mobile,
  simple navigation with FAB shortcuts and link to the dish base.
- **Out of scope for MVP:** Sharing, imports/exports, full calendar grids,
  ingredient models, notifications, advanced planning automation.

Refer to `.ai/prd.md` for the exhaustive story-by-story scope definition.

## 7. Project status

MVP requirements and architecture are documented; implementation is underway and
not yet production ready. Expect rapid iteration on Supabase schemas, analytics
capture, and UI polish before the initial release.

## 8. License

A license has not been specified yet. Add a LICENSE file prior to public
distribution to clarify usage rights.

