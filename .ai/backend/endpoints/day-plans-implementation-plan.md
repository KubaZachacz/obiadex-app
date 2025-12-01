# API Endpoint Implementation Plan: Day Plans

## 1. Przegląd punktu końcowego

- Obsługuje zarządzanie planami dnia użytkownika w tabeli `day_plans`, wymagając uwierzytelnionej sesji Supabase.
- Udostępnia listowanie zakresowe, pobieranie szczegółów, przypisywanie dania (upsert) oraz usuwanie przypisania przy wykorzystaniu `dishes`, `tags` i `events`.
- PUT gwarantuje spójność `(user_id, day)` i publikuje zdarzenie `day_planned`; błędy zapisu eventu nie blokują odpowiedzi.
- Handlery rezydują w `src/pages/api/day-plans/index.ts` (GET zakresu) oraz `src/pages/api/day-plans/[day].ts` (GET/PUT/DELETE), a logika domenowa w `src/lib/services/dayPlans.ts`.

## 2. Szczegóły żądania

### GET /day-plans

- Metoda HTTP: GET.
- Struktura URL: `/api/day-plans`.
- Parametry wymagane: `start` (`YYYY-MM-DD`, dolna granica włącznie) i `end` (`YYYY-MM-DD`, ≥ `start`, okno ≤ 180 dni).
- Parametry opcjonalne: `sort` (`asc` domyślnie lub `desc`).
- Request body: brak.
- Powiązane typy wejścia: `DayPlanRangeQuery` (alias `DayPlanListQuery`).

### GET /day-plans/{day}

- Metoda HTTP: GET.
- Struktura URL: `/api/day-plans/{day}`, gdzie `day` jest `YYYY-MM-DD`.
- Parametry wymagane: parametr ścieżki `day`.
- Parametry opcjonalne: brak.
- Request body: brak.
- Powiązane typy wejścia: walidowany string daty (zod schema).

### PUT /day-plans/{day}

- Metoda HTTP: PUT.
- Struktura URL: `/api/day-plans/{day}`.
- Parametry wymagane: `day` w ścieżce.
- Parametry opcjonalne: brak.
- Request body: `DayPlanUpsertCommand` zawierający `dishId` (UUID).
- Reguły dodatkowe: `dishId` musi istnieć w `dishes` użytkownika przed zapisem.

### DELETE /day-plans/{day}

- Metoda HTTP: DELETE.
- Struktura URL: `/api/day-plans/{day}`.
- Parametry wymagane: `day` w ścieżce.
- Parametry opcjonalne: brak.
- Request body: brak.
- Powiązane typy wejścia: walidowany string daty.

## 3. Szczegóły odpowiedzi

### GET /day-plans

- Kod 200 OK.
- Struktura: `DayPlanListResponse` (`data: DayPlanListItemDTO[]`, `range: { start, end }`), z wpisami `dish: DishSummaryDTO`.

### GET /day-plans/{day}

- Kod 200 OK.
- Struktura: `DayPlanDTO` z projekcją `dish: DishWithTagsDTO`.

### PUT /day-plans/{day}

- Kod 201 Created gdy rekord tworzony, 200 OK gdy aktualizowany.
- Struktura: `DayPlanUpsertResponse` (`id`, `day`, `dish: DishSummaryDTO`).

### DELETE /day-plans/{day}

- Kod 204 No Content.
- Struktura: brak treści.

## 4. Przepływ danych

### GET /day-plans

1. Handler autoryzuje żądanie poprzez Supabase Auth helper.
2. Parametry `start`, `end`, `sort` są walidowane w zod (format ISO, zakres ≤ 180 dni, sort w union).
3. `DayPlanService.listRange` pobiera wiersze z `day_plans`, filtruje po `user_id`, sortuje wg `day` i ogranicza kolumny do `id`, `day`, `dish_id`, `dishes.name`.
4. Serwis mapuje wyniki do `DayPlanListItemDTO`, zwraca `range`.

### GET /day-plans/{day}

1. Walidacja `day` (ISO date) oraz autoryzacja.
2. `DayPlanService.getByDay` wykonuje pojedynczy select wraz z relacją `dishes` i powiązanymi `tags` (JOIN na `dish_tags`).
3. Brak rekordu → 404; inaczej mapowanie do `DayPlanDTO`.

