# API Endpoint Implementation Plan: GET /analytics/summary

## 1. Przegląd punktu końcowego

- Dostarcza zliczenia zdarzeń `dish_added` oraz `day_planned` dla zalogowanego użytkownika w zadanym oknie czasu.
- Dane pochodzą z tabeli `events`, która jest chroniona RLS i indeksowana według `user_id` oraz `created_at`.
- Wynik zasila widok analityczny, dlatego musi być szybki, deterministyczny i odporny na awarie – błąd zapisu eventów nie może blokować żądania.

## 2. Szczegóły żądania

- Metoda HTTP: `GET`
- Struktura URL: `/api/analytics/summary`
- Parametry zapytania (wszystkie w UTC ISO 8601, bez ms):
  - Wymagane:
    - `start`: początek zakresu (włącznie). Musi być parsowalny do `Date`, nie późniejszy niż `end`.
    - `end`: koniec zakresu (włącznie). Musi być ≥ `start` oraz nie później niż bieżący czas.
  - Opcjonalne:
    - Brak w specyfikacji; ewentualne rozszerzenia (np. `tz`) pozostają poza MVP.
- Ograniczenia walidacyjne:
  - Maksymalna długość okna czasu np. 180 dni (konfigurowalne, aby ograniczyć koszt zapytań).
  - Dopuszczalne wyłącznie zdarzenia z enumeracji `('dish_added','day_planned')`.
- Nagłówki: `Authorization: Bearer <supabase-jwt>` lub sesja z Astro cookies (zgodnie z istniejącym mechanizmem auth).
- Body: brak.

## 3. Wykorzystywane typy

- `AnalyticsSummaryQuery` (`src/types.ts`) – wejściowy DTO dla zakresu czasowego.
- `AnalyticsSummaryDTO` (`src/types.ts`) – strukturka odpowiedzi z licznikami.
- `EventRow` (`src/types.ts`) – pomocniczo do mapowania wyników z tabeli `events`.
- Nowy typ serwisowy `AnalyticsSummaryFilters` (np. `{ userId: string; start: string; end: string; }`) w `src/lib/services/analytics.ts`.
- Ewentualny wynik RPC `AnalyticsSummaryRow` (np. `{ event_type: EventRow["event_type"]; count: number; }`).

## 4. Szczegóły odpowiedzi

- Sukces 200 OK:
  ```json
  {
    "dishAdded": { "count": 42 },
    "dayPlanned": { "count": 120 }
  }
  ```
- Nagłówki: `Content-Type: application/json`, `Cache-Control: no-store`.
- Błędy:
  - 400/422 – błędne parametry (brak `start/end`, nieparsowalne daty, zakres > limit).
  - 401 – brak uwierzytelnienia / sesji.
  - 500 – błąd Supabase / nieoczekiwany wyjątek (logowany i maskowany ogólnym komunikatem).

## 5. Przepływ danych

1. Żądanie trafia do `src/pages/api/analytics/summary.ts` (API Route Astro). Inne metody niż GET zwracają 405.
2. Handler korzysta z istniejącego helpera Supabase (np. `getSupabaseServerClient(AstroCookies)`); pobiera aktualnego użytkownika.
3. Query string walidowany z użyciem `zod` (`z.object({ start: z.string().datetime(), end: z.string().datetime() })` + custom refinements: kolejność, maks. zakres, `end <= now`).
4. Po walidacji tworzony jest `AnalyticsSummaryQuery` i przekazywany do serwisu `analyticsService.getSummary`.
5. Serwis odpowiada za interakcję z bazą:
   - Preferowane utworzenie funkcji SQL `analytics_summary(start_ts timestamptz, end_ts timestamptz)` (RLS-aware, wykorzystującej `auth.uid()` i indeks `events_user_created_idx`).
   - Alternatywnie (bez funkcji) zapytanie `supabase.from("events").select("event_type, count:event_type", { head: false }).eq("user_id", userId).gte("created_at", start).lte("created_at", end).in("event_type", ...).order("event_type")` z agregacją `GROUP BY event_type` poprzez zapytanie RPC (`rpc('analytics_summary', {...})`).
