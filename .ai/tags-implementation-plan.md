# API Endpoint Implementation Plan: Tags Collection

## 1. Przegląd punktu końcowego

- Obsługiwane ścieżki: `GET /tags`, `POST /tags`, `DELETE /tags/{id}` zgodnie z @api-plan.md.
- Zakres funkcjonalny: pełne zarządzanie tagami użytkownika w Supabase (lista, tworzenie/upsert, usuwanie wraz z odłączeniem od dań).
- Warstwa technologiczna: Astro API routes (React/TypeScript), Supabase SDK, Zod walidacje, Tailwind/Shadcn jedynie dla konsumentów UI (brak wpływu na endpointy).

## 2. Szczegóły żądania

### GET /tags

- **Metoda/URL:** `GET /tags`
- **Parametry wymagane:** brak.
- **Parametry opcjonalne:** `includeCounts` (boolean, domyślnie `false`) — decyduje o dołączeniu `dishCount`.
- **Body:** brak, wartości z `URLSearchParams`.
- **Walidacja:** Zod `z.object({ includeCounts: z.coerce.boolean().optional() })`, zakaz innych parametrów (fail-fast).

### POST /tags

- **Metoda/URL:** `POST /tags`
- **Tryb single create:** body `{ "name": string }`.
- **Tryb bulk upsert:** body `{ "names": string[] }`.
- **Parametry wymagane:** dokładnie jedno z pól (`name` XOR `names`); `names` co najmniej 1 element.
- **Ograniczenia:** każdy wpis 2–30 znaków, po `trim()` i konwersji do lowercase; limit długości listy (np. 50) w celu ochrony przed nadużyciami.
- **Walidacja:** Zod discriminated union; dodatkowa deduplikacja po lowercase.

### DELETE /tags/{id}

- **Metoda/URL:** `DELETE /tags/{id}`
- **Parametry wymagane:** `id` w ścieżce (UUID).
- **Parametry opcjonalne/body:** brak.
- **Walidacja:** Zod `z.object({ id: z.string().uuid() })`; mapowanie z `Astro.params`.

## 3. Szczegóły odpowiedzi

### GET /tags

- **Kod sukcesu:** 200.
- **Payload:** `{ "data": TagListItemDTO[] }`, gdzie `dishCount` obecne tylko gdy `includeCounts=true`.
- **Typy:** `TagDTO`, `TagListItemDTO`, `TagListResponse` z `src/types.ts`.

### POST /tags

- **Single create:** kod 201, payload `TagDTO`.
- **Bulk upsert:** kod 200, payload `{ "tags": TagDTO[] }` (kolejność wg wejścia po deduplikacji).
- **Typy:** `TagCreateCommand`, `TagUpsertManyCommand`, `TagDTO`.

### DELETE /tags/{id}

- **Kod sukcesu:** 200.
- **Payload:** `{ "deleted": true, "detachedFrom": number }` (`detachedFrom` to liczba rekordów `dish_tags` usuniętych przez kaskadę).
- **Typy:** `TagDeleteResult`.

## 4. Przepływ danych

1. **Autoryzacja:** Astro API route pobiera aktualną sesję (Supabase auth helper). Brak sesji ⇒ 401.
2. **Walidacja:** Zod schematy (z `src/lib/validation/tagSchemas.ts`) obsługują query/body/path; błędy mapowane na 400/422.
3. **Serwis:** Logika w `src/lib/services/tagService.ts`:
   - `listTags(userId, includeCounts)` – query `tags` z filtrem `user_id = auth.uid()`, opcjonalna agregacja `dish_tags` (`count(*) FILTER` lub `select count`).
   - `createTag(command, userId)` – insert z `name.toLowerCase()`, `returning`.
   - `upsertMany(names, userId)` – `insert` z `on conflict (user_id, name) do update set updated_at = now()` i zwróceniem unikalnych rekordów.
   - `deleteTag(userId, tagId)` – transakcyjnie: zlicz `dish_tags`, usuń `tags` (kaskada), zwróć wynik.
4. **Baza:** Supabase PostgREST/SQL; wykorzystanie indeksów: `tags_user_name_idx`, `dish_tags_tag_dish_idx`.
5. **Transformacja odpowiedzi:** Mapowanie rekordów na DTO (camelCase) w warstwie serwisu lub route; `dishCount` usuwane, gdy niewymagane.
6. **Logowanie:** Centralny logger (np. `src/lib/logger.ts`) rejestruje sukcesy/błędy z `requestId`, `userId`.

