# Architektura UI dla Obiadex

## 1. Przegląd struktury UI

Aplikacja webowa dostępna wyłącznie po zalogowaniu. Po uwierzytelnieniu użytkownik trafia na widok „Lista dni" (home) z nawigacją tygodniową (poprzedni/następny tydzień). Desktop pokazuje 3 tygodnie (21 dni) w układzie siatki, mobile pokazuje 1 tydzień w kolumnie. Wybór/zmiana dania dla konkretnego dnia odbywa się w routowalnej nakładce (Dialog/Drawer) otwieranej z listy dni, która ma dwa tryby: "view" (szczegóły przypisanego dania) i "edit" (wybór/zmiana dania). Zarządzanie daniami odbywa się w widoku „Baza dań" z paginacją, wyszukiwaniem po nazwie i filtrowaniem po tagach (logika AND). Tagi są tworzone w locie i normalizowane do lowercase; usunięcie tagu z komponentu multi‑select skutkuje jego globalnym usunięciem dla użytkownika.

- Wejściowe trasy: `/login`, `/signup`, opcjonalnie `/reset-password` (jeśli obsługiwane przez Supabase); trasy chronione: `/` (lista dni), `/dishes` (baza dań) z routowalnymi nakładkami.
- Nakładki routowalne:
  - Wybór/zmiana dania dla dnia: parametr `?day=YYYY-MM-DD` na trasie `/` (zaimplementowane).
  - Dodanie/edycja dania: overlay `DishEditorOverlay` otwierany z FAB lub kontekstowo; edycja również przez trasę `/dishes/[dishId]/edit` która automatycznie otwiera overlay.
- Ochrona tras i izolacja danych: weryfikacja sesji po stronie SSR/middleware; API używa Bearer JWT, RLS w bazie ogranicza dostęp do danych użytkownika.
- Responsywność: mobile‑first; Dialog (desktop) / Drawer (mobile); dostępny FAB „+” na liście dni i w nakładce dnia.
- Zgodność z API: widoki i interakcje mapują się na `/auth/*` (opcjonalnie), `/dishes`, `/tags`, `/day-plans`, z obsługą błędów 401/404/409/422/429 i idempotencją dla modyfikacji.

## 2. Lista widoków

- Nazwa widoku: Logowanie
  - Ścieżka widoku: `/login`
  - Główny cel: Uwierzytelnić użytkownika i nadać kontekst sesji.
  - Kluczowe informacje do wyświetlenia: Formularz email/hasło, link do rejestracji, opcjonalnie link do resetu hasła; komunikaty błędów.
  - Kluczowe komponenty widoku: `AuthForm(Login)`, `Button`, `Input`, `FormMessage`/toast, odnośnik „Załóż konto”.
    - Interakcje z API: opcjonalnie `POST /auth/login` (jeśli nie korzystamy bezpośrednio z SDK Supabase).
  - UX, dostępność i względy bezpieczeństwa: weryfikacja po SSR kieruje niezalogowanych do `/login`; pola z atrybutami `autocomplete`; komunikaty o błędach bez ujawniania szczegółów; po sukcesie redirect do `/`.

- Nazwa widoku: Rejestracja
  - Ścieżka widoku: `/signup`
  - Główny cel: Utworzyć konto użytkownika.
  - Kluczowe informacje do wyświetlenia: Formularz email/hasło, link do logowania; komunikaty walidacyjne.
  - Kluczowe komponenty widoku: `AuthForm(Signup)`, `Button`, `Input`, `FormMessage`.
    - Interakcje z API: opcjonalnie `POST /auth/signup`.
  - UX, dostępność i względy bezpieczeństwa: walidacje po stronie klienta; po sukcesie przekierowanie do `/login` lub automatyczne logowanie zgodnie z konfiguracją Supabase.

- Nazwa widoku: Reset hasła (opcjonalny)
  - Ścieżka widoku: `/reset-password` lub zewnętrzny flow Supabase
  - Główny cel: Zainicjować proces resetu hasła.
  - Kluczowe informacje do wyświetlenia: Pole email, potwierdzenie wysłania wiadomości.
  - Kluczowe komponenty widoku: `ResetPasswordForm`, `Button`, `Input`, `FormMessage`.
    - Interakcje z API: opcjonalnie `POST /auth/reset-password`.
  - UX, dostępność i względy bezpieczeństwa: brak ujawniania istnienia konta; po sukcesie informacja 202 Accepted; link powrotu do logowania.

