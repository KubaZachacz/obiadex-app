# Plan implementacji widoku Nakładka wyboru/zmiany dania dla dnia

## 1. Przegląd

Routowalny dialog/drawer na trasie `/?day=YYYY-MM-DD` pozwala wyświetlić szczegóły przypisanego dania (tryb "view") lub wybrać/zmienić danie dla wskazanego dnia (tryb "edit"). Otwierany z tygodniowego widoku listy dni i po zamknięciu wraca do tego samego tygodnia (`weekIndex` bez zmian). Dzisiejszy dzień może być dodatkowo oznaczony w nagłówku. Korzysta z `/api/day-plans/{day}` (GET), `/api/dishes` (sort `usage_prio` + filtry tagów), `/api/tags` oraz `/api/day-plans/{day}` (PUT/DELETE) z walidacją i obsługą pustej bazy dań.

## 2. Routing widoku

- Ścieżka: `/?day=YYYY-MM-DD` (parametr query).
- Zamknięcie: usunięcie parametru `day` bez reloadu listy dni.

## 3. Struktura komponentów

- `DayPlanOverlay` → główny komponent zarządzający trybami view/edit i routingiem.
- `Dialog` (desktop) / `Drawer` (mobile) z focus trap.
- Nagłówek z datą + przycisk zamknięcia.
- Tryb "view": `DayPlanDetailsView` → szczegóły przypisanego dania (nazwa, tagi, przepis, URL), przyciski "Zmień danie" i "Usuń".
- Tryb "edit": 
  - Wyszukiwanie po nazwie (`Input`).
  - `TagCreatableCombobox` (multi-select AND) z listą tagów.
  - `DishPickerList` (sortable wg usage_prio) z selekcją single.
  - `EmptyState` (brak dań lub brak wyników filtrów) + CTA do dodania dania.
  - `Footer` z przyciskiem `Zapisz` i `Anuluj`.
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

- DTO: `DayPlanDTO`, `DishListItemDTO`, `TagDTO`, `DayPlanUpsertCommand`, `DayPlanUpsertResponse`.
- ViewModel: `DayPickerState` { day: string; tags: TagDTO[]; dishes: DishListItemDTO[]; selectedId?: string; nameSearch: string; status: "idle"|"loading"|"error"; saving: boolean; error?: string }.
- Tryby: `OverlayMode = "view" | "edit"`.

## 6. Zarządzanie stanem

- `DayPlanOverlay` zarządza trybem (`mode: "view" | "edit"`), stanem istniejącego planu (`existingPlan: DayPlanDTO | null`), stanem ładowania planu (`isLoadingPlan`).
- Hook `useDishPicker(day)` złożony: fetch tags (`GET /api/tags`), fetch dishes (`GET /api/dishes?sort=usage_prio&tagId[]&q=...`), przechowuje selectedId, nameSearch, statusy `isLoading`, `saving`.
- Przy otwarciu overlay: sprawdza `GET /api/day-plans/{day}` - jeśli istnieje, ustawia tryb "view", w przeciwnym razie "edit".
- AbortController na zmianę filtrów, debounce wpisywania nazwy.
- Po zapisie: emituje callback do odświeżenia listy dni i zamyka nakładkę.

## 7. Integracja API

- `GET /api/day-plans/{day}` (`src/pages/api/day-plans/[day].ts`) - sprawdzenie istniejącego planu przy otwarciu; response: `DayPlanDTO` lub 404.
- `GET /api/tags?includeCounts=true` (implementacja w `src/pages/api/tags/index.ts`); response: `TagListResponse`.
- `GET /api/dishes?sort=usage_prio&tagId[]=...&q=...&page=1&pageSize=50` (`src/pages/api/dishes/index.ts`); response: `DishListResponse`.
- `PUT /api/day-plans/{day}` (`src/pages/api/day-plans/[day].ts`); body: `DayPlanUpsertCommand` { dishId }; response 200/201 -> `DayPlanUpsertResponse`.
- `DELETE /api/day-plans/{day}` (`src/pages/api/day-plans/[day].ts`) - usunięcie planu dnia.
- Błędy 401 → redirect; 404/422/429 → komunikaty.

## 8. Interakcje użytkownika

- Przy otwarciu: automatyczne sprawdzenie istniejącego planu i przełączenie do trybu "view" lub "edit".
- Tryb "view": klik "Zmień danie" → przełącza do trybu "edit"; klik "Usuń" → usuwa plan dnia.
- Tryb "edit": 
  - Zmiana wyszukiwania po nazwie → refetch listy.
  - Zmiana tagów → refetch listy.
  - Wybór dania → zaznaczenie pojedyncze, odklik możliwy.
  - Klik "Dodaj danie" w pustym stanie → otwiera overlay `DishEditorOverlay`.
  - Klik "Zapisz" → PUT; sukces zamyka nakładkę i odświeża listę dni.
- Podczas otwartej nakładki na mobile gesty swipe tygodnia powinny być zablokowane (focus trap przechwytuje gesty), aby uniknąć przypadkowej zmiany tygodnia.

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

1. Utworzyć komponent `DayPlanOverlay` sterowany query paramem `day` z focus trap i adaptacją Dialog/Drawer.
2. Dodać logikę sprawdzania istniejącego planu przy otwarciu (`GET /api/day-plans/{day}`) i przełączania między trybami "view"/"edit".
3. Zaimplementować `DayPlanDetailsView` dla trybu "view" (szczegóły dania, przyciski edycji/usunięcia).
4. Zaimplementować hook `useDishPicker` (fetch tags + dishes, obsługa filtrów/abortów, wyszukiwanie po nazwie).
5. Dodać `TagCreatableCombobox` i `DishPickerList` z sortem `usage_prio` i renderowaniem tagów/lastUsedDay (tryb "edit").
6. Obsłużyć CTA do `DishEditorOverlay` w pustym stanie oraz zamykanie (usunięcie parametru).
7. Dodać submit PUT `/api/day-plans/{day}` i DELETE `/api/day-plans/{day}`, komunikaty błędów i odświeżenie listy dni.
8. Zintegrować z tygodniową nawigacją listy dni: po zamknięciu wracamy do tego samego `weekIndex`; na mobile blokada swipe tygodnia w trakcie otwartej nakładki.
