# API Improvement Plan

Date: 2025-11-30
Scope: Align implemented API with plans in `.ai/*` and project rules in `.github/copilot-instructions.md`

## Summary of Current State
- Auth: `login`, `signup`, `logout`, `reset-password` implemented with `context.locals.supabase` and robust Zod validation. Reset returns `202` to prevent enumeration.
- Dishes: List with pagination/filter/sort; create/update with tag selection; get/delete; attach/detach tags implemented. Good schema coverage and domain checks ("at least one tag").
- Tags: List, create single, bulk upsert, delete by id; central DB error mapping covers unique violations and no-rows.
- Day Plans: Range listing, get/put/delete by ISO date; date window constraints and auth checks consistent.
- Analytics: Summary endpoint with 180-day window validation, `no-store` header, and auth check.
- Cross-cutting: Consistent early auth checks, Zod `.safeParse`, centralized `respond*` helpers, services extracted under `src/lib/services/*`, supabase injected via middleware and typed via `src/db/supabase.client.ts`.

## Issues and Risks
- Response consistency: Mixed usage of raw `new Response(null, { status: 204 })` vs helper functions; analytics uses a custom `new Response` to set `Cache-Control`.
- `respondDbError` message specificity: Mentions "Tag with this name already exists" which may be misleading for other domains.
- Payload shape variance: Sometimes returning raw objects vs `{ data: ... }` wrapper (e.g., tags list vs others).
- Logging consistency: Variations between returning `respondDbError` vs `respondInternalError`, and where domain messages are surfaced.
- Unused schema: `authorizationHeaderSchema` present but routes uniformly rely on `supabase.auth.getUser()`; clarify intended usage or remove.
- Pagination limits: `pageSize` max 100; confirm product requirement alignment from `.ai` plans.

## Recommended Fixes (Short-Term)
1. Add `respondNoContent()` helper.
   - Purpose: Standardize 204 responses across routes.
   - Change: `src/lib/http/responses.ts` add `respondNoContent(): Response` returning 204.
   - Apply: Replace raw `new Response(null, { status: 204 })` in `auth/logout`, `dishes/{id} DELETE`, `day-plans/{day} DELETE`, `dishes/{id}/tags/{tagId} DELETE`.

2. Optional headers support in JSON helpers.
   - Purpose: Allow setting headers like `Cache-Control` via response helpers.
   - Change: Extend `jsonResponse(data, status, headers?)` and `respondOk/Created` to accept optional headers.
   - Apply: Update `analytics/summary` to use `respondOk(summary, { "Cache-Control": "no-store" })`.

3. Generalize conflict message in `respondDbError`.
   - Purpose: Avoid tag-specific wording for unique constraint violations.
   - Change: Replace message with a neutral "Resource conflict" or let callers pass domain-specific message.
   - Option: Expose `respondConflict(message)` and use per route for better domain semantics.

4. Normalize payload shapes.
   - Purpose: Consistent API responses across endpoints.
   - Guideline: Prefer `{ data: ... }` top-level payloads for list and single resources.
   - Change: Standardize return bodies in `dishes`, `tags`, `day-plans`, `analytics` routes.

5. Align logging and error mapping.
   - Purpose: Consistent diagnosis and client-facing behavior.
   - Policy: Use `respondDbError` for Supabase/PostgREST errors; use domain-specific `respondValidationError` for business rule failures; fallback to `respondInternalError` only on unexpected exceptions.
   - Change: Minor refactors in catch blocks to follow the above pattern.

6. Clarify `authorizationHeaderSchema` usage.
   - Option A: Remove if not needed.
   - Option B: Integrate for endpoints that may accept Bearer tokens directly (if planned), else document why `getUser()` is preferred.

## Medium-Term Improvements
- Error codes: Introduce a consistent `code` field for client handling (e.g., `UNAUTHORIZED`, `VALIDATION_ERROR`, `CONFLICT`, `NOT_FOUND`).
- Pagination envelope: Standardize list responses to `{ data, page, pageSize, total }` where applicable.
- Caching policy: Define caching behavior per route; extend helpers with common patterns (e.g., `no-store`, `max-age`).
- Rate limiting & abuse protection: Consider middleware or edge logic for sensitive endpoints.
- Telemetry: Centralize error logging with context (route, user id) and levels.

## Acceptance Criteria
- 204 responses use `respondNoContent()` in all relevant routes.
- `jsonResponse` supports optional headers; analytics uses helper with `no-store`.
- `respondDbError` no longer contains tag-specific wording; routes specify domain messages where necessary.
- All routes return consistently shaped payloads (`{ data: ... }`) for success responses.
- Catch blocks follow the standardized error handling policy.
- Documentation updated in `.github/copilot-instructions.md` if response conventions are formalized.

## Files to Touch
- `src/lib/http/responses.ts` (new helpers + headers support + message generalization)
- `src/pages/api/auth/logout.ts` (use `respondNoContent`)
- `src/pages/api/dishes/[dishId]/index.ts` (DELETE uses `respondNoContent`)
- `src/pages/api/dishes/[dishId]/tags/[tagId].ts` (DELETE uses `respondNoContent`)
- `src/pages/api/day-plans/[day].ts` (DELETE uses `respondNoContent`)
- `src/pages/api/analytics/summary.ts` (use `respondOk` with headers)
- Optional: normalize payloads across routes (touch per-route response bodies)

## Rollout Notes
- Keep changes minimal and focused; avoid unrelated refactors.
- Run lint/tests and manual checks via Postman collection `Obiadex_API.postman_collection.json`.
- Verify response shapes with frontend consumption before merging.