- Nazwa widoku: Lista dni (Home)
  - Ścieżka widoku: `/`
  - Główny cel: Przegląd i szybkie planowanie jednego dania na każdy dzień w układzie tygodniowym z nawigacją poprzedni/następny tydzień.
  - Kluczowe informacje do wyświetlenia: Widok tygodniowy (desktop: 3 tygodnie w siatce, mobile: 1 tydzień w kolumnie); kafle dni z datą i przypisanym daniem (jeśli istnieje); stany ładowania; puste dni; link do „Baza dań".
  - Kluczowe komponenty widoku: `HomeView`, `WeekNavigator` (nawigacja tygodniowa), `DayWeekView` (wyświetlanie tygodni), `DayCard`, `FAB(+)`, `Header` (link do `/dishes`), `Toast`/`InlineError`.
    - Interakcje z API: `GET /day-plans?start&end` do pobierania planów w zakresie prefetch (desktop: ±1 tydzień, mobile: ±2 dni); otwarcie nakładki wyboru dania; po zapisie `PUT /day-plans/{day}`.
  - UX, dostępność i względy bezpieczeństwa: układ siatki tygodniowej; czytelne etykiety dat; nawigacja klawiaturą i gestami (swipe na mobile); FAB dostępny klawiaturą; 401 powoduje redirect do `/login`.

- Nazwa widoku: Nakładka wyboru/zmiany dania dla dnia (Dialog/Drawer)
  - Ścieżka widoku: `/?day=YYYY-MM-DD` (routowalny overlay na trasie `/`)
  - Główny cel: Wyświetlić szczegóły przypisanego dania (tryb "view") lub wybrać/zmienić danie ręcznie dla danego dnia (tryb "edit").
  - Kluczowe informacje do wyświetlenia: 
    - Tryb "view": szczegóły dania (nazwa, tagi, przepis, URL), przyciski edycji i usunięcia.
    - Tryb "edit": data dnia; wyszukiwanie po nazwie; filtr po tagach (multi‑select); lista dań z sortem „używane rzadziej najpierw"; stan pustej bazy dań z CTA do dodania.
  - Kluczowe komponenty widoku: `DayPlanOverlay`, `Dialog` (desktop) / `Drawer` (mobile), `DayPlanDetailsView` (tryb view), `TagCreatableCombobox` (tryb edit), `DishPickerList (usage_prio)` (tryb edit), `Button(Zapisz/Anuluj)`, `EmptyState`, `FAB(+)` do dodania dania w locie.
    - Interakcje z API: `GET /day-plans/{day}` do sprawdzenia istniejącego planu; `GET /dishes?sort=usage_prio&tagId=...`; `GET /tags` do filtra; zapis: `PUT /day-plans/{day}`; usunięcie: `DELETE /day-plans/{day}`; CTA dodania otwiera overlay tworzenia dania.
  - UX, dostępność i względy bezpieczeństwa: focus trap, obsługa klawiatury i roli ARIA; automatyczne przełączanie między trybami view/edit; jasny komunikat, gdy brak dań; stabilne sortowanie dla równej daty (po name ASC); użycie `Idempotency-Key` przy zapisie; zamknięcie nakładki zmienia URL bez utraty stanu listy.

- Nazwa widoku: Baza dań
  - Ścieżka widoku: `/dishes`
  - Główny cel: Przegląd, wyszukiwanie, filtrowanie i paginacja własnych dań; wejście do tworzenia/edycji.
  - Kluczowe informacje do wyświetlenia: Lista dań (20/strona), nazwa, tagi, opcjonalnie link/url; pasek wyszukiwania; filtr tagów (AND); kontrolki paginacji; pusty stan.
  - Kluczowe komponenty widoku: `SearchInput(debounce)`, `TagFilterCombobox`, `DishList`, `DishListItem`, `Pagination`, `FAB(+)`, `EmptyState`, `Toast`/`InlineError`.
    - Interakcje z API: `GET /dishes?page&pageSize&q&tagId[]&sort=created_desc`; `GET /tags`; `POST /dishes` (tworzenie) i `PUT /dishes/{id}` (edycja) z invalidacjami listy.
  - UX, dostępność i względy bezpieczeństwa: jasne komunikaty przy braku wyników; multi‑select z wyraźnym oznaczeniem AND; zachowanie paginacji przy nawigacji; 422/409 mapowane do komunikatów.

