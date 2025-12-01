# Plan implementacji widoku Baza dań

## 1. Przegląd
Widok `/dishes` prezentuje listę dań z paginacją, wyszukiwaniem i filtrowaniem po tagach (AND). Umożliwia wejście do nakładki dodawania/edycji dania i wywołuje `/api/dishes`, `/api/tags`.

## 2. Routing widoku
- Ścieżka: `/dishes`
- Nakładki: `/dishes/new`, `/dishes/:id/edit` (obsługiwane oddzielnie).
- Parametry query: `page`, `pageSize`, `q`, `tagId[]`, `sort=created_desc|name_asc` (domyślnie `created_desc`).

## 3. Struktura komponentów
- `AppShell` (nagłówek, link back do `/`).
- `SearchInput` z debounce do `q`.
- `TagFilterCombobox` (AND) pobierający tagi.
- `DishList` z elementami `DishListItem` i `Pagination`.
- `FAB(+)` → `/dishes/new`.
- `EmptyState` + CTA przy braku danych/wyników.
- `InlineError/Toast` dla błędów API.

## 4. Szczegóły komponentów
### SearchInput
- Opis: pole tekstowe z debounce (300–500 ms) aktualizujące `q` w query params.
- Elementy: input, ikona lupy, przycisk „wyczyść”.
- Interakcje: onChange debounced -> refetch.
- Walidacja: długość inputu (opcjonalnie max 80), trim.
- Typy: `string` value.
- Propsy: `value`, `onChange`, `isLoading`.

### TagFilterCombobox
- Opis: multi-select AND dla tagów.
- Elementy: pole wyboru, lista tagów (zliczenia opcjonalne `dishCount`).
- Interakcje: wybór tagu -> update `tagId[]` + refetch.
- Walidacja: brak dodatkowej (dane zweryfikowane); limit 10 tagów (opcjonalnie).
- Typy: `TagDTO`, `TagListResponse`.
- Propsy: `value`, `onChange`, `options`, `isLoading`, `error?`.

### DishList / DishListItem
- Opis: renderuje wyniki `GET /api/dishes` z nazwą, tagami, opcjonalnym URL/recipe skrótem.
- Elementy: tytuł dania, chipy tagów, przycisk „Edytuj” → `/dishes/:id/edit`.
- Interakcje: klik elementu (opcjonalnie podgląd), paginacja.
- Walidacja: brak (dane gotowe).
- Typy: `DishListItemDTO`, `DishListResponse`.
- Propsy: `items`, `onEdit(id)`, `isLoading`.

### Pagination
- Opis: kontrolki `page`, `totalPages` z `DishListResponse`.
- Elementy: poprzednia/następna, numery, pageSize select (opcjonalny 20/50).
- Interakcje: zmiana page/pageSize -> update query paramów i refetch.
- Typy: `PagedResponse` meta.
- Propsy: `page`, `totalPages`, `onChange(page)`, `onPageSizeChange(pageSize)`.

## 5. Typy
- DTO: `DishListItemDTO`, `DishListResponse`, `TagDTO`, `TagListResponse`.
- ViewModel: `DishListState` { filters: { q?: string; tagIds: string[]; page: number; pageSize: number; sort: string }; status: "idle"|"loading"|"error"; data?: DishListResponse; error?: string }.

## 6. Zarządzanie stanem
- Hook `useDishListFilters` czytający i zapisujący query params.
- `useEffect` na zmianę filtrów -> fetch `/api/dishes` (abort na zmianę).
- Cache ostatniej strony, reset page do 1 przy zmianie `q`/`tagId`.

## 7. Integracja API
- `GET /api/dishes?page=&pageSize=&q=&tagId[]=&sort=` (`src/pages/api/dishes/index.ts`); response `DishListResponse`.
- `GET /api/tags?includeCounts=true` do listy tagów (`src/pages/api/tags/index.ts`).
- Błędy: 401 redirect do `/login`; 422 (złe parametry) -> toast + reset filtrów; 429/5xx -> retry.

## 8. Interakcje użytkownika
- Wpis w `SearchInput` → debounce refetch.
- Wybór tagów → refetch + reset page.
- Klik FAB → `/dishes/new` (nakładka). Klik „Edytuj” w elemencie → `/dishes/:id/edit`.
- Paginate -> update query params.

## 9. Warunki i walidacja
- Wymaga zalogowanego użytkownika; 401 -> redirect.
- page/pageSize > 0; pageSize ograniczyć (np. 20/50).
- Limit długości `q` (np. 80) aby uniknąć 414.

## 10. Obsługa błędów
- Empty data: komunikat „Brak dań” + CTA do dodania.
- Empty search/filter: komunikat „Brak wyników dla filtrów” + przycisk reset.
- API errors: toast + opcja ponów.

## 11. Kroki implementacji
1) Skonfigurować trasę `/dishes` z `AppShell`.
2) Dodać `useDishListFilters` i wywołania `/api/dishes` + `/api/tags` (includeCounts).
3) Zaimplementować `SearchInput`, `TagFilterCombobox`, `DishList`, `Pagination` z synchronizacją query params.
4) Obsłużyć empty state i błędy; dodać FAB + linki edycji otwierające nakładkę.
