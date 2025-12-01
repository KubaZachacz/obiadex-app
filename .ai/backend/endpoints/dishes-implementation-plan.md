# API Endpoint Implementation Plan: /dishes

## 1. Przegląd punktu końcowego
- Ścieżka obsługuje pełny CRUD na zasobie `dishes`, włącznie z zarządzaniem powiązaniami `tags` oraz utrzymaniem spójności z `day_plans`.
- Każda operacja działa w kontekście zalogowanego użytkownika Supabase i musi wymuszać `user_id` na poziomie aplikacji oraz RLS.
- Tworzenie i aktualizacja potraw wymaga utrzymania minimalnego zestawu tagów i emituje event `dish_added` (asynchroniczne logowanie do `events`).
- Listowanie wspiera wyszukiwanie pełnotekstowe, filtrowanie po wielu tagach, paginację oraz alternatywne sortowanie według ostatniego użycia.
- Endpointy tagowe pozwalają na szybkie dołączanie i odłączanie tagów bez wpływu na inne dania.

## 2. Szczegóły żądania
### POST /dishes
- Metoda: POST, URL `/api/dishes`.
- Parametry wymagane: body `name`, co najmniej jeden z `tagNames` lub `tagIds`.
- Parametry opcjonalne: `recipeText`, `url`, drugi zestaw tagów jeśli dostępny.
- Treść żądania: JSON zgodny z `DishCreateCommand` (długości: name 3–80, recipeText ≤2000, url ≤255, tagNames 2–30, wszystko lowercase).
- Walidacja: Zod schema z guardami na długości i format UUID; zbiór tagów to złączenie `tagNames` i `tagIds`, deduplikacja po lowercase.

### GET /dishes
- Metoda: GET, URL `/api/dishes`.
- Parametry wymagane: brak (domyślna paginacja).
- Parametry opcjonalne: `page≥1`, `pageSize 1–100`, `q` (fragment), wielokrotne `tagId` (UUID, koniunkcja), `sort` ∈ {`created_desc`,`name_asc`,`usage_prio`}.
- Walidacja: Zod schema dla query string; wartości spoza zakresu → 400.

### GET /dishes/{id}
- Metoda: GET, URL `/api/dishes/{dishId}`.
- Parametry wymagane: `dishId` UUID w ścieżce.
- Walidacja: sprawdzenie formatu UUID przed zapytaniem do Supabase.

### PUT /dishes/{id}
- Metoda: PUT, URL `/api/dishes/{dishId}`.
- Parametry wymagane: path `dishId`, body `name`, przynajmniej jeden z zestawów tagów.
- Parametry opcjonalne: `recipeText`, `url`, drugi zestaw tagów z `TagSelection`.
- Treść żądania: JSON zgodny z `DishUpdateCommand`, `recipeText` i `url` akceptują `null`.
- Walidacja: te same reguły co POST + weryfikacja, że kompletny zestaw tagów po normalizacji nie jest pusty.

### DELETE /dishes/{id}
- Metoda: DELETE, URL `/api/dishes/{dishId}`.
- Parametry wymagane: `dishId` UUID.
- Walidacja: sprawdzenie prawa własności przed kasowaniem; brak body.

### POST /dishes/{id}/tags
- Metoda: POST, URL `/api/dishes/{dishId}/tags`.
- Parametry wymagane: `dishId` i co najmniej jeden z `tagNames`/`tagIds` w body.
- Parametry opcjonalne: drugi zestaw tagów.
- Treść żądania: JSON zgodny z `DishAttachTagsCommand`; duplikaty ignorowane.
- Walidacja: identycznie jak w tworzeniu tagów oraz limit długości list.

### DELETE /dishes/{id}/tags/{tagId}
- Metoda: DELETE, URL `/api/dishes/{dishId}/tags/{tagId}`.
- Parametry wymagane: `dishId`, `tagId` UUID.
- Walidacja: oba identyfikatory muszą należeć do użytkownika; brak body.