- Nazwa widoku: Nakładka dodawania/edycji dania (Dialog)
  - Ścieżka widoku: Overlay `DishEditorOverlay` otwierany z FAB lub kontekstowo; edycja również przez trasę `/dishes/[dishId]/edit` która automatycznie otwiera overlay.
  - Główny cel: Utworzyć lub zaktualizować danie wraz z tagami.
  - Kluczowe informacje do wyświetlenia: Pola: name (wymagane), tags[] (co najmniej 1), recipe_text (opcjonalnie), url (opcjonalnie); walidacje długości; podgląd tagów.
  - Kluczowe komponenty widoku: `DishEditorOverlay`, `DishForm (react-hook-form + zod)`, `TagCreatableCombobox`, `Textarea`, `Input(url)`, `Button(Zapisz)`, `ConfirmDialog` (przy globalnym usunięciu tagu), `Toast`/`InlineError`.
    - Interakcje z API: tworzenie `POST /dishes` (emituje `dish_added`), edycja `PUT /dishes/{id}`; zarządzanie tagami: `POST /tags` (creatable), globalne usunięcie: `DELETE /tags/{id}`.
  - UX, dostępność i względy bezpieczeństwa: walidacje inline (name 3–80, tag 2–30, recipe_text ≤2000, url ≤255); normalizacja tagów do lowercase; przy usuwaniu tagu, jeśli `dishCount>0`, pokazuj potwierdzenie; formularz dostępny klawiaturą, czytelne opisy błędów.

## 3. Mapa podróży użytkownika

- Główny przypadek użycia: Planowanie dnia
  1. Użytkownik loguje się (`/login`).
  2. Trafia na `/` z widokiem tygodniowym; aplikacja dociąga okna dat (`GET /day-plans?start&end`) w zakresie prefetch.
  3. Klika wybrany dzień → otwiera się nakładka w trybie "view" (jeśli plan istnieje) lub "edit" (jeśli nie); w trybie edit lista dań (sort `usage_prio`) i filtr tagów (`GET /dishes`, `GET /tags`).
  4. Opcjonalnie zawęża po tagach; wybiera danie; zapisuje (`PUT /day-plans/{day}` z `Idempotency-Key`).
  5. Widok `/` odświeża się; wybrane danie jest widoczne na kaflu dnia; event `day_planned` zarejestrowany po stronie serwera.

- Onboarding: Dodanie pierwszego dania
  1. Po zalogowaniu i kliknięciu dnia, jeśli baza dań jest pusta, nakładka pokazuje pusty stan i CTA.
  2. Użytkownik klika „Dodaj danie” → otwiera się `/dishes/new` (nakładka).
  3. Wypełnia `name` i co najmniej 1 `tag` (creatable), opcjonalnie `recipe_text` i `url`; zapis (`POST /dishes`), event `dish_added`.
  4. Powrót do nakładki wyboru; danie jest dostępne do wyboru.

- Zarządzanie bazą dań
  1. Użytkownik przechodzi do `/dishes` (link w nagłówku lub z home).
  2. Szuka po nazwie, filtruje po tagach (AND), przegląda strony (`GET /dishes`, `GET /tags`).
  3. Dodaje nowe danie (`/dishes/new`) lub edytuje istniejące (`/dishes/:id/edit` → `PUT /dishes/{id}`).
  4. W formularzu może usunąć tag z multi‑selecta; jeśli tag ma powiązania, pokazuje się potwierdzenie; po akceptacji `DELETE /tags/{id}` odcina tag globalnie.

- Zmiana przypisanego dania
  1. Z listy dni otwiera nakładkę dnia (tryb "view").
  2. Klika "Zmień danie" → przełącza do trybu "edit".
  3. Wybiera inne danie z listy; zapis (`PUT /day-plans/{day}`) nadpisuje poprzedni wybór; lista dni aktualizuje kartę.

- Błędy i przypadki brzegowe
  - 401: redirect do `/login` (SSR i/lub po odpowiedzi API).
  - 404: przy braku dania/dnia — komunikat i powrót do listy.
  - 409: konflikt unikalności tagu — komunikat o normalizacji/nadpisaniu.
  - 422: walidacje formularzy — podpięte do pól (z lisą naruszeń).
  - 429: przy rate limit — spokojny komunikat i sugerowany retry.
  - DST/TZ: „day” liczony w lokalnej strefie, wysyłany jako `YYYY-MM-DD`.

