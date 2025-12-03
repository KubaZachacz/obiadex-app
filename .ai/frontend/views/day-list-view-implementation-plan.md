# Plan implementacji widoku Lista dni (Home)

## 1. Przegląd

Widok home prezentuje tygodniowy układ dni (paginowany), z możliwością przełączania tygodni przyciskami +/- oraz gestem swipe (mobile). Dzisiejszy dzień jest wyróżniony. Dane pobierane są z `/api/day-plans` (range query) dla aktualnie widocznego tygodnia z konfigurowalnymi offsetami wstecz i w przód.

- Brak infinite scroll (dwukierunkowy scroll nie sprawdził się).
- Offsets (konfigurowalne stałe):
  - desktop: poprzedni tydzień (-1), bieżący tydzień (0), następny tydzień (+1),
  - mobile: -2 dni, bieżący tydzień, +2 dni.
- Nawigacja „poprzedni / następny tydzień” (zmiana o ±1 tydzień).
- Gest swipe lewo/prawo na mobile zmienia tydzień.

## 2. Routing widoku

- Ścieżka: `/`
- Nakładka dnia: parametr `?day=YYYY-MM-DD` otwiera dialog/drawer (oddzielny widok).

## 3. Struktura komponentów

- `AppShell` (nagłówek, link do `/dishes`, menu użytkownika).
- `WeekNavigator` → pasek nawigacji tygodnia (przyciski „←” / „→”, etykieta zakresu dat tygodnia; na mobile nasłuch gestów swipe).
- `DayWeekView` → prezentacja bieżącego tygodnia (desktop pełne 7 dni; mobile z opcjonalnym poszerzonym buforem ±2 dni zgodnie z konfiguracją).
- `DayCard` → kafel dnia z datą, nazwą dania lub CTA.
- `FAB(+)` → otwarcie formularza dodawania dania (`/dishes/new`, nakładka).
- `InlineError/Toast` → komunikaty błędów ładowania.
- `EmptyState` → gdy brak planów lub dane niezaładowane.

## 4. Szczegóły komponentów

### WeekNavigator

- Opis: steruje `weekIndex` (liczba całkowita, 0 = tydzień bieżący), umożliwia nawigację o ±1 tydzień.
- Elementy: przyciski „←” (prev) i „→” (next), label zakresu tygodnia (np. 2–8 XII 2025).
- Interakcje: klik przycisków; na mobile obsługa swipe lewo/prawo (np. przez pointer events lub `react-swipeable`).
- Walidacja: brak; zabezpieczenie przed podwójnym wywołaniem przy szybkim geście.
- Propsy: `weekIndex: number`, `onChange(nextIndex: number)`.

### DayWeekView

- Opis: oblicza zakres dat dla tygodnia wskazanego przez `weekIndex` oraz rozszerza zakres o konfigurowalne offsety (desktop: ±1 tydzień; mobile: ±2 dni) dla płynnego UX i prefetchu.
- Elementy: siatka/strip dni tygodnia (pon–niedz zgodnie z lokalizacją), placeholdery podczas ładowania, wyróżnienie dzisiejszego dnia.
- Interakcje: kliknięcie kafla → otwarcie nakładki dnia z parametrem.
- Walidacja: daty `YYYY-MM-DD`; pilnować rozsądnego zakresu zapytania.
- Typy: `DayPlanListItemDTO`, `DayPlanRangeResponse`, `DayPlanRangeQuery` z `src/types.ts`.
- Propsy: `weekIndex: number`, `onSelectDay(day: string)`, `onError(message: string)`.

### DayCard

- Opis: prezentuje dzień i ewentualnie przypisane danie; pokazuje CTA „Wybierz danie”.
- Elementy: label daty (format lokalny), nazwa dania lub placeholder, badge tagów (opcjonalnie), ikonka statusu, wyróżnienie „Dzisiaj” (styl/akcent).
- Interakcje: klik → `onOpen(day)`; klawisz Enter/Space.
- Walidacja: brak (otrzymuje gotowe dane).
- Typy: `DayPlanListItemDTO | null`.
- Propsy: `day: string`, `plan?: DayPlanListItemDTO`, `onOpen(day)`.