### PUT /day-plans/{day}

1. Walidacja `day` oraz zod body (`dishId` UUID).
2. Serwis weryfikuje, że `dishId` należy do użytkownika (`exists` query).
3. Upsert `day_plans` przez Supabase (`upsert` z `onConflict: user_id, day`), zwracając `id`, `day`, `dish_id`.
4. Dołączenie nazwy dania z `dishes`; konstruowanie DTO.
5. Asynchroniczne emitowanie `day_planned` do `events` z payloadem (`dish_id`, `day`) z obsługą błędów w logach.

### DELETE /day-plans/{day}

1. Walidacja `day`, autoryzacja.
2. `DayPlanService.delete` usuwa rekord poprzez `.delete().match({ user_id, day })`.
3. Brak usuniętych wierszy → 404; sukces → 204.

## 5. Względy bezpieczeństwa

- Wymagana sesja Supabase (`Authorization: Bearer`) na każdym żądaniu, brak sesji → 401.
- RLS w `day_plans`, `dishes`, `tags` wymusza `user_id = auth.uid()`, ale usługi dodatkowo filtrują po `user_id`.
- Zod schematy blokują niepoprawne daty, zakresy > 180 dni i niepoprawne UUID, redukując powierzchnię ataku SQL.
- `dishId` jest weryfikowany przed upsertem, zapobiegając przekierowywaniu obcych rekordów do bieżącego użytkownika.
- Dane zdarzeń są sanityzowane i ograniczane do minimalnego payloadu, aby uniknąć wycieku PII.
- Limitowanie żądań (np. middleware) i obserwowalność metryk chronią przed nadużyciami.

## 6. Obsługa błędów

- 400 Bad Request: brak wymaganych parametrów lub nieparsowalny format przekazany do handlera (wykryte przed zod).
- 401 Unauthorized: Supabase nie zwróci użytkownika; zwracamy zgodnie z middleware.
- 404 Not Found: brak planu dla `day` przy GET/DELETE lub brak `dishId` przy PUT.
- 422 Unprocessable Entity: naruszenia walidacji (zakres > 180 dni, `dishId` nie-UUID, `day` poza ISO).
- 500 Internal Server Error: błędy Supabase lub zapisu eventu; logowane przez wspólny logger i system alertów, brak dedykowanej tabeli błędów.

## 7. Wydajność

- Zapytania zakresowe korzystają z indeksu `day_plans_user_day_idx`; zawsze filtrujemy po `user_id` i sortujemy po `day`.
- Limit 180 dni chroni przed dużymi transferami; UI może stronicować poprzez ponowne wywołania.
- Selecty są projekcjowane do minimalnych kolumn (np. brak `tags` w liście), redukując payload.
- Łączenie tagów w GET pojedynczego dnia odbywa się jednym zapytaniem z `select`em relacyjnym, unikając N+1.
- Upsert i delete korzystają z jednej rundy do bazy; event logging wykonywany asynchronicznie, aby nie blokować odpowiedzi.

## 8. Kroki implementacji

1. Utwórz zod schematy (`daySchema`, `dayRangeSchema`, `dayPlanUpsertSchema`) w `src/lib/validation/dayPlans.ts`.
2. Zaimplementuj `DayPlanService` w `src/lib/services/dayPlans.ts` z metodami `listRange`, `getByDay`, `upsert`, `delete`, mapującymi do DTO z `src/types.ts`.
3. Dodaj helper do tworzenia `events` (`day_planned`) z bezpiecznym logowaniem błędów (np. `logger.error`), wykonywany w tle.
4. Stwórz API route `src/pages/api/day-plans/index.ts` obsługujący GET zakresu (wspólny handler dla listowania).
5. Stwórz API route `src/pages/api/day-plans/[day].ts` z rozgałęzieniem na GET/PUT/DELETE, korzystający z walidatorów i serwisu.
6. Dodaj testy jednostkowe/kontraktowe dla walidatorów i serwisu (np. Vitest + Supabase client mock) obejmujące kody 200/201/204/404/422.
7. Uaktualnij dokumentację API w `.ai/api-plan.md` lub README, aby odzwierciedlała konkretną walidację i statusy.
8. Zweryfikuj działanie przez scenariusze e2e (np. skrypt seedujący), monitorując logi eventów dla regresji.