## 5. Względy bezpieczeństwa

- **Autentykacja:** Każde żądanie wymaga ważnego tokena Supabase; brak ⇒ 401.
- **Autoryzacja:** RLS (`USING user_id = auth.uid()`) + jawny filtr `eq("user_id", userId)` w każdej operacji.
- **Walidacja danych:** Ścisłe schematy Zod + limit długości list w bulk; odrzucanie dodatkowych pól (`stripUnknown`).
- **Normalizacja danych:** Wymuszenie lowercase + `trim()` jeszcze przed wejściem do serwisu, aby uniknąć obejścia unikalności.
- **Rate limiting / DoS:** Ograniczenie liczby nazw w bulk, ewentualnie integracja z ogólnym limiterem API middleware.
- **Observability:** Logowanie ważnych pól (bez danych wrażliwych), metryki czasu zapytań do Supabase.

## 6. Obsługa błędów

- **400 Bad Request:** Niepoprawne JSON, niewspierane pola, błędne typy query/path; zawiera komunikaty z Zod (`issues`).
- **401 Unauthorized:** Brak/niepoprawna sesja; wspólna odpowiedź `{"error":"unauthorized"}`.
- **404 Not Found:** DELETE gdy tag nie istnieje (brak rekordu w `delete returning`).
- **409 Conflict:** Pojedyncze utworzenie tagu trafia w constraint 23505 (`tags_user_name_idx`); mapować na 409 z komunikatem o duplikacie.
- **422 Unprocessable Entity:** Spełnia spec (np. nazwa <2 znaków). Używać, gdy struktura poprawna, lecz dane naruszają zasady domenowe.
- **500 Internal Server Error:** Niespodziewane błędy Supabase/serwera; logować stack, zwracać ogólny komunikat.
- **Logowanie błędów:** Wszystkie >=400 (poza 401) logowane jako warn/error; przechowywać `requestId`, `userId`, `payloadMode`.

## 7. Wydajność

- Brak paginacji ⇒ możliwie niska latencja przez selekcję tylko niezbędnych kolumn (`id`, `name`, `created_at`, `updated_at`).
- `includeCounts=true` może być kosztowne; stosować pojedyncze zapytanie z `LEFT JOIN LATERAL (SELECT count(*) ...)` lub `group by tags.id`.
- Deduplikacja listy nazw w pamięci (Set) przed uderzeniem do DB zmniejsza liczbę operacji.
- W DELETE używać `select count(*) from dish_tags where user_id = $1 and tag_id = $2` przed `delete` albo `WITH deleted AS (...)` by uniknąć wielu round-tripów.
- Cache HTTP kontrolowany nagłówkami `Cache-Control: private, max-age=0`; opcjonalnie etag, jeśli w przyszłości dojdzie front-cache.

## 8. Kroki implementacji

1. **Schematy walidacji:** Utwórz `src/lib/validation/tagSchemas.ts` z Zod dla query/body/path wraz z testami jednostkowymi.
2. **TagService:** Zaimplementuj `src/lib/services/tagService.ts` z metodami `listTags`, `createTag`, `upsertMany`, `deleteTag`, wstrzykuj Supabase klienta i logger.
3. **API routes:**
   - `src/pages/api/tags/index.ts` obsługuje `GET` i `POST` (branch na `context.request.method`).
   - `src/pages/api/tags/[id].ts` obsługuje `DELETE`.
   - Ustaw `export const prerender = false`, korzystaj z `zod` i usług serwisowych.
4. **Obsługa błędów:** Dodaj helper `respondValidationError`, `respondDbError` w `src/lib/http/responses.ts` (jeśli nie istnieją) zgodnie z regułami.
5. **Testy:** Przygotuj testy integracyjne (np. Vitest + mocked Supabase) dla każdego scenariusza + e2e contract tests (Insomnia/Postman).
6. **Monitorowanie:** Skonfiguruj logger + ewentualnie Sentry instrumentation dla API routes, aby wychwytywać 5xx.
7. **Dokumentacja:** Zaktualizuj README/API docs oraz workflow w `.ai/api-plan.md`, jeśli dodano nowe szczegóły wykonawcze.