- Mapowanie historyjek użytkownika (PRD → widoki/elementy)
  - US‑001/002/003/004 → `Login`, `Signup`, `ResetPassword`, akcja `Logout` w `HeaderNav`.
  - US‑010/011/012/013/014/015 → `Nakładka dodawania/edycji dania`, `TagCreatableCombobox`, `ConfirmDialog` przy `DELETE /tags/{id}`.
  - US‑016/017 → `Baza dań` (lista, paginacja, wyszukiwanie, filtry, pusty stan).
  - US‑020/021/022/023/024/025 → `Lista dni` + `Nakładka dnia` (filtrowanie, sort `usage_prio`, zapis, pusty stan, zmiana wyboru).
  - US‑026 → Odświeżenie listy dni po administracyjnym usunięciu dania (brak martwych referencji).
  - US‑028 → Emisja eventów serwerowo (bez blokowania UI).
  - US‑029/030 → Ochrona tras (SSR), izolacja danych; `HeaderNav` wyświetla tylko zasoby użytkownika.
  - US‑031 → Responsywne układy (Dialog/Drawer, wirtualizacja, dostępne CTA).

## 4. Układ i struktura nawigacji

- Warstwa layoutu (`Layout.astro` + `Header`): nagłówek z nazwą aplikacji, linkiem do `/dishes`, menu użytkownika (Wyloguj). Główna sekcja na listę dni lub bazę dań.
- Nawigacja główna:
  - Po zalogowaniu: domyślna trasa `/`.
  - Link stały do „Baza dań” (`/dishes`).
  - FAB „+”:
    - Na `/`: otwiera nakładkę dnia lub tworzenie dania zależnie od kontekstu.
    - W nakładce dnia: tworzy nowe danie (`/dishes/new`).
- Nakładki routowalne nie zmieniają tła listy (zachowany scroll i stan); zamknięcie aktualizuje URL (usunięcie parametru) bez pełnego przeładowania.
- Ochrona tras: middleware/SSR kieruje niezalogowanych do `/login`; po wylogowaniu natychmiastowy redirect i wyczyszczenie stanu klienta.

## 5. Kluczowe komponenty

- `Layout.astro` — wspólny layout Astro, slot na treść.
- `Header` — nagłówek z logo, nawigacja między `/` i `/dishes`, menu użytkownika (Wyloguj), responsywny hamburger menu.
- `HomeView` — główny komponent widoku home, zarządza stanem tygodniowym i overlayami.
- `WeekNavigator` — nawigacja tygodniowa (poprzedni/następny tydzień), obsługa gestów swipe na mobile.
- `DayWeekView` — wyświetlanie tygodni w układzie siatki (desktop: 3 kolumny, mobile: 1 kolumna).
- `FAB` — pływający przycisk akcji (dodaj danie/akcja kontekstowa).
- `DayCard` — kafel dnia: data, nazwa przypisanego dania lub CTA do wyboru.
- `DayPlanOverlay` — routowalny overlay wyboru/zmiany dania dla dnia, obsługuje tryby "view" i "edit", renderuje jako Dialog (desktop) / Drawer (mobile).
- `DayPlanDetailsView` — widok szczegółów przypisanego dania w trybie "view" overlayu.
- `DishEditorOverlay` — overlay dodawania/edycji dania, renderuje jako Dialog.
- `Dialog` / `Drawer` — kontener nakładek z poprawnym focus management.
- `DishPickerList` — lista wyboru dań z sortem `usage_prio`, opcjonalnie wyróżnia „nigdy niewybrane".
- `TagFilterCombobox` — multi‑select dla filtrowania (AND) w nakładce dnia i w bazie dań.
- `SearchInput` — pole wyszukiwania z debounce do filtrowania po nazwie w `Baza dań`.
- `DishList` / `DishListItem` — lista dań w `Baza dań` z paginacją i metadanymi.
- `Pagination` — kontrolki stronicowania (page, pageSize).
- `DishForm` — formularz tworzenia/edycji: `name`, `tags[]` (creatable), `recipe_text`, `url`; walidacje zgodne z PRD.
- `TagCreatableCombobox` — tworzenie tagów w locie, normalizacja do lowercase; usunięcie z multi‑selecta może inicjować globalne `DELETE /tags/{id}` z potwierdzeniem.
- `EmptyState` — komponent pustych stanów (brak dań, brak wyników filtrowania, brak planu).
- `Toast` / `InlineError` — spójne komunikaty błędów (401/404/409/422/429) i sukcesów.
- `LoginForm` / `SignupForm` — formularze auth z walidacją i komunikatami.
- `AuthPageLayout` — layout dla stron auth (login, signup).
