Najpierw zorientuję się w strukturze repozytorium (główne katalogi, strony, komponenty, API), wykorzystując istniejące pliki i layouty. Na tej podstawie, wraz z dostarczonymi dokumentami (`tech-stack`, `ui-plan`, `api-plan`), przygotuję szczegółowy plan testów dopasowany do tego konkretnego projektu, w całości po polsku.

[5 tools called]

<plan_testów>

## 1. Wprowadzenie i cele testowania

### Filozofia testowania: JAKOŚĆ > ILOŚĆ

**Kluczowe zasady:**
- ✅ Testuj LOGIKĘ BIZNESOWĄ, nie framework
- ✅ Testuj KRYTYCZNE przypadki brzegowe, nie każdy możliwy edge case
- ✅ Testuj to co MOŻE SIĘ ZEPSUĆ, nie to co jest oczywiste
- ❌ NIE testuj: "should accept exactly 256 characters" - to marnotrawstwo
- ❌ NIE testuj: każdej kombinacji parametrów - wybierz reprezentatywne
- 🎯 **Cel: 50-70 sensownych testów, nie 150+ bezsensownych**

### Cele testowania

- **Cel główny**: Zapewnienie, że aplikacja Obiadex działa stabilnie i zgodnie z wymaganiami biznesowymi (`ui-plan.md`, `api-plan.md`).
- **Cele szczegółowe**:
  - **Kluczowe przepływy użytkownika**: auth, planowanie dnia, zarządzanie daniami/tagami
  - **Poprawność API**: zgodność z kontraktami (`api-plan.md`)
  - **Separacja danych**: RLS w Supabase działa poprawnie
  - **Jakość techniczna**: walidacje, error handling, brak regresji

---

## 2. Zakres testów

- **Frontend (Astro + React)**:
  - Strony w `src/pages/**`:
    - Publiczne: `/login`, `/signup`, `/reset-password`, `/auth/callback`.
    - Chronione: `/` (lista dni), `/dishes`, `/dishes/[dishId]/edit`.
  - Komponenty React w `src/components/**`:
    - Widoki: `HomeView`, `DishesView`, `DayPlanOverlay`, `DishEditorOverlay`.
    - Formularze: `LoginForm`, `SignupForm`, `ResetPasswordForm`, `DishForm`.
    - Kontrolki: `SearchInput`, `TagFilterCombobox`, `TagCreatableCombobox`, `Pagination`, `FAB`, `Dialog`/`Drawer` (`ui/dialog.tsx`, `ui/drawer.tsx`), `Header`, `EmptyState`, `FormMessage`.
    - Logika UI: hooki `useWeekViewport`, `useDishPicker`, `useDishListFilters`, `useDebouncedValue`, `useAddDishDialog`.
- **Backend (API Astro + Supabase)**:
  - Endpoints w `src/pages/api/**`:
    - `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/reset-password`.
    - `GET/POST/PUT/DELETE /api/dishes`, `/api/dishes/{id}`, `/api/dishes/{id}/tags`, `/api/dishes/{id}/tags/{tagId}`.
    - `GET/POST/DELETE /api/tags`, `/api/tags/{id}`.
    - `GET/PUT/DELETE /api/day-plans`, `/api/day-plans/{day}`.
    - `GET /api/analytics/summary`.
- **Warstwa usług i walidacji**:
  - Serwisy w `src/lib/services/**`: `authService`, `dishService`, `tagService`, `dayPlanService`, `dishTagService`, `analyticsService`.
  - Walidacje w `src/lib/validation/**`: `authSchemas`, `dishSchemas`, `tagSchemas`, `dayPlanSchemas`, `analyticsSchemas`.
  - Narzędzia dat w `src/lib/date/**` – poprawność logiki dnia (`YYYY-MM-DD`, zakresy dat).
- **Baza danych i RLS (Supabase)**:
  - Schemat tabel: `dishes`, `tags`, `dish_tags`, `day_plans`, `events` (na podstawie `api-plan.md` i `database.types.ts`).
  - Polityki RLS – dostęp tylko do danych aktualnie zalogowanego użytkownika (`user_id = auth.uid()`).
