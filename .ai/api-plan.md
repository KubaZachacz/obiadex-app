# REST API Plan

Version: v1
Base URL: `/api/v1`
Content type: `application/json; charset=utf-8`
Auth: `Authorization: Bearer <Supabase JWT>` (required on all endpoints except signup/login/reset if proxied)

## 1. Resources

- Dishes — table: `public.dishes`
- Tags — table: `public.tags`
- Dish–Tag links — table: `public.dish_tags` (mostly implicit in API; a few focused endpoints)
- Day plans — table: `public.day_plans`
- Events (analytics) — table: `public.events` (read-only, aggregated)
- Auth (proxy to Supabase Auth) — service-backed (no table)

Notes:

- Per-user isolation via PostgreSQL RLS: `USING (user_id = auth.uid())`, `WITH CHECK (user_id = auth.uid())` on all user-owned tables.
- Indices leveraged:
  - `dishes_user_created_idx (user_id, created_at DESC)` for keyset pagination.
  - `dishes_name_trgm_idx` (GIN, `gin_trgm_ops`) for fragment search on `name`.
  - `dish_tags_tag_dish_idx (user_id, tag_id, dish_id)` for AND-tag filtering.
  - `dish_tags_dish_tag_idx (user_id, dish_id, tag_id)` for fast tag fetch per dish.
  - `day_plans_user_day_idx (user_id, day)` unique for upsert-by-date and paging.
  - `day_plans_usage_idx (user_id, dish_id, day DESC)` to compute last-used.
  - `events_user_created_idx (user_id, created_at DESC)` for simple date-bounded analytics.

## 2. Endpoints

Conventions:

- All timestamps are ISO 8601. `day` uses calendar date `YYYY-MM-DD`.
- Lists default to `page`/`pageSize` pagination unless noted (day plans rely on explicit `start`/`end` ranges; tags always return the full set without paging).
- Standard error body:

```json
{
  "error": {
    "code": "string",
    "message": "human readable",
    "details": { "optional": "context" }
  }
}
```

### 2.1 Auth (proxy to Supabase Auth; optional server endpoints)

These endpoints are optional if the client calls Supabase Auth SDK directly. If provided, they simply forward to Supabase Auth (non-interactive, server-side), returning minimal normalized payloads.

- POST /auth/signup
  - Description: Create a user account.
  - Request JSON:
    ```json
    { "email": "string", "password": "string" }
    ```
  - Response JSON (201):
    ```json
    { "userId": "uuid", "email": "string" }
    ```
  - Success: 201 Created
  - Errors: 400 invalid email/password, 409 email exists.

- POST /auth/login
  - Description: Obtain a session JWT from Supabase.
  - Request JSON:
    ```json
    { "email": "string", "password": "string" }
    ```
  - Response JSON (200):
    ```json
    { "accessToken": "jwt", "expiresInSec": 3600 }
    ```
  - Success: 200 OK
  - Errors: 401 invalid credentials.

- POST /auth/logout
  - Description: Invalidate current session on server (best-effort).
  - Response: 204 No Content
  - Errors: 401 if no/invalid session.

- POST /auth/reset-password
  - Description: Start password reset flow (Supabase email).
  - Request JSON:
    ```json
    { "email": "string" }
    ```
  - Response: 202 Accepted
  - Errors: 400 invalid email.

### 2.2 Dishes

Entity rules:

- name: required, 3–80 chars; unique per user not required.
- recipe_text: optional, ≤2000 chars.
- url: optional, ≤255 chars.
- Tags: at least 1 tag required at creation per PRD. Tag names normalized to lowercase; unique per user (case-insensitive).

- POST /dishes
  - Description: Create a dish and attach tags (creating tags on the fly). Emits `dish_added` event (non-blocking on failure).
  - Request JSON:
    ```json
    {
      "name": "string",
      "tagNames": ["string"], // optional if tagIds given; each 2–30 chars, lowercase enforced
      "tagIds": ["uuid"], // optional if tagNames given
      "recipeText": "string?", // ≤2000
      "url": "string?" // ≤255
    }
    ```
  - Response JSON (201):
    ```json
    {
      "id": "uuid",
      "name": "string",
      "recipeText": "string|null",
      "url": "string|null",
      "createdAt": "2025-11-24T12:00:00Z",
      "updatedAt": "2025-11-24T12:00:00Z",
      "tags": [{ "id": "uuid", "name": "string" }]
    }
    ```
  - Success: 201 Created
  - Errors: 422 validation (name length, url length, tag rules), 409 tag uniqueness conflict (normalized).
  - Notes: Requires at least one of `tagNames` or `tagIds`. If both are provided, union is used.

