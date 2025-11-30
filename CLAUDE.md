# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obiadex is a focused meal-planning web app built with Astro 5 and Supabase. It helps users maintain a private dish catalog and plan daily meals with history-aware dish selection and tag-based filtering. This is an MVP project emphasizing manual control, responsive layouts, and minimal analytics.

## Tech Stack

- **Framework:** Astro 5 with SSR (server output mode)
- **Frontend:** React 19 islands for interactive components, TypeScript 5
- **Styling:** Tailwind CSS 4, shadcn/ui with Radix UI primitives
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Tooling:** ESLint 9, Prettier, husky, lint-staged
- **Runtime:** Node.js 22.14.0 (see `.nvmrc`)

## Development Commands

```bash
# Start dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues

# Format code
npm run format

# Supabase CLI
npm run supabase       # Access Supabase commands (migrations, etc.)
```

## Project Structure

```
./src
  /layouts           - Astro layouts
  /pages             - Astro pages (routes)
    /api             - API endpoints (use uppercase GET, POST handlers)
  /middleware        - Astro middleware (provides supabase in context.locals)
  /db                - Supabase client and generated types
  /types.ts          - Shared types (Entities, DTOs) for backend/frontend
  /components        - Astro (static) and React (interactive) components
    /ui              - shadcn/ui components
    /hooks           - Custom React hooks
  /lib               - Services and utility functions
    /services        - Business logic extracted from API routes
  /assets            - Internal static assets
./public             - Public assets
./supabase
  /migrations        - Database migration files
```

## Architecture Patterns

### Astro + React Hybrid

- **Use Astro components (.astro)** for static content and layouts
- **Use React components (.tsx)** only when interactivity is needed (forms, dynamic UIs)
- React components are imported as islands in Astro pages
- Never use `"use client"` or other Next.js directives

### Supabase Integration

- **Middleware setup:** Supabase client is injected into `context.locals.supabase` by middleware at `src/middleware/index.ts`
- **In API routes/pages:** Access via `context.locals.supabase`, NOT by importing `supabaseClient` directly
- **Type safety:** Use `SupabaseClient` type from `src/db/supabase.client.ts`, NOT from `@supabase/supabase-js`
- **Database types:** Auto-generated types are in `src/db/database.types.ts`

### Database Schema

Five core tables with Row Level Security (RLS):
- **dishes:** User's meal catalog (name, recipe_text, url)
- **tags:** User-created tags (normalized, unique per user)
- **dish_tags:** Many-to-many relationship between dishes and tags
- **day_plans:** One dish assignment per day per user
- **events:** Append-only analytics log (dish_added, day_planned)

All tables have:
- `user_id` foreign key to `auth.users`
- Cascade deletes when user is deleted
- RLS policies for both `anon` and `authenticated` roles
- Indexes optimized for common queries

### API Routes

- Use `export const prerender = false` for all API routes
- Use uppercase HTTP method handlers: `GET`, `POST`, etc.
- Validate input with Zod schemas
- Extract business logic into services in `src/lib/services`
- Access Supabase via `context.locals.supabase`

### Code Quality Guidelines

- **Error handling:** Handle errors at the beginning of functions using early returns and guard clauses
- **Happy path last:** Place successful execution path at the end for readability
- **Avoid deep nesting:** Use early returns instead of nested if/else
- **Custom error types:** Use error factories for consistent error handling
- **Linter feedback:** Use ESLint feedback when making changes

### React Best Practices

- Use functional components with hooks
- Extract logic into custom hooks in `src/components/hooks`
- Use `React.memo()` for expensive components
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations
- Use `useId()` for accessibility attribute IDs
- Consider `useOptimistic` for optimistic UI updates
- Use `useTransition` for non-urgent state updates

### Styling with Tailwind

- Use `@layer` directive to organize styles
- Use arbitrary values with square brackets for one-off designs: `w-[123px]`
- Leverage responsive variants: `sm:`, `md:`, `lg:`
- Use state variants: `hover:`, `focus-visible:`, `active:`
- Implement dark mode with `dark:` variant
- Use `theme()` function in CSS to access Tailwind theme values

### Accessibility

- Use ARIA landmarks (main, navigation, search)
- Set `aria-expanded` and `aria-controls` for expandable content
- Use `aria-live` regions for dynamic updates
- Apply `aria-hidden` for decorative content
- Use `aria-label` or `aria-labelledby` for elements without visible labels
- Avoid redundant ARIA that duplicates HTML semantics

## Environment Variables

Required in `.env`:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon/public key
- `OPENROUTER_API_KEY` - (if using OpenRouter integration)

## Import Aliases

- `@/*` maps to `./src/*` (configured in `tsconfig.json`)

## Git Hooks

- **pre-commit:** Runs lint-staged which auto-fixes TypeScript, TSX, and Astro files with ESLint, and formats JSON, CSS, and Markdown with Prettier

## Additional Notes

- Dev server runs on port 3000 (configured in `astro.config.mjs`)
- Astro is configured for SSR with Node.js adapter in standalone mode
- View Transitions API is available for smooth page transitions
- Image optimization available via Astro Image integration
- Use `Astro.cookies` for server-side cookie management
- Use `import.meta.env` for accessing environment variables
