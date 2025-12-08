<analiza_projektu>
Kluczowe komponenty: Warstwa UI Astro/React z widokami `/login`, `/signup`, `/reset-password`, `/` (lista dni) oraz `/dishes`; nakładki routowalne `DayPlanOverlay` (view/edit) i `DishEditorOverlay`; komponenty listujące (`DayWeekView`, `DishList`, `DishPickerList`) i formularze (`LoginForm`, `SignupForm`, `DishForm`, `ResetPasswordForm`, `TagCreatableCombobox`, `TagFilterCombobox`, `SearchInput`, `Pagination`); logika stanu w hookach (`useDishListFilters`, `useDishPicker`, `useWeekViewport`, `useDebouncedValue`, `useAddDishDialog`); warstwa API w `src/pages/api/**` (auth, dishes + tags, day-plans, analytics/summary) oparta o Supabase; serwisy domenowe (`analyticsService`, `authService`, `dayPlanService`, `dishService`, `dishTagService`, `tagService`) i walidacje w `lib/validation/*`; middleware auth w `src/middleware/index.ts`; typy Supabase w `src/db`; migracje w `supabase/migrations`; seed danych testowych; wspólne UI shadcn/ui i globalne style.
Stos technologiczny i wpływ na testy: Astro 5 + React 19 → konieczne testy SSR/CSR oraz sprawdzenie hydratacji wysp React; TypeScript 5 → statyczna analiza i typowe testy jednostkowe; Tailwind 4 + shadcn/ui → wizualna regresja i dostępność; Supabase (Auth + Postgres z RLS) → testy integracyjne z realną bazą i RLS (brak user_id w payloadach); API REST w Astro routes → kontraktowe testy schematów i statusów; Zod walidacje w `lib/validation` → jednostkowe testy walidacji; eventy analytics nieblokujące → testy best-effort/logging.
Priorytety testowe: 1) Autoryzacja/ochrona tras (middleware + API 401/403); 2) Krytyczne przepływy domenowe: tworzenie/edycja dań z tagami, planowanie dnia (PUT /day-plans/{day}), filtrowanie/sortowanie usage_prio; 3) Walidacje i normalizacja tagów (lowercase, unikalność) oraz limit długości pól; 4) Integracja z Supabase (RLS, brak user_id, poprawne zapisy day_plans/dish_tags); 5) UI overlaye i nawigacja routowalna; 6) Stabilność paginacji/wyszukiwania; 7) Dostępność (a11y) i responsywność dialog/drawer; 8) Odporność na błędy (422/409/404/429).
Ryzyka: Błędy autoryzacji (niewymuszone 401) i RLS (przecieki danych); złożone operacje tagów (global delete, normalizacja do lowercase, AND filter) mogą psuć spójność; sort usage_prio i daty (TZ, format YYYY-MM-DD) podatne na regressions; idempotency-key niezaimplementowany lub ignorowany; overlaye zależne od parametrów URL mogą gubić stan; brak pełnych testów e2e dla dialog/drawer mobile/desktop; walidacje długości pól i limitów page/pageSize mogą być pominięte; Supabase eventy best-effort trudne do weryfikacji bez mocków/logów.
</analiza_projektu>

<plan_testów>
## 1. Wprowadzenie i cele
- Zapewnienie jakości funkcjonalności planowania posiłków: autoryzacja, CRUD dań i tagów, planowanie dni, analityka.
- Weryfikacja zgodności API z kontraktem (`/auth`, `/dishes`, `/tags`, `/day-plans`, `/analytics/summary`) i UI z wymaganiami (overlaye, filtrowanie, responsywność).
- Minimalny, ale kompletny zestaw testów regresyjnych pokrywających ścieżki krytyczne i ryzyka wskazane w analizie.

## 2. Zakres testów
- Frontend (Astro/React): widoki auth, home (lista dni), baza dań, overlaye `DayPlanOverlay` i `DishEditorOverlay`, komponenty filtrów/szukania/paginacji.
- API: autoryzacja, walidacje payloadów, logika tagów (tworzenie, normalizacja, global delete), sortowanie/paginacja, day-plans upsert, analytics summary.
- Integracja z Supabase (Auth + DB z RLS) i middleware auth.
- Niefunkcjonalne: a11y podstawowe, responsywność (desktop/mobile), wydajność lekka (TBD smoke), stabilność walidacji typów TS.

## 3. Typy testów
- Testy statyczne: ESLint (`npm run lint`), Prettier, kontrola typów TS (`tsc --noEmit`), zod schema checks (jednostkowe).
- Testy jednostkowe (Vitest): serwisy domenowe (`lib/services/*`), walidacje (`lib/validation/*`), utils dat (`lib/date/utils`), hooki (`useDishListFilters`, `useDishPicker`, `useDebouncedValue`, `useWeekViewport`).
- Testy integracyjne API (Vitest + Supertest/Postman/Newman): `src/pages/api/**` z realnym Supabase testowym; kontrakty statusów/body/limitów; RLS i brak `user_id` w payloadach.
- Testy E2E UI (Playwright): ścieżki auth, home + overlay, baza dań + filtr, edycja dania z tagami, usunięcie tagu globalnie, zmiana dania dnia, responsywność (mobile viewport) oraz a11y smoke (axe).
- Testy migracji/DB: uruchomienie migracji na czystej bazie, seed danych testowych.
- Testy wydajności lekkie: czas odpowiedzi głównych endpointów (p50/p95) na środowisku lokalnym (opcjonalne).

## 4. Scenariusze kluczowe (minimalny zestaw)
- Auth i ochrona tras:
  - Brak sesji → redirect do `/login`; dostęp do `/dishes` i `/` wymaga tokenu.
  - `/auth/login` sukces/401, `/auth/signup` 201/409, `/auth/reset-password` 202/400, `/auth/logout` 204/401.