- GET /dishes
  - Description: List dishes with pagination, search (fragment), AND-tag filtering, optional usage-prioritized sort.
  - Query:
    - `page`: int (>=1, default 1)
    - `pageSize`: int (default 20, max 100)
    - `q`: string (fragment; uses trigram if available)
    - `tagId`: uuid[] (repeatable; AND across all provided)
    - `sort`: `created_desc` (default) | `name_asc` | `usage_prio`
  - Response JSON (200):
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "name": "string",
          "recipeText": "string|null",
          "url": "string|null",
          "createdAt": "string",
          "updatedAt": "string",
          "tags": [{ "id": "uuid", "name": "string" }],
          "lastUsedDay": "YYYY-MM-DD|null" // present if sort=usage_prio
        }
      ],
      "page": 1,
      "pageSize": 20,
      "total": 120,
      "totalPages": 6
    }
    ```
  - Success: 200 OK
  - Errors: 400 invalid page/pageSize, 422 invalid filters.
  - Sorting `usage_prio`: Never-used first (NULLs first), then by `lastUsedDay` ascending, then `name` ASC.

- GET /dishes/{id}
  - Description: Fetch a dish with tags.
  - Response JSON (200): same shape as single in list.
  - Success: 200 OK
  - Errors: 404 not found.

- PUT /dishes/{id}
  - Description: Full update (fields and tag set). Tag mutations: create missing tagNames, attach new, detach missing. Optional: if a tag is removed here, it is only detached from this dish (does not delete the tag system-wide).
  - Request JSON:
    ```json
    {
      "name": "string",
      "tagNames": ["string"], // or
      "tagIds": ["uuid"],
      "recipeText": "string|null",
      "url": "string|null"
    }
    ```
  - Response JSON (200): updated dish object.
  - Success: 200 OK
  - Errors: 404 not found, 422 validation, 409 tag uniqueness (normalized).

- DELETE /dishes/{id} (not used by MVP UI; for administrative use only)
  - Description: Delete a dish and cascade detachments. Related `day_plans` rows are removed by FK `ON DELETE CASCADE`.
  - Response: 204 No Content
  - Errors: 404 not found.

- POST /dishes/{id}/tags
  - Description: Attach tags to a dish, creating tags when necessary.
  - Request JSON:
    ```json
    { "tagNames": ["string"], "tagIds": ["uuid"] }
    ```
  - Response JSON (200):
    ```json
    { "tags": [{ "id": "uuid", "name": "string" }] }
    ```
  - Success: 200 OK
  - Errors: 404 dish not found, 422 validation.

- DELETE /dishes/{id}/tags/{tagId}
  - Description: Detach a tag from a dish.
  - Response: 204 No Content
  - Errors: 404 not found.

### 2.3 Tags

Entity rules:

- name: required, 2–30 chars, unique per user (case-insensitive), stored in lowercase.

- GET /tags
  - Description: List all tags for the current user.
  - Query:
    - `includeCounts`: boolean (default false) — include number of dishes per tag (adds `dishCount` field per entry)
  - Response JSON (200):
    ```json
    {
      "data": [{ "id": "uuid", "name": "string", "dishCount": 12 }]
    }
    ```
  - Success: 200 OK
  - Notes: Always returns the full tag list (no pagination or server-side sorting).
    - `dishCount` is omitted when `includeCounts=false`.

- POST /tags
  - Description: Create one tag or bulk upsert by names.
  - Request JSON (single):
    ```json
    { "name": "string" }
    ```
  - Request JSON (bulk upsert):
    ```json
    { "names": ["string", "string"] }
    ```
  - Response JSON (201 single):
    ```json
    { "id": "uuid", "name": "string" }
    ```
  - Response JSON (200 bulk):
    ```json
    { "tags": [{ "id": "uuid", "name": "string" }] }
    ```
  - Success: 201 Created (single), 200 OK (bulk)
  - Errors: 422 validation, 409 uniqueness (for single create; bulk treats duplicates as upserts).

- DELETE /tags/{id}
  - Description: Remove a tag from the user’s system entirely and detach it from all dishes (PRD requirement).
  - Response JSON (200):
    ```json
    { "deleted": true, "detachedFrom": 7 }
    ```
  - Success: 200 OK
  - Errors: 404 not found.

### 2.4 Day Plans

Entity rules:

- Unique per `(user_id, day)`; each stored only if a dish is assigned (UI renders empty days client-side).

- GET /day-plans
  - Description: List scheduled days within a required date range (server stores only planned days).
  - Query:
    - `start=YYYY-MM-DD` (required, inclusive lower bound)
    - `end=YYYY-MM-DD` (required, inclusive upper bound, must be ≥ `start`)
    - `sort=asc|desc` (optional, default `asc`)
  - Response JSON (200):
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "day": "YYYY-MM-DD",
          "dish": { "id": "uuid", "name": "string" } // minimal projection
        }
      ],
      "range": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }
    }
    ```
  - Success: 200 OK
  - Errors: 422 invalid date/range (including windows longer than 180 days).
  - Notes: UI typically asks for rolling windows (e.g., 14 days back/forward) and reissues the query with new bounds when the viewport changes.

