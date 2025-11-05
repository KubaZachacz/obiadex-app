## 1. Project name

Obiadex

![Node](https://img.shields.io/badge/node-22.14.0-339933?logo=node.js&logoColor=white)
![Astro](https://img.shields.io/badge/Astro-5-BC52EE?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

### Table of contents

- [1. Project name](#1-project-name)
- [2. Project description](#2-project-description)
- [3. Tech stack](#3-tech-stack)
- [4. Getting started locally](#4-getting-started-locally)
- [5. Available scripts](#5-available-scripts)
- [6. Project scope](#6-project-scope)
- [7. Project status](#7-project-status)
- [8. License](#8-license)

## 2. Project description

Obiadex is a simple, mobile‑first PWA that helps you plan dinners from your own dish library. Add dishes (name required, optional description and URL), then use built‑in AI to generate a short description and 2–3 tags. Based on your library, the app proposes dinners for a selected date range while enforcing anti‑repetition rules. A history view lets you browse past and future days, edit, swap, and remove entries. The UI is Polish‑localized with dates in DD.MM.YYYY.

Key highlights:

- Fast frontend with Astro + React and Tailwind
- Supabase for database and authentication
- Cost‑efficient AI via OpenRouter (e.g., GPT‑4o‑mini, Gemini Flash)
- PWA and responsive design
- Non‑intrusive ads in select views (MVP)

## 3. Tech stack

- Frontend: Astro 5, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui (Radix)
- Backend: Supabase (PostgreSQL + Authentication)
- AI: OpenRouter.ai with cost‑efficient models (e.g., GPT‑4o‑mini, Gemini Flash)
- CI/CD: GitHub Actions
- Hosting: Frontend on Vercel/Netlify; backend on Supabase (optional DO + Docker)
- Localization: Polish UI; dates formatted as DD.MM.YYYY
- PWA: Installable and mobile‑friendly

Node version: 22.14.0 (see `.nvmrc`)

## 4. Getting started locally

### Prerequisites

- Node.js 22.14.0
- npm

### Setup

1. Clone the repository

```bash
git clone <your-repo-url>
cd obiadex-app
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

Create a `.env` file in the project root with your keys:

```bash
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# AI provider (OpenRouter)
OPENROUTER_API_KEY=your-openrouter-api-key
```

4. Run the development server

```bash
npm run dev
```

5. Build and preview production

```bash
npm run build
npm run preview
```

6. Lint and format (optional)

```bash
npm run lint
npm run lint:fix
npm run format
```

## 5. Available scripts

- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run preview`: Preview the production build
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues
- `npm run format`: Run Prettier across the repo
- `npm run astro`: Access Astro CLI directly

## 6. Project scope

In scope (MVP):

- User accounts: sign up, sign in, sign out, account deletion (Supabase Auth)
- User’s dish library: name (required), tags (multi‑select), optional description and URL
- AI assistance: one‑click generation of short description and 2–3 tags (single run per dish in MVP), with throttling and clear error messages
- Plan generator for a date range with anti‑repetition rules:
  - A dish appears at most once per week (Mon–Sun)
  - At least 10 days since the dish last appeared
  - Can be relaxed with warnings when the pool is too small (e.g., narrow tags)
- History: chronological list (including empty days) with infinite scroll, filter (with/without dish), and inline edits (swap, add to empty day, remove)
- Ads: non‑blocking AdSense banners in selected views (e.g., dish list sidebar or sticky on mobile; in history every 7–10 items)
- PWA & RWD: mobile‑first, responsive UI; Polish language and DD.MM.YYYY

Out of scope (post‑MVP examples):

- Family sharing/roles, public sharing, and external integrations
- Import/export (CSV/PDF), printing, calendar grid/drag‑and‑drop
- Advanced frequency modeling and cooking for multiple days
- Ingredients, shopping lists, calories/portions, advanced analytics
- Native mobile apps and notifications

For complete requirements, see the PRD at `.ai/prd.md`.

## 7. Project status

MVP in active development. PRD defined; core flows under implementation. Not production‑ready yet.

## 8. License

MIT License. See `LICENSE` or the MIT overview at https://opensource.org/licenses/MIT.