6. Wynik agregacji mapowany na `AnalyticsSummaryDTO`, brakujące typy (np. gdy 0 zdarzeń) uzupełniane wartością 0.
7. Handler serializuje DTO, ustawia status 200 i nagłówki, zwraca odpowiedź.

## 6. Względy bezpieczeństwa

- Autoryzacja: tylko zalogowany użytkownik – brak sesji => 401.
- RLS: zapytanie musi zawierać `user_id = auth.uid()` (lub rely na funkcji SQL wykorzystującej `auth.uid()`), aby nie wyciekały obce dane.
- Walidacja wejścia eliminuje ataki typu injection/hot loop (złe daty, gigantyczne zakresy, DoS).
- Brak danych wrażliwych w logach; logować wyłącznie metadane (user id skrócone, zakres).
- Dodać limit rate (jeśli istnieje middleware) lub wprowadzić minimalny czas między żądaniami w UI.
- Obsłużyć `OPTIONS` dla CORS, jeżeli front hostowany osobno.

## 7. Obsługa błędów

- Walidacja `start/end`: zwrócić 422 z komunikatem `INVALID_DATE_RANGE`.
- Brak użytkownika w kontekście Supabase: 401 `UNAUTHORIZED`.
- Supabase RPC/SQL błąd: log `logger.error({ userId, start, end, error })`, odpowiedź 500 `INTERNAL_ERROR`.
- Metoda ≠ GET: 405 `Method Not Allowed`.
- Brak danych nie jest błędem – zwracamy liczniki równe 0.
- Nie posiadamy dedykowanej tabeli błędów; logujemy do centralnego loggera (np. `src/lib/logging.ts`) oraz integracji APM jeżeli istnieje.

## 8. Rozważania dotyczące wydajności

- Indeks `events_user_created_idx (user_id, created_at DESC)` wspiera zakresowe zapytania i agregację.
- Limit zakresu dat zapobiega pełnoskanowym zapytaniom; wartości sensowne: ≤ 1 rok.
- Funkcja SQL agregująca korzysta z `FILTER (WHERE event_type = ...)`, dzięki czemu wykonuje jedno skanowanie indeksu.
- Endpoint jest niecache’owany po stronie przeglądarki (dane prywatne), ale można dodać krótkie cache server-side (np. 30 s w pamięci) jeśli UI odświeża często.
- Monitorować czas wykonania i liczniki w logach, aby wykrywać rosnący wolumen danych.

## 9. Kroki implementacji

1. **SQL** – utwórz migrację Supabase z funkcją `analytics_summary(start_ts timestamptz, end_ts timestamptz)`:
   - Zwraca rekord `{ dish_added bigint, day_planned bigint }`.
   - Ustaw `security definer` oraz `check auth.uid() IS NOT NULL`; filtruj `user_id = auth.uid()`; korzystaj z `events_user_created_idx`.
2. **Service layer** – dodaj `src/lib/services/analytics.ts` z funkcją `getSummary(client, filters)`:
   - Wywołuje RPC, mapuje wynik do `AnalyticsSummaryDTO`, obsługuje brak danych.
3. **Validation schema** – w `src/lib/validation/analytics.ts` lub w samym handlerze zdefiniuj `zod`-owy schema + helper `assertDateRange`.
4. **API route** – zaimplementuj `src/pages/api/analytics/summary.ts`:
   - Obsługa tylko GET, sprawdzanie metody, auth, walidacja, delegacja do serwisu, mapowanie odpowiedzi, nagłówki.
5. **Error handling** – wykorzystaj istniejący logger (lub `console.error`) do rejestrowania błędów Supabase wraz z identyfikatorem żądania.
6. **Testing** – dodaj testy jednostkowe dla serwisu (mock Supabase client) oraz test integracyjny API (Vitest + MSW / lokalny Supabase) pokrywający: happy-path, brak danych, błędny zakres, brak auth.
7. **Documentation** – zaktualizuj `@api-plan.md` / README (sekcja API) jeśli wymagane, opisując przykłady zapytań.
8. **Monitoring** – skonfiguruj metrics/logi (np. w middleware) do mierzenia czasu odpowiedzi endpointu oraz liczby błędów 5xx.