- GET /day-plans/{day}
  - Description: Fetch a single day plan by date.
  - Response JSON (200):
    ```json
    {
      "id": "uuid",
      "day": "YYYY-MM-DD",
      "dish": {
        "id": "uuid",
        "name": "string",
        "tags": [{ "id": "uuid", "name": "string" }]
      }
    }
    ```
  - Success: 200 OK
  - Errors: 404 not found (no plan for that day).

- PUT /day-plans/{day}
  - Description: Assign or change a dish for a given day (upsert by `(user_id, day)`). Emits `day_planned` event (non-blocking).
  - Request JSON:
    ```json
    { "dishId": "uuid" }
    ```
  - Response JSON (200 or 201):
    ```json
    { "id": "uuid", "day": "YYYY-MM-DD", "dish": { "id": "uuid", "name": "string" } }
    ```
  - Success: 201 Created (new), 200 OK (updated)
  - Errors: 422 invalid date or dishId, 404 dish not found.

- DELETE /day-plans/{day} (optional)
  - Description: Clear a day’s assignment (delete the row).
  - Response: 204 No Content
  - Errors: 404 not found.

### 2.5 Analytics (Events)

Events are appended for minimal analytics; failures must not block user flows.

- GET /analytics/summary
  - Description: Aggregate counts for `dish_added` and `day_planned` within a date window.
  - Query: `start=ISO`, `end=ISO`
  - Response JSON (200):
    ```json
    {
      "dishAdded": { "count": 42 },
      "dayPlanned": { "count": 120 }
    }
    ```
  - Success: 200 OK
  - Errors: 422 invalid date range.

## 3. Authentication and Authorization

- Supabase Auth JWT in `Authorization: Bearer <token>` on every request (except optional proxied signup/login/reset).
- Server validates token and sets session context; DB RLS ensures rows belong to `auth.uid()`:
  - All `SELECT/INSERT/UPDATE/DELETE` scoped by user via RLS policies.
  - Do not accept `user_id` in request bodies; the API sets it server-side.
- Per-endpoint scopes (logical):
  - Dishes/Tags/Day Plans: user must be authenticated; access restricted to own data via RLS.
  - Analytics: aggregates still scoped to the calling user (no global dashboards in MVP).

Optional additions:

- CSRF protection is not required for pure Bearer APIs; ensure HTTPS everywhere.
- For multi-tenant environments, consider an additional header `X-Client-Version` for compatibility checks.

## 4. Validation and Business Logic

Validation (server-side, before DB):

- Dish:
  - `name`: string, 3–80 chars; trim and collapse whitespace.
  - `recipeText`: ≤2000 chars (nullable).
  - `url`: ≤255 chars (nullable).
  - At create: require at least one tag (`tagNames` or `tagIds` not empty).
