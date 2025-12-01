# Plan implementacji widoku Lista dni (Home)

## 1. Przegląd
Widok home prezentuje nieskończoną listę dni z przypisanym daniem (jeśli istnieje) i umożliwia otwarcie nakładki wyboru dania. Dane pobierane są z `/api/day-plans` (range query). Widok musi zachować stan scrolla, obsłużyć puste stany i integrację FAB `+`.

## 2. Routing widoku
- Ścieżka: `/`
- Nakładka dnia: parametr `?day=YYYY-MM-DD` otwiera dialog/drawer (oddzielny widok).

## 3. Struktura komponentów
- `AppShell` (nagłówek, link do `/dishes`, menu użytkownika).
- `DayListVirtualized` → wirtualizowana lista kafli dni z infinite scroll.
- `DayCard` → kafel dnia z datą, nazwą dania lub CTA.
- `FAB(+)` → otwarcie nakładki dnia (`/?day=...`) lub dodawania dania kontekstowo.
- `InlineError/Toast` → komunikaty błędów ładowania.
- `EmptyState` → gdy brak planów lub dane niezaładowane.

## 4. Szczegóły komponentów
### DayListVirtualized
- Opis: zarządza oknami zakresów (np. 14 dni wstecz/przód), fetchuje `/api/day-plans?start&end` i scala wyniki.
- Elementy: wirtualizator (np. własny lub `react-virtual`), placeholdery podczas ładowania.
- Interakcje: scroll (ładowanie nowych okien), kliknięcie kafla → otwarcie nakładki dnia z parametrem.
- Walidacja: daty `YYYY-MM-DD`; pilnować limitu zakresu (max 180 dni – zgodnie z backendem).
- Typy: `DayPlanListItemDTO`, `DayPlanRangeResponse`, `DayPlanRangeQuery` z `src/types.ts`.
- Propsy: `initialRange: { start: string; end: string }`, `onSelectDay(day: string)`, `onError(message: string)`.

### DayCard
- Opis: prezentuje dzień i ewentualnie przypisane danie; pokazuje CTA „Wybierz danie”.
- Elementy: label daty (format lokalny), nazwa dania lub placeholder, badge tagów (opcjonalnie), ikonka statusu.
- Interakcje: klik → `onOpen(day)`; klawisz Enter/Space.
- Walidacja: brak (otrzymuje gotowe dane).
- Typy: `DayPlanListItemDTO | null`.
- Propsy: `day: string`, `plan?: DayPlanListItemDTO`, `onOpen(day)`.

### FAB
- Opis: pływający przycisk; na `/` otwiera nakładkę dnia z bieżącą datą lub najbliższą widoczną.
- Elementy: button z ikoną `+`.
- Interakcje: klik → `onClick()`; klawiatura.
- Walidacja: brak.
- Typy: żadnych specjalnych.
- Propsy: `onClick: () => void`.

## 5. Typy
- DTO: `DayPlanListItemDTO`, `DayPlanRangeResponse`, `DayPlanRangeQuery`.
- ViewModel: `DayWindow` { start: string; end: string; status: "idle"|"loading"|"error"; data: DayPlanListItemDTO[] }.

## 6. Zarządzanie stanem
- Lokalny hook `useDayWindows` zarządzający zakresem, cache i merge odpowiedzi; przechowuje mapę `day -> DayPlanListItemDTO`.
- `useEffect` na zmianę widocznego okna → fetch nowych zakresów z debounce, abort controller dla race condition.

## 7. Integracja API
- Endpoint: `GET /api/day-plans?start=YYYY-MM-DD&end=YYYY-MM-DD&sort=asc|desc` (implementacja `src/pages/api/day-plans/index.ts`).
- Response: `DayPlanRangeResponse` { data: DayPlanListItemDTO[], range }.
- Błędy: 401 redirect do `/login`; 422 pokaż komunikat; 429/5xx toast + retry.

## 8. Interakcje użytkownika
- Scroll listy → autoload zakresów.
- Klik kafla lub FAB → otwarcie nakładki (`setSearchParams`).
- Retry przy błędzie ładowania (np. przycisk „Spróbuj ponownie”).

## 9. Warunki i walidacja
- Parametry start/end muszą zachować porządek i limit 180 dni; walidować przed fetch.
- Format daty `YYYY-MM-DD` (lokalna strefa).

## 10. Obsługa błędów
- Brak danych (empty): `EmptyState` z CTA do dodania dania.
- 401: redirect do `/login` (middleware + client fallback).
- 422/429/5xx: toast i opcja ponowienia.

## 11. Kroki implementacji
1) Zaimplementować `useDayWindows` (obliczanie zakresów, fetch, cache, merge).
2) Zbudować `DayListVirtualized` z obsługą scroll + placeholdery.
3) Dodać `DayCard` renderujący datę/danie i CTA.
4) Dodać FAB i nawigację do nakładki (`?day=`) bez resetu scrolla.
5) Zintegrować komunikaty błędów i empty state; ręcznie sprawdzić 401/422.