- **Out-of-scope (MVP)**:
  - Zaawansowane raporty analityczne poza `GET /analytics/summary`.
  - Skalowanie na bardzo duże wolumeny danych – tylko bazowe testy wydajnościowe.

---

## 3. Typy testów do przeprowadzenia

### 3.1. Testy jednostkowe

**UWAGA**: Testy jednostkowe powinny koncentrować się TYLKO na logice biznesowej i krytycznych przypadkach brzegowych. Unikaj testowania oczywistych rzeczy jak "should accept exactly 256 characters" - to tylko marnotrawstwo czasu.

- **Zakres (MINIMUM VIABLE)**:
  - **Walidacje** (`src/lib/validation/**`) - ~50 testów:
    - `authSchemas` (~7 testów): normalizacja email, podstawowa walidacja hasła, Bearer token
    - `dishSchemas` (~18 testów): wymaganie tagów (krytyczne!), normalizacja, podstawowe limity
    - `tagSchemas` (~9 testów): normalizacja lowercase, limity długości, bulk operations
    - `dayPlanSchemas` (~10 testów): format YYYY-MM-DD, zakres 180 dni, leap year
    - `analyticsSchemas` (~6 testów): datetime format, zakres dat, walidacja przyszłości

  - **Utilsy dat** (`src/lib/date/utils.ts`) - ~14 testów:
    - Formatowanie i parsowanie (round-trip)
    - Obliczanie początku/końca tygodnia (Monday/Sunday)
    - Dodawanie dni/tygodni z overflow miesięcy
    - Generowanie zakresów dat

  - **Hooki React** - tylko najprostsze:
    - `useDebouncedValue` (~3 testy): podstawowy debounce, cancel timer
    - **POMIŃ**: `useWeekViewport`, `useDishListFilters`, `useDishPicker` - zbyt złożone, testuj w E2E

  - **Serwisy** - **POMIŃ NA RAZIE**:
    - Wymaga mockowania Supabase - lepiej testować integracyjnie
    - Można dodać później 1-2 przykładowe testy jako template

- **Cele**:
  - Wykrywanie regresji w krytycznej logice biznesowej
  - Zabezpieczenie kontraktów API (obowiązkowe pola, formaty)
  - **NIE**: testowanie frameworka, bibliotek, oczywistych edge cases

### 3.2. Testy integracyjne

- **API + baza danych (Supabase)**:
  - Uruchomienie testów z realną instancją Supabase (lokalną lub dedykowaną testową).
  - Scenariusze:
    - Tworzenie dania z tagami (nowe tagi + istniejące) → weryfikacja wpisów w `dishes`, `tags`, `dish_tags`, poprawność RLS.
    - Aktualizacja dania (`PUT /dishes/{id}`) → wymiana zestawu tagów, brak globalnego usuwania tagów.
    - Usuwanie tagu (`DELETE /tags/{id}`) → odpięcie we wszystkich `dish_tags` + usunięcie tagu.
    - Planowanie dnia (`PUT /day-plans/{day}`) → upsert na `(user_id, day)`, poprawne powiązanie z `dish_id`.
    - Zapisywanie eventów (`dish_added`, `day_planned`) – tolerancja na błędy (eventy nie blokują głównego flow).
  - Weryfikacja mapowania błędów i statusów HTTP opisanych w `api-plan.md`.

- **Middleware i auth**:
  - `src/middleware/index.ts`: przekierowania niezalogowanych na `/login`, autoryzacja tras chronionych (`/`, `/dishes`).
  - Integracja z Supabase Auth:
    - Prawidłowe odczytywanie JWT (z `Authorization: Bearer`).
    - Zależność między sesją frontendu a uprawnieniami w bazie (RLS).