## 3. Wykorzystywane typy
- `DishDTO`, `DishListItemDTO`, `DishListResponse`, `DishDetailResponse` z `@src/types.ts` jako odpowiedzi warstwy API.
- `DishCreateCommand`, `DishUpdateCommand`, `DishAttachTagsCommand`, `DishDetachTagParams` dla danych wejściowych i wywołań serwisów.
- `TagDTO` wbudowane w `TagSelection` oraz `DishAttachTagsResponse`.
- `Paginated<T>` do opakowania wyników listowania.
- Dodatkowe pomocnicze typy usługowe (np. `NormalizedTag`, `DishWithUsageMeta`) lokalnie w `src/lib/services/dish-service.ts`.

## 4. Szczegóły odpowiedzi
- POST /dishes: 201 + `DishDTO` z pełną listą tagów oraz znacznikami czasu.
- GET /dishes: 200 + `DishListResponse` (`data`, `page`, `pageSize`, `total`, `totalPages`, opcjonalne `lastUsedDay` podczas `usage_prio`).
- GET /dishes/{id}: 200 + `DishDetailResponse`; 404 gdy brak rekordu.
- PUT /dishes/{id}: 200 + `DishDTO` po aktualizacji.
- DELETE /dishes/{id}: 204 bez body.
- POST /dishes/{id}/tags: 200 + `DishAttachTagsResponse` (`tags` po aktualizacji).
- DELETE /dishes/{id}/tags/{tagId}: 204 bez body.
- Błędy walidacyjne: 400/422 z payloadem `{ code, message, details }`.

## 5. Przepływ danych
- Każdy endpoint mieszka w dedykowanej trasie Astro (`src/pages/api/dishes/*.ts`) i korzysta z wspólnego `getSupabaseServerClient` (lub analogicznej funkcji) z `src/db`.
- Wejścia przechodzą przez Zod schematy; błędy natychmiast zwracają 400/422 bez kontaktu z bazą.
- Logika biznesowa trzymana w `DishService` (`src/lib/services/dish-service.ts`): metody `create`, `list`, `getById`, `update`, `delete`, `attachTags`, `detachTag`.
- `DishService` deleguje do `TagService` (`upsertManyLowercased`, `ensureOwnership`) oraz `DishTagService` dla operacji M:N, korzystając z RLS i kluczy złożonych (`user_id`, `dish_id`, `tag_id`).
- Operacje listowania wykorzystują indeksy (`dishes_user_created_idx`, `dish_tags_tag_dish_idx`, `day_plans_usage_idx`) i budują zapytania z filtrami `q`, `tagId`, `sort`.
- Po pomyślnym utworzeniu dania wysyłany jest event `dish_added` do tabeli `events`; błędy logowania eventu są łapane i jedynie logowane (brak rollbacku).
- Usuwanie i odpinanie tagów wykorzystuje transakcje Supabase RPC lub emulację (kolejne zapytania z weryfikacją), aby uniknąć stanów wyścigowych.

## 6. Względy bezpieczeństwa
- Uwierzytelnianie: wymagane ważne `Authorization` header; brak sesji → 401.
- Autoryzacja: wszystkie zapytania doklejają `eq("user_id", auth.uid())`; rely on RLS + dodatkowe weryfikacje w services.
- Walidacja danych wejściowych blokuje SQL injection i nadużycia (np. długość stringów, limit elementów, normalizacja tagów do lowercase).
- Obsługa błędów nie ujawnia szczegółów DB; logi trafiają do serwerowego loggera (np. `src/lib/logger.ts`) oraz opcjonalnie do zewnętrznego APM.
- Zagrożenia: brute-force filtrów i duże pageSize łagodzone limitami; wstrzyknięcia JSON -> sanitizacja.
- Dane wrażliwe (UUID) nie są zgłaszane w logach bez anonimizacji; logujemy tylko skrócone identyfikatory.