- Dishes + tags:
  - `POST /dishes` z `tagNames` (lowercase, min 1) → 201; walidacje długości name/url/recipeText; 422 gdy brak tagów.
  - `PUT /dishes/{id}` pełna podmiana tagów: dodanie brakujących, usunięcie nieużywanych dla dania (bez global delete).
  - `GET /dishes` paginacja (page/pageSize bounds), filtr AND `tagId[]`, sort `usage_prio` (NULL first, potem day ASC, name ASC), wyszukiwanie `q`.
  - `DELETE /tags/{id}` odcina tag globalnie, zwraca `detachedFrom`.
  - Normalizacja tagów: duplikaty różniące się wielkością liter → konflikt/uniifikacja zgodnie z kontraktem.
- Day plans:
  - `PUT /day-plans/{day}` (upsert) poprawnie zapisuje/aktualizuje danie; nie przyjmuje `user_id`; walidacje daty (format, zakres) i istnienia dishId; odpowiednio 201/200/422/404.
  - `GET /day-plans?start&end` zwraca tylko zakres, obsługa sort asc/desc; limit długości zakresu.
  - UI: otwarcie overlay z parametrem `?day=YYYY-MM-DD`, tryb view/edit, zmiana dania, zapis i odświeżenie kafla.
- Baza dań UI:
  - Lista 20/strona, paginacja zachowuje filtr/szukaj; puste stany.
  - Wyszukiwanie debounced, filtr tagów AND, zachowanie dla braku wyników.
  - Otwarcie `DishEditorOverlay` z FAB i z `/dishes/[id]/edit`; walidacje formularza (name 3–80, tag ≥1, recipe_text ≤2000, url ≤255); zapis sukces/422/409.
  - Usunięcie tagu z multi-selecta inicjuje `DELETE /tags/{id}` (gdy potwierdzone) i aktualizuje listę.
- Home/Day overlay UI:
  - Render 1 tydzień mobile / 3 tygodnie desktop; nawigacja WeekNavigator (poprzedni/następny tydzień).
  - `DishPickerList` sort `usage_prio`, oznaczenie „nigdy niewybrane”.
  - Dodanie nowego dania z overlay dnia (CTA) i powrót do wyboru.
- Analytics:
  - `GET /analytics/summary` 200 z agregatami, 422 dla złych dat.
- Dostępność i responsywność:
  - Dialog vs Drawer (breakpoint mobile) fokus trap, ESC/close, ARIA role; nawigacja klawiaturą do FAB i pól formularza.

## 5. Środowisko testowe
- Lokalny serwer: `npm install`, `npm run dev` (http://localhost:4321); `npm run build` dla smoke.
- Supabase: lokalny projekt lub testowy workspace; uruchom migracje `supabase db push` lub SQL z `supabase/migrations`; seed opcjonalnie `seed/seed.ts`.
- Zmienne środowiskowe zgodne z `src/env.d.ts` i `.env.example` (testowe klucze Supabase, URL, service role jeśli potrzebne dla testów).
- Baza testowa oddzielona od produkcyjnej; czyszczenie danych per suite.

## 6. Narzędzia
- Lint/format: `npm run lint`, `npm run format`.
- Typy: `tsc --noEmit`.
- Unit/integration: Vitest + Testing Library (React) + Supertest dla API routes.
- E2E: Playwright (desktop + mobile viewport), axe-core dla a11y smoke.
- API kontrakty: Postman/Newman (`Obiadex_API.postman_collection.json`) lub pact-like schematy (opcjonalnie).
- Supabase CLI do migracji/seed, pgTap (opcjonalnie) dla testów funkcji SQL.
- Monitorowanie logów Supabase dla RLS i błędów.

## 7. Harmonogram (minimalny)
- Dzień 1: konfiguracja środowisk, dane testowe, sanity API/auth.
- Dzień 2: testy jednostkowe serwisów/validation + integracja API (dishes/tags/day-plans).
- Dzień 3: E2E UI kluczowe ścieżki (auth, home overlay, dishes CRUD/filter).
- Dzień 4: regresja a11y/responsywność, lekkie wydajnościowe, re-test krytycznych poprawek.

## 8. Kryteria akceptacji
- 0 blockerów/krytyków w ścieżkach: logowanie, tworzenie/edycja dania z tagami, zapis planu dnia, filtr/sort/paginacja dań, global delete tagu.
- Wszystkie testy lint/typy/unit/integration/e2e przechodzą na środowisku testowym.
- Walidacje zgodne z kontraktem (422/409/404/401) i brak przecieków RLS między użytkownikami testowymi.
- UI dostępne klawiaturą, dialog/drawer spełnia podstawowe ARIA, responsywność potwierdzona dla mobile/desktop.

## 9. Role i odpowiedzialności
- QA: prowadzi plan, pisze scenariusze E2E/API, raportuje defekty, monitoruje regresję.
- Dev: wspiera debug, dodaje testy jednostkowe/integracyjne w kodzie serwisów/API, utrzymuje migracje/seed.
- PM/Owner: priorytetyzuje defekty, akceptuje kryteria wejścia/wyjścia.

## 10. Raportowanie błędów
- Kanał: system ticketów (np. Jira) + krótkie notatki w repo (issues).
- Zgłoszenie zawiera: środowisko/commit, kroki, oczekiwany vs faktyczny wynik, logi (API response, supabase logs), zrzuty ekranu/video (dla UI), dane testowe użyte, severity/prioritet.
- Triage codzienny w fazie testów; linki do scenariuszy Playwright/Postman; statusy śledzone do zamknięcia z re-testem.
</plan_testów>