- **Frontend + API (contract tests)**:
  - Testy komponentów React z użyciem mockowanego API (np. MSW):
    - `HomeView`: prawidłowe odzwierciedlenie odpowiedzi `/day-plans`.
    - `DishesView`: obsługa paginacji, wyszukiwania, filtrów `/dishes`.
    - `DayPlanOverlay`, `DishEditorOverlay`: prawidłowe złożenie wielu endpointów (`/dishes`, `/tags`, `/day-plans/{day}`).

### 3.3. Testy end-to-end (E2E)

- **Narzędzie**: Playwright / Cypress (preferowany Playwright).
- **Zakres krytyczny**:
  - Logowanie, rejestracja, reset hasła.
  - Onboarding: brak dań → dodanie pierwszego dania → przypisanie do dnia.
  - Planowanie tygodnia, zmiana dania, usuwanie planu dnia.
  - Zarządzanie bazą dań: dodawanie, edycja, filtrowanie po nazwie i tagach.
  - Zarządzanie tagami: dodawanie, globalne usuwanie, potwierdzanie usunięcia, normalizacja nazw.
  - Ochrona tras: próby wejścia na `/` i `/dishes` bez/po utracie sesji.

### 3.4. Testy niefunkcjonalne

- **Testy wydajnościowe (lightweight)**:
  - Czas odpowiedzi dla kluczowych endpointów (`/dishes`, `/day-plans`, `/tags`) przy typowych rozmiarach danych.
  - Responsywność UI przy większej liczbie dni/dań (np. 6 miesięcy planów, setki dań).
- **Testy bezpieczeństwa**:
  - Próby dostępu do danych innego użytkownika (wymaga kilku kont testowych).
  - Weryfikacja, że nie ma możliwości obejścia RLS przez manipulację payloadem.
  - Sprawdzenie poprawnego obchodzenia się z tokenem JWT (brak wycieku w logach, brak umieszczania w URL).
- **Testy UX/dostępności**:
  - Dostępność komponentów `Dialog`/`Drawer` (focus trap, ARIA, obsługa klawiatury).
  - Responsywność widoków (`HomeView`, `DishesView`, `DayPlanOverlay`).

---

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Uwierzytelnianie i sesje

- **Rejestracja (`/signup` + `POST /auth/signup`)**:
  - **Pozytywne**:
    - Poprawny email i hasło → utworzenie konta, odpowiedź 201 z `userId`, `email`, przekierowanie do `/login` lub automatyczne logowanie (zgodnie z konfiguracją).
  - **Negatywne**:
    - Nieprawidłowy email → 400 + komunikat walidacyjny w formularzu.
    - Zbyt krótkie hasło → 400/422 + komunikat przy polu hasła.
    - Email już istnieje → 409 + ogólny komunikat „konto już istnieje”.

- **Logowanie (`/login` + `POST /auth/login`)**:
  - **Pozytywne**:
    - Poprawne dane → 200 z `accessToken`, przekierowanie na `/`.
  - **Negatywne**:
    - Błędne hasło → 401, komunikat bez ujawniania czy konto istnieje.
    - Brak aktywnego konta (jeśli dotyczy konfiguracji Supabase) → odpowiedni komunikat.

- **Reset hasła (`/reset-password` + `POST /auth/reset-password`)**:
  - Poprawny email (istniejący) → 202, informacja o wysłaniu maila (bez potwierdzenia istnienia konta).
  - Nieprawidłowy email (format) → 400, walidacja po stronie klienta i serwera.

- **Wylogowanie (`POST /auth/logout`)**:
  - Aktywna sesja → 204 i natychmiastowy redirect do `/login`, wyczyszczenie tokenu.
  - Brak ważnej sesji → 401.

- **Callback (`/auth/callback`)**:
  - Poprawny kod od Supabase → utworzenie sesji w kliencie, redirect do `/`.
  - Nieprawidłowe/wygaśnięte dane → komunikat błędu, pozostanie na stronie auth.

### 4.2. Ochrona tras i nawigacja