## 7. Obsługa błędów
- 400: niepoprawne parametry paginacji (`page`, `pageSize`, `sort`), brak tagów po walidacji.
- 401: brak/niepoprawny token Supabase, odczytany w middleware.
- 404: brak dania/tagu w zakresie użytkownika lub tag nie powiązany w żądanej relacji.
- 409: kolizja tagów (np. próba utworzenia istniejącej nazwy w innej transakcji) → przekazanie błędu unikalności do klienta.
- 422: naruszenia reguł długości, nieprawidłowe UUID, nazwy tagów niespełniające kryteriów.
- 500: wyjątki Supabase/nieobsłużone przypadki, logowane wraz z kontekstem (`requestId`, `userId`).
- Błędy są logowane w `src/lib/logger.ts` (lub analogicznym) oraz mogą być agregowane w systemie obserwacji; brak dedykowanej tabeli błędów → notujemy w logach aplikacyjnych.

## 8. Wydajność
- Wykorzystanie istniejących indeksów opisanych w `@.ai/db-plan.md` przy każdej kwerendzie (`user_id` + sort).
- Stronicowanie po `page/pageSize`; opcjonalny future-proof cursor (Pole `cursor` w typach) można zachować do późniejszej optymalizacji.
- Filtrowanie po tagach wykorzystuje `dish_tags_tag_dish_idx`; implementacja generuje subzapytanie grupujące `dish_id` według liczby dopasowanych tagów.
- Sort `usage_prio` korzysta z lewego joinu do `day_plans` i indeksu `day_plans_usage_idx`.
- Tworzenie i dołączanie tagów grupuje operacje w pojedynczych batchach supabase (np. `upsert` with `onConflict`), aby ograniczyć round-tripy.
- Odpowiedzi mogą być cache’owane po użytkowniku i parametrach (np. `Cache-Control: private, max-age=30`) dla GET, jeśli zgodne z wymaganiami.

## 9. Kroki implementacji
1. Utworzyć (lub zaktualizować) pliki tras Astro: `src/pages/api/dishes/index.ts` dla GET/POST oraz `src/pages/api/dishes/[dishId].ts`, `src/pages/api/dishes/[dishId]/tags/index.ts`, `src/pages/api/dishes/[dishId]/tags/[tagId].ts`.
2. Przygotować wspólne Zod schematy w `src/lib/validation/dishes.ts` (body + query) i udostępnić helper do normalizacji tagów.
3. Zaimplementować `DishService` i powiązane `TagService`/`DishTagService` w `src/lib/services`, w tym metody pomocnicze do walidacji prawa własności.
4. W POST /dishes: wywołać `DishService.create` (transakcja: insert dish, upsert tags, insert junction, emit event), obsłużyć błędy 422/409.
5. W GET /dishes: wykorzystać `DishService.list` z parametrami, budując dynamiczne zapytania i paginację; zwrócić dane przycięte do `DishListResponse`.
6. W GET /dishes/{id}: pobrać rekord + tagi, zwrócić 404 gdy brak wyniku.
7. W PUT /dishes/{id}: znormalizować wejście, policzyć różnice tagów (attach/detach), wykonać aktualizację w jednej transakcji i odświeżyć DTO.
8. W DELETE /dishes/{id}: potwierdzić istnienie + własność, usunąć rekord (FK zadbają o `day_plans`), zwrócić 204.
9. W POST /dishes/{id}/tags oraz DELETE /dishes/{id}/tags/{tagId}: użyć serwisów do weryfikacji i modyfikacji relacji, zwrócić odpowiednio 200/204.
10. Dopisać testy jednostkowe serwisów (mock Supabase), testy integracyjne API, zaktualizować dokumentację i PRD; zapewnić, że plan jest przechowywany w `.ai/dishes-implementation-plan.md`.

_Dokument zapisano w `.ai/dishes-implementation-plan.md`._