- Tag:
  - `name`: string, 2–30 chars; normalize to lowercase using a locale-stable algorithm; enforce per-user uniqueness (case-insensitive).
- Day Plan:
  - `day`: valid `YYYY-MM-DD` within reasonable bounds (±5 years by default).
  - `dishId`: must exist and belong to user.
- Common:
  - Reject unknown fields; return 422 with field-specific messages.
  - Enforce `limit` bounds (max 100) to protect DB.

Business logic:

- Create dish with tags:
  - Normalize `tagNames` → lowercase; upsert per user; attach via `dish_tags` (unique `(dish_id, tag_id)`).
  - In a transaction: insert dish, upsert tags, link, commit. Upon success, try to insert `events(dish_added)` with `tags_count`; ignore event failures (log only).
- Update dish tags:
  - Replace set semantics on PUT: compute new set from `tagNames|tagIds`, attach missing, detach extras.
  - Removing a tag from a dish does NOT delete the tag globally. To remove tag everywhere, call `DELETE /tags/{id}`.
- List dishes with AND-tag filters:
  - Use join/subquery counting matches across requested `tagId[]`, require count==N.
  - Search by fragment (`ILIKE` or trigram where available).
  - `usage_prio` sort:
    - Compute `lastUsedDay` via `max(day)` from `day_plans` per dish (left join).
    - ORDER BY `lastUsedDay IS NULL DESC`, `lastUsedDay ASC`, `name ASC`.
    - Covered by `day_plans_usage_idx`.
- Day plan upsert-by-date:
  - Use unique `(user_id, day)` to `INSERT ... ON CONFLICT ... DO UPDATE` with new `dish_id`.
  - Emit `events(day_planned)` with `user_id`, `date`, `dish_id`; ignore failures.
- Delete tag globally:
  - `DELETE /tags/{id}` detaches from all dishes then removes the tag row (RLS ensures scoping).

Error model and status codes:

- 200 OK, 201 Created, 202 Accepted, 204 No Content as applicable.
- 400 Bad Request (malformed parameters), 401 Unauthorized (missing/invalid token), 403 Forbidden (shouldn’t occur with RLS unless extra policies), 404 Not Found, 409 Conflict (uniqueness), 422 Unprocessable Entity (validation), 429 Too Many Requests (rate limits), 500 Internal Error (unexpected).

Security and rate limiting:

- Require HTTPS.
- Rate limit defaults (suggested):
  - Auth endpoints: 10 req/min per IP.
  - Mutations: 60 req/min per user.
  - Reads: 120 req/min per user.
  - Return 429 with `Retry-After` header.
- Optional `Idempotency-Key` header for POST/PUT on `/dishes` and `/day-plans/{day}` to protect against retries (store short-lived keys server-side, 24h TTL).

Pagination strategies:

- Keyset (cursor) pagination using stable indexed columns:
  - Dishes: `(created_at DESC, id DESC)` via `dishes_user_created_idx`.
  - Day plans: `day DESC` via `day_plans_user_day_idx`.
- Fallback to `page`/`limit` for simplicity in admin tools.

Implementation notes (Astro + Supabase):

- Place handlers under `src/pages/api/v1/**`. Use server-side Supabase client with service role (if needed) or user JWT; prefer user JWT and RLS for safety.
- For multi-step operations (e.g., create dish with tags + links + event), wrap in a Postgres function called via `rpc()` to guarantee transactional integrity and minimize roundtrips; or use `pg-transaction` support if available.
- Normalize tag names strictly on the server; never trust client case.
- Do not accept or echo `user_id` fields; always infer from JWT.

---

This plan aligns with:

- PRD requirements: private per-user data, dishes CRUD with tags, range-based day planning with manual selection and usage-prioritized suggestions, minimal analytics, responsive/performant lists.
- DB constraints and indices: length checks, unique `(user_id, day)`, tag uniqueness per user (case-insensitive), search and AND-tag filtering, last-used sorting backed by indices.
- Stack: Astro API routes + Supabase (Auth, Postgres with RLS). Optional simple rate limiting middleware can be added in `src/middleware/index.ts`.