- **Middleware i redirecty**:
  - Niezalogowany użytkownik wchodzi na `/` → redirect do `/login`.
  - Niezalogowany wchodzi na `/dishes` → redirect do `/login`.
  - Zalogowany użytkownik wchodzi na `/login` lub `/signup` → redirect na `/`.

- **Nawigacja i layout**:
  - `Header` pokazuje link do `/dishes` tylko po zalogowaniu, przycisk „Wyloguj”.
  - FAB na `/` i w overlayach działa zgodnie z opisem (`ui-plan.md`).

### 4.3. Lista dni i planowanie (Home)

- **Pobieranie planów (`GET /day-plans?start&end`)**:
  - Zakres dat w dopuszczalnych granicach → 200, lista dni z przypisanymi daniami.
  - Zakres > 180 dni → 422, komunikat walidacyjny.
  - Sortowanie `asc`/`desc` zgodnie z kontraktem.

- **Overlay dnia (`/?day=YYYY-MM-DD` + `GET /day-plans/{day}`)**:
  - Dzień bez planu → tryb „edit”; pusta lista dań → stan pusty z CTA „Dodaj danie”.
  - Dzień z planem → tryb „view” z danymi dania i tagami.

- **Przypisywanie dania (`PUT /day-plans/{day}`)**:
  - Poprawne `dishId` → 201 (nowy) lub 200 (aktualizacja), odświeżenie widoku tygodnia.
  - Nieistniejące `dishId` → 404.
  - Niepoprawny format `day` → 422.
  - Wysyłanie `Idempotency-Key` → powtórne żądania nie duplikują wpisu.

- **Usuwanie planu dnia (`DELETE /day-plans/{day}`)**:
  - Istniejący plan → 204, w widoku dnia brak przypisanego dania.
  - Brak planu → 404, w UI informacja bez krytycznego błędu.

- **Nawigacja tygodniowa (`WeekNavigator`, `DayWeekView`)**:
  - Przejście na poprzedni/następny tydzień na desktopie i mobile.
  - Prefetch odpowiednich zakresów dat (zgodnie z `ui-plan.md`).
  - Stabilne wyświetlanie dat i danej strefy czasu.

### 4.4. Baza dań (`/dishes`)

- **Lista dań (`GET /dishes`)**:
  - Domyślne sortowanie `created_desc`, strona 1, `pageSize=20`.
  - Inne sortowania: `name_asc`, `usage_prio` (nigdy niewybrane najpierw, potem wg `lastUsedDay` i nazwy).
  - Błędne `page`/`pageSize` → 400.

- **Wyszukiwanie i filtry**:
  - `q` (fragment nazwy) – dopasowania częściowe, brak wyników → stan pusty z komunikatem.
  - `tagId[]` – logika AND (danio musi mieć wszystkie podane tagi).
  - Kombinacja `q` + `tagId[]`.

- **Paginacja (`Pagination`)**:
  - Zmiana strony zachowuje filtry i zapytanie.
  - Powrót na listę po przejściu do edycji dania zachowuje kontekst (strona, filtry).

### 4.5. Formularz dania i tagi (`DishForm`, `TagCreatableCombobox`)

- **Tworzenie dania (`POST /dishes`)**:
  - Wymagane pola: `name` (3–80), co najmniej 1 tag (`tagNames` lub `tagIds`).
  - Opcjonalne: `recipeText` (≤2000), `url` (≤255).
  - Tworzenie z nowymi tagami:
    - Normalizacja nazw tagów do lowercase.
    - Unikalność per użytkownik (case-insensitive).
  - Błędy walidacyjne → 422 z listą naruszeń, powiązanie z polami formularza.

- **Edycja dania (`PUT /dishes/{id}`)**:
  - Aktualizacja nazwy, opisu, URL, pełnej listy tagów.
  - Usunięcie tagu w formularzu → odpięcie tylko od dania (nie globalne usunięcie taga).

