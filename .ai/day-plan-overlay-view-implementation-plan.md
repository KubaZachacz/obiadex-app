# Plan implementacji widoku Nakładka wyboru/zmiany dania dla dnia

## 1. Przegląd
Routowalny dialog/drawer na trasie `/?day=YYYY-MM-DD` pozwala wybrać lub zmienić danie dla wskazanego dnia. Korzysta z `/api/dishes` (sort `usage_prio` + filtry tagów), `/api/tags` oraz `/api/day-plans/{day}` (PUT) z walidacją i obsługą pustej bazy dań.

## 2. Routing widoku
- Ścieżka: `/?day=YYYY-MM-DD` (parametr query).
- Zamknięcie: usunięcie parametru `day` bez reloadu listy dni.

## 3. Struktura komponentów
- `Dialog` (desktop) / `Drawer` (mobile) z focus trap.
- Nagłówek z datą + przycisk zamknięcia.
- `TagFilterCombobox` (multi-select AND) z listą tagów.
- `DishPickerList` (sortable wg usage_prio) z selekcją single.
- `EmptyState` (brak dań lub brak wyników filtrów) + CTA do `/dishes/new`.
- `Footer` z przyciskiem `Zapisz` i opcjonalnym `Anuluj`.
- `Toast/InlineError` do błędów API.

## 4. Szczegóły komponentów
### TagFilterCombobox
- Opis: multi-select tagów do filtrowania listy dań.
- Elementy: pole z opcją wyszukiwania tagów, lista checkboxów.
- Interakcje: wybór/odznaczenie tagu → refetch dań, klawisze ↑↓ Enter, ESC zamyka.
- Walidacja: limit znaków tagów (2–30) już zapewniony przez dane; filtr przyjmuje ID.
- Typy: `TagDTO` z `src/types.ts`.
- Propsy: `value: TagDTO[]`, `onChange(tags)`, `isLoading`, `error?`.

### DishPickerList
- Opis: lista wyboru z sortowaniem usage_prio (niewybrane → dawno → ostatnio). Zwraca wybrany `dishId`.
- Elementy: wiersze z nazwą, ostatnim użyciem (jeśli dostępne), tagami.
- Interakcje: klik/klawiatura wybiera; zmiana filtra/tagów refetchuje; scroll w obrębie listy.
- Walidacja: brak własnej, korzysta z danych.
- Typy: `DishListItemDTO` (z polem `lastUsedDay?`), `DishListResponse`.
- Propsy: `items`, `isLoading`, `onSelect(dishId)`, `selectedId?`, `emptyVariant: "no-data" | "no-results"`.

### Footer / Actions
- Opis: przycisk `Zapisz` wywołuje PUT `/api/day-plans/{day}`.
- Elementy: `Button(primary)`, `Button(secondary)`.
- Interakcje: submit; disable gdy brak wyboru lub loading.
- Walidacja: wymagany `dishId`.
- Typy: `DayPlanUpsertCommand`, `DayPlanUpsertResponse`.
- Propsy: `onSubmit()`, `isSubmitting`, `disabled`.

## 5. Typy
- DTO: `DishListItemDTO`, `TagDTO`, `DayPlanUpsertCommand`, `DayPlanUpsertResponse`.
- ViewModel: `DayPickerState` { day: string; tags: TagDTO[]; dishes: DishListItemDTO[]; selectedId?: string; status: "idle"|"loading"|"error"; saving: boolean; error?: string }.

## 6. Zarządzanie stanem
- Hook `useDishPicker(day)` złożony: fetch tags (`GET /api/tags`), fetch dishes (`GET /api/dishes?sort=usage_prio&tagId[]`), przechowuje selectedId, statusy `isLoading`, `saving`.
- AbortController na zmianę filtrów, debounce wpisywania tagów.
- Po zapisie: emituje callback do odświeżenia listy dni (np. invalidacja query) i zamyka nakładkę.

## 7. Integracja API
- `GET /api/tags?includeCounts=true` (implementacja w `src/pages/api/tags/index.ts`); response: `TagListResponse`.
- `GET /api/dishes?sort=usage_prio&tagId[]=...&page=1&pageSize=50` (`src/pages/api/dishes/index.ts`); response: `DishListResponse`.
- `PUT /api/day-plans/{day}` (`src/pages/api/day-plans/[day].ts`); body: `DayPlanUpsertCommand` { dishId }; response 200/201 -> `DayPlanUpsertResponse`.
- Błędy 401 → redirect; 404/422/429 → komunikaty.

## 8. Interakcje użytkownika
- Zmiana tagów → refetch listy.
- Wybór dania → zaznaczenie pojedyncze, odklik możliwy.
- Klik "Dodaj danie" w pustym stanie → nawigacja do `/dishes/new` (routowalna nakładka, pozostaw dzień w URL do powrotu).
- Klik "Zapisz" → PUT; sukces zamyka nakładkę i odświeża listę dni.

## 9. Warunki i walidacja
- Wymagany parametr `day` w formacie `YYYY-MM-DD`; brak → zamknąć nakładkę.
- Wymagany `dishId` przy zapisie; blokada przycisku gdy brak.
- Walidacja 422 z backendu mapowana na komunikat (np. nieistniejący `dishId`).

## 10. Obsługa błędów
- Brak dań → `EmptyState` z CTA.
- Brak wyników filtrów → komunikat "Brak dań z wybranymi tagami".
- 404 (danie/usunięte) → toast + refetch listy dań.
- 409 (unikat tagu) nie dotyczy; 429/5xx → toast z retry.

## 11. Kroki implementacji
1) Utworzyć routowalną nakładkę sterowaną query paramem `day` z focus trap i adaptacją Dialog/Drawer.
2) Zaimplementować hook `useDishPicker` (fetch tags + dishes, obsługa filtrów/abortów).
3) Dodać `TagFilterCombobox` i `DishPickerList` z sortem `usage_prio` i renderowaniem tagów/lastUsedDay.
4) Obsłużyć CTA do `/dishes/new` w pustym stanie oraz zamykanie (usunięcie parametru).
5) Dodać submit PUT `/api/day-plans/{day}`, komunikaty błędów i odświeżenie listy dni.