### FAB

- Opis: pływający przycisk; na `/` otwiera `/dishes/new` (routowalna nakładka). Przypisanie dania do dnia odbywa się wyłącznie po kliknięciu kafla dnia.
- Elementy: button z ikoną `+`.
- Interakcje: klik → `onClick()`; klawiatura.
- Walidacja: brak.
- Typy: żadnych specjalnych.
- Propsy: `onClick: () => void`.

## 5. Typy

- DTO: `DayPlanListItemDTO`, `DayPlanRangeResponse`, `DayPlanRangeQuery`.
- ViewModel:
  - `WeekViewport` { weekIndex: number; visibleStart: string; visibleEnd: string; prefetchStart: string; prefetchEnd: string }
  - `DayCache` jako mapa `Record<YYYY-MM-DD, DayPlanListItemDTO>`.

## 6. Zarządzanie stanem

- Lokalny hook `useWeekViewport` zarządza `weekIndex`, detekcją wariantu (desktop/mobile) i wylicza `visibleStart/visibleEnd` oraz prefetchowe `prefetchStart/prefetchEnd` na podstawie stałych offsetów.
- Hook utrzymuje cache `day -> DayPlanListItemDTO`; przy zmianie `weekIndex` wykonuje fetch `GET /api/day-plans` dla złożonego zakresu (visible + prefetch) z abort controller i debounce.
- Stałe konfiguracyjne (np. `src/lib/date/constants.ts`):
  - `WEEK_NAV_OFFSETS = { desktop: { prevWeeks: 1, nextWeeks: 1 }, mobile: { prevDays: 2, nextDays: 2 } }`
- Start tygodnia zgodnie z lokalizacją (PL: poniedziałek).

## 7. Integracja API

- Endpoint: `GET /api/day-plans?start=YYYY-MM-DD&end=YYYY-MM-DD&sort=asc|desc` (implementacja `src/pages/api/day-plans/index.ts`).
- Zakres zapytania: `prefetchStart`–`prefetchEnd` (zawiera `visibleStart`–`visibleEnd`). Render korzysta z danych cachowanych per dzień.
- Response: `DayPlanRangeResponse` { data: DayPlanListItemDTO[], range }.
- Błędy: 401 redirect do `/login`; 422 pokaż komunikat; 429/5xx toast + retry.

## 8. Interakcje użytkownika

- Klik przycisków WeekNavigator → zmiana tygodnia o ±1 (`weekIndex++/--`).
- Gest swipe lewo/prawo (mobile) → zmiana tygodnia o ±1.
- Klik kafla dnia → otwarcie nakładki dnia (`?day=YYYY-MM-DD`).
- Klik FAB → otwarcie formularza dodawania dania (`/dishes/new`).
- Retry przy błędzie ładowania (np. przycisk „Spróbuj ponownie”).

## 9. Warunki i walidacja

- Parametry start/end muszą zachować porządek i mieścić się w rozsądnym oknie (z dużym zapasem do limitu 180 dni backendu).
- Format daty `YYYY-MM-DD` (lokalna strefa).

## 10. Obsługa błędów

- Brak danych (empty): `EmptyState` z CTA do dodania dania.
- 401: redirect do `/login` (middleware + client fallback).
- 422/429/5xx: toast i opcja ponowienia.

## 11. Kroki implementacji

1. Dodać stałe `WEEK_NAV_OFFSETS` (desktop/mobile) i pomocnicze utilsy dat (`startOfWeek`, `endOfWeek`, przesunięcia).
2. Zaimplementować hook `useWeekViewport` (weekIndex, zakresy visible/prefetch, cache, fetch).
3. Zbudować `WeekNavigator` (przyciski ±1, label, obsługa swipe na mobile).
4. Zbudować `DayWeekView` (siatka/strip tygodnia, highlight „Dzisiaj”, placeholdery).
5. Dodać `DayCard` renderujący datę/danie i CTA.
6. Dodać FAB i nawigację do `/dishes/new` (nakładka) bez resetu `weekIndex`.
7. Zintegrować komunikaty błędów i empty state; ręcznie sprawdzić 401/422.