- **Zarządzanie tagami (`/tags`)**:
  - `GET /tags?includeCounts`:
    - Bez `includeCounts` → lista tagów bez `dishCount`.
    - Z `includeCounts=true` → każdy tag z liczbą dań.
  - `POST /tags`:
    - Tryb single: `name` → 201, błąd 409 przy próbie stworzenia duplikatu (manualna informacja w UI).
    - Tryb bulk: `names[]` → 200, z upsertem istniejących tagów (brak błędu przy duplikatach).
  - `DELETE /tags/{id}`:
    - Gdy `dishCount > 0` → UI wyświetla `ConfirmDialog`, po potwierdzeniu `detachedFrom` w odpowiedzi > 0.
    - Gdy tag nie istnieje → 404.

### 4.6. Analityka (`/analytics/summary`)

- **Scenariusze**:
  - Poprawny zakres dat → 200, pola `dishAdded.count`, `dayPlanned.count`.
  - Niepoprawny zakres → 422.
  - Weryfikacja, że awarie zapisywania eventów (`events` tabela) nie psują głównych flow (E2E z symulowanym błędem po stronie bazy – jeśli możliwe).

---

## 5. Środowisko testowe

- **Środowiska**:
  - **Lokalne**:
    - Uruchamianie aplikacji: `npm install`, `npm run dev`.
    - Supabase lokalny lub dedykowany projekt testowy (osobna baza od produkcji).
  - **Test / Staging**:
    - Mirror konfiguracji produkcyjnej z ograniczonymi danymi.
    - Osobne klucze Supabase, osobne `events` i dane użytkowników.
- **Konfiguracja**:
  - Pliki `.env` i `src/env.d.ts` zsynchronizowane – wymagane zmienne zdefiniowane w obu.
  - Konta testowe:
    - Co najmniej 3: `userA`, `userB`, `admin` (dla scenariuszy RLS i ewentualnych operacji administracyjnych).
  - Dane przykładowe:
    - Seed dań, tagów i planów dni (skrypty seedujące lub migracje Supabase).
    - Zestawy do testów wydajnościowych (większa liczba rekordów).

---

## 6. Narzędzia do testowania

- **Testy jednostkowe/integracyjne**:
  - **Vitest** (lub Jest) jako runner testów dla TypeScript.
  - **React Testing Library** do testów komponentów React (`src/components/**`).
  - **Supertest** lub `fetch` + setup testowego serwera Astro do testów endpointów w `src/pages/api/**`.
  - **MSW (Mock Service Worker)** do mockowania API w testach UI.
- **Testy E2E**:
  - **Playwright**:
    - Scenariusze E2E na poziomie przeglądarki.
    - Testy responsywności (różne viewporty).
- **Analiza statyczna i formatowanie**:
  - **ESLint** (`npm run lint`) i **Prettier** (`npm run format`) jako brama jakościowa przed uruchomieniem testów automatycznych.
- **Testy wydajnościowe (opcjonalne)**:
  - **k6** lub **Artillery** do obciążenia endpointów `/dishes`, `/day-plans`, `/tags`.

---

## 7. Harmonogram testów

- **Faza 1 – Przygotowanie infrastruktury (1–2 sprinty)**:
  - Konfiguracja Vitest/Jest, RTL, Playwright.
  - Dodanie podstawowych testów smoke dla API (`/health` jeśli istnieje, /auth login/signup) i UI (ładowanie `/login`, `/` po zalogowaniu).
- **Faza 2 – Walidacje i serwisy (1–2 sprinty)**:
  - Pokrycie testami jednostkowymi `src/lib/validation/**`, `src/lib/date/**`.
  - Dodanie testów jednostkowych i pierwszych integracyjnych dla serwisów (`authService`, `dishService`, `tagService`, `dayPlanService`).
- **Faza 3 – API i RLS (1–2 sprinty)**:
  - Testy integracyjne endpointów `src/pages/api/**` z prawdziwą bazą Supabase test.
  - Scenariusze multi-user (RLS) i typowe błędy (401, 404, 409, 422, 429).
- **Faza 4 – E2E kluczowych flow (1–2 sprinty)**:
  - E2E dla logowania, rejestracji, resetu hasła.
  - E2E dla planowania dnia, zmiany dań, zarządzania bazą dań i tagów.
- **Faza 5 – Niefunkcjonalne + regresja (ciągła)**:
  - Wstępne testy wydajnościowe.
  - Włączenie suite regresyjnej (automatyczne uruchamianie w CI przy pull requestach).
- **Faza ciągła**:
  - Dodawanie testów do nowych funkcji w ramach Definition of Done (DoD).

---

## 8. Kryteria akceptacji testów (REALISTYCZNE)

- **Pokrycie testami**:
  - **~50-60 testów jednostkowych** pokrywających walidacje, date utils, podstawowe hooki
  - **50-70% pokrycia** dla `src/lib/validation/**` i `src/lib/date/**` (NIE 100%!)
  - **Serwisy**: testy integracyjne z prawdziwą bazą (nie unit testy z mockami)
  - **E2E**: kluczowe ścieżki użytkownika (auth, planowanie, zarządzanie daniami/tagami)
  - **PRIORYTET**: jakość > ilość. Lepiej 50 sensownych testów niż 150 bezsensownych.

- **Jakość i stabilność**:
  - Brak defektów **P1** (krytyczne) i **P2** (wysokie) przed releasem
  - Wszystkie testy w CI przechodzą zielono
  - Szybkie wykonanie suite (<5s dla unit testów)

- **Zgodność z wymaganiami**:
  - Kontrakty API zgodne z `api-plan.md` (struktura JSON, kody statusu)
  - UI zgodny z `ui-plan.md` (widoki, overlaye, nawigacja)
  - **Weryfikacja TYLKO kluczowych przypadków**, nie każdego możliwego edge case'a

---

## 9. Role i odpowiedzialności

- **QA Engineer / QA Lead**:
  - Opracowanie i utrzymywanie planu testów.
  - Przygotowanie i utrzymanie scenariuszy testowych (manualnych i automatycznych).
  - Triage defektów, priorytetyzacja i raportowanie jakości.
- **Zespół deweloperski (Frontend/Backend)**:
  - Implementacja testów jednostkowych i integracyjnych w ramach DoD.
  - Współpraca z QA przy tworzeniu scenariuszy E2E.
- **DevOps / Inżynier odpowiedzialny za infrastrukturę**:
  - Konfiguracja środowisk (local/test/staging/prod), CI/CD (Github Actions).
  - Utrzymanie stabilności Supabase i innych zasobów zewnętrznych.
- **Product Owner / Analityk**:
  - Weryfikacja, że scenariusze testowe pokrywają kluczowe wymagania biznesowe.
  - Akceptacja wyników testów przed releasem.

---

## 10. Procedury raportowania błędów

- **Narzędzie śledzenia błędów**:
  - GitHub Issues (lub inne wybrane narzędzie), z dedykowanymi szablonami zgłoszeń.
- **Treść zgłoszenia błędu**:
  - **Tytuł**: krótki opis problemu (np. „[E2E] Zmiana dania nie odświeża listy dni”).
  - **Opis**:
    - Kroki do reprodukcji (step-by-step).
    - Oczekiwany rezultat.
    - Aktualny rezultat.
  - **Dane techniczne**:
    - Środowisko (local/test/staging, wersja przeglądarki).
    - Zrzuty ekranu / nagranie.
    - Fragmenty logów (bez danych wrażliwych).
  - **Klasyfikacja**:
    - Priorytet (P1–P4) i wpływ (blokujący/istotny/minor).
    - Oznaczenie komponentu (np. `frontend/home`, `backend/dishes-api`, `auth`).
- **Workflow obsługi błędu**:
  - QA zgłasza błąd → przypisanie do odpowiedniego dewelopera → naprawa → PR z testem regresji.
  - QA weryfikuje poprawkę:
    - Test manualny + potwierdzenie, że istniejący/nastawiony test automatyczny odtwarzał błąd i teraz przechodzi.
  - Zamknięcie zgłoszenia z komentarzem, w jakiej wersji/release błąd został naprawiony.

</plan_testów>
