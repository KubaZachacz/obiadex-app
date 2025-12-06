# Specyfikacja autentykacji – Obiadex

## 1. Architektura interfejsu użytkownika

### 1.1. Widoki w trybie auth i non‑auth

- **Widok logowania (`/login`)**
  - **Technologia**: strona Astro `login.astro` + layout `Layout.astro` + komponent layoutu auth `AuthPageLayout.astro` + klientowy formularz React `LoginForm` (renderowany z `client:load`).
  - **Cel**: uwierzytelnić użytkownika przy użyciu emaila i hasła, zainicjować sesję Supabase Auth i przekierować do ekranu domowego (`/`).
  - **Kluczowe elementy UI**:
    - Pola: `email`, `password`.
    - Przycisk „Zaloguj się”.
    - Link do `/signup` w `AuthPageLayout` („Nie masz konta? Załóż konto”).
    - Komunikaty błędów w komponencie `FormMessage` (inline, nad przyciskiem).

- **Widok rejestracji (`/signup`)**
  - **Technologia**: strona Astro `signup.astro` + `Layout.astro` + `AuthPageLayout.astro` + komponent React `SignupForm` (client:load).
  - **Cel**: utworzyć nowe konto użytkownika w Supabase Auth.
  - **Kluczowe elementy UI**:
    - Pola: `email`, `password`.
    - Przycisk „Załóż konto”.
    - Link do `/login` w `AuthPageLayout` („Masz już konto? Zaloguj się”).
    - Komunikaty błędów i sukcesu (`FormMessage`), w tym informacja o poprawnej rejestracji i automatyczne przekierowanie do `/login`.

- **(Docelowy) widok resetu hasła (`/reset-password`)**
  - **Technologia**: planowana strona Astro z layoutem `Layout.astro` + `AuthPageLayout.astro` + klientowy formularz React `ResetPasswordForm`.
  - **Cel**: zainicjować proces resetu hasła (wysłanie maila resetującego przez Supabase).
  - **Kluczowe elementy UI**:
    - Pole: `email`.
    - Przycisk „Wyślij link do resetu hasła”.
    - Neutralny komunikat potwierdzający wysłanie instrukcji, niezależny od tego, czy konto istnieje (ochrona przed enumeracją kont).

- **Widoki chronione (po zalogowaniu)**
  - **Lista dni (home, `/`)**: strona Astro `index.astro` renderuje komponent React `HomeView` w trybie `client:only="react"` – główny widok tygodniowej listy dni.
  - **Baza dań (`/dishes`)**: strona Astro z layoutem `Layout.astro` i komponentami React (`DishesView`, `DishList`, filtry, FAB).  
  - **Edycja dania (`/dishes/[dishId]/edit`)**: strona Astro otwierająca nakładkę `DishEditorOverlay` w trybie edycji.
  - **Nawigacja globalna**:
    - Nagłówek `Header` (React) zawiera linki do `/` i `/dishes` oraz przycisk „Wyloguj” wywołujący `POST /api/auth/logout`.
    - Widoki auth (`/login`, `/signup`, docelowo `/reset-password`) nie pokazują nagłówka z akcją „Wyloguj”.

### 1.2. Podział odpowiedzialności: Astro vs React

- **Warstwa Astro (SSR, routing, layouty)**
  - Definiuje trasy (`/login`, `/signup`, `/`, `/dishes`, itp.) i odpowiada za kompozycję layoutów:
    - `Layout.astro` – wspólny layout dla widoków chronionych i stron auth.
    - `AuthPageLayout.astro` – layout dedykowany stronom auth (tytuł, podtytuł, linki pomocnicze).
  - Odpowiada za **włączenie komponentów React**:
    - Strony auth montują formularze (`LoginForm`, `SignupForm`) z dyrektywą `client:load` (render po stronie klienta).
    - Strona home montuje `HomeView` z `client:only="react"` (logika listy dni działa w pełni po stronie klienta).
  - W docelowej wersji odpowiada też za **ochronę tras po stronie serwera** (SSR):
    - Przy braku sesji Supabase dla żądań do tras chronionych (`/`, `/dishes`, itp.) – redirect 302 do `/login`.
    - Dla tras auth (`/login`, `/signup`, `/reset-password`) – opcjonalny redirect do `/`, jeśli użytkownik już jest zalogowany.

- **Formularze i komponenty React (warstwa interakcji i walidacji)**
  - **`LoginForm`**:
    - Utrzymuje lokalny stan formularza (`email`, `password`, `isSubmitting`, `error`).
    - Wykonuje **walidację client‑side** (format email, wymagalność, minimalna długość hasła) zanim wyśle żądanie.
    - Woła `fetch("/api/auth/login", { method: "POST", body: JSON.stringify(command) })` i mapuje kody odpowiedzi na komunikaty UI.
    - Po sukcesie (2xx) przekierowuje użytkownika na `/` (lub wywołuje `onSuccess`).
  - **`SignupForm`**:
    - Analogiczny wzorzec do `LoginForm`: lokalny stan, walidacja podstawowa, `fetch("/api/auth/signup")`.
    - Po sukcesie pokazuje komunikat („Konto zostało utworzone…”) i po krótkim czasie przekierowuje na `/login`.
  - **(Docelowy) `ResetPasswordForm`**:
    - Jedno pole `email`, walidacja formatu i wymagalności.
    - `fetch("/api/auth/reset-password")`, zawsze traktuje odpowiedź 202 jako sukces: wyświetla neutralny komunikat („Jeśli konto istnieje…”).
  - **`Header`**:
    - Zawiera przycisk **Wyloguj**, który wysyła `POST /api/auth/logout` i po sukcesie przekierowuje na `/login`.
    - Nie przechowuje stanu auth; opiera się na odpowiedzi backendu.
  - **Inne komponenty React (np. `HomeView`, `DishesView`)**:
    - Zakładają, że użytkownik jest zalogowany. Błędy `401` z API są obecnie obsługiwane jako błędy danych; w docelowym wariancie będą mapowane na redirect do `/login` lub pokazanie dedykowanego komunikatu i linku do logowania.

### 1.3. Walidacja i komunikaty błędów (UI)

- **Walidacja w formularzach klientowych**:
  - Email: prosty regex sprawdzający podstawową poprawność, wymagalność pola, przycięcie spacji.
  - Hasło:
    - Sprawdzenie wymagalności.
    - Minimalna długość 6 znaków w UI (backend wymaga ≥ 8 – patrz sekcja 2; UI można podnieść do tego samego progu).
    - Dodatkowe reguły w `SignupForm`, np. brak spacji wiodących/trailing w haśle.
  - Błędy walidacji client‑side są natychmiast wyświetlane w `FormMessage` jako komunikaty w języku polskim.

- **Mapowanie kodów HTTP na komunikaty UI** (w `LoginForm` / `SignupForm`):
  - `401 Unauthorized` (login):
    - Komunikat: „Nieprawidłowe dane logowania. Sprawdź email i hasło.”
  - `409 Conflict` (signup):
    - Komunikat: „Konto z tym adresem email już istnieje. Spróbuj się zalogować.”
  - `422 Unprocessable Entity` (oba formularze):
    - Próba odczytania ciała odpowiedzi (`response.json()`), użycie `errorData.message` gdy dostępne; fallback: „Sprawdź poprawność danych logowania/rejestracji”.
  - `429 Too Many Requests`:
    - Komunikat: „Zbyt wiele prób. Spróbuj ponownie za chwilę.”
  - `5xx` (błędy serwera):
    - Komunikat: „Wystąpił błąd serwera. Spróbuj ponownie za chwilę.”
  - Błędy sieci / brak połączenia:
    - Komunikat: „Błąd połączenia. Sprawdź połączenie internetowe i spróbuj ponownie.”

- **Stany sukcesu**:
  - Login:
    - Brak osobnego komunikatu; po poprawnym logowaniu natychmiastowe przekierowanie na `/`.
  - Signup:
    - Komunikat sukcesu + opóźnione przekierowanie do `/login` (ok. 1,5s).
  - Reset hasła (docelowo):
    - Neutralny komunikat „Jeśli konto z tym adresem istnieje, wysłaliśmy instrukcję resetu hasła” po odpowiedzi 202, niezależnie od faktycznej obecności konta.

### 1.4. Obsługa kluczowych scenariuszy po stronie UI

- **Logowanie istniejącego użytkownika**
  - Użytkownik przechodzi na `/login`, wprowadza email i hasło.
  - Formularz waliduje dane lokalnie; przy błędach pokazuje komunikat i nie wysyła żądania.
  - Przy poprawnych danych wywołuje `POST /api/auth/login`.
  - Przy odpowiedzi 200 – zapis sesji po stronie Supabase (po stronie backendu) i redirect do `/`.

- **Niepoprawne dane logowania**
  - Backend zwraca 401; formularz pokazuje komunikat o błędnych danych logowania, nie modyfikując struktury strony.

- **Rejestracja nowego użytkownika**
  - Użytkownik przechodzi na `/signup`, wypełnia formularz.
  - Formularz waliduje dane (format email, długość hasła, brak spacji na końcach).
  - `POST /api/auth/signup`:
    - 201 → UI pokazuje komunikat sukcesu i przekierowuje do `/login` po krótkim czasie.
    - 409 → komunikat o istnieniu konta.
    - 422 / 429 / 5xx → odpowiednie komunikaty błędów według mapowania powyżej.

- **Wylogowanie**
  - Kliknięcie „Wyloguj” w `Header` wysyła `POST /api/auth/logout`.
  - Przy odpowiedzi 204 UI przekierowuje na `/login` i w praktyce czyści dostęp do zasobów chronionych (fetch do API po wylogowaniu będzie zwracać 401).

- **Dostęp do widoku chronionego bez zalogowania (docelowo)**
  - SSR lub middleware wykrywa brak sesji Supabase i zwraca redirect 302 → `/login` dla żądań do `/`, `/dishes`, itp.
  - Dodatkowo, jeśli komponent React otrzyma z API odpowiedź 401 (np. w trakcie pracy aplikacji po wygaśnięciu sesji), może:
    - Albo przechwycić 401 i wykonać `window.location.href = "/login"`,
    - Albo pokazać dedykowany ekran z informacją o wygaśnięciu sesji i przyciskiem „Zaloguj ponownie”.

- **Reset hasła (docelowo)**
  - Użytkownik z ekranu logowania wybiera link „Zapomniałem hasła?” (prowadzący na `/reset-password`).
  - Wpisuje email i wysyła formularz.
  - Backend zawsze zwraca 202; UI pokazuje neutralny komunikat potwierdzający wysłanie instrukcji, bez ujawniania istnienia konta.


## 2. Logika backendowa

### 2.1. Struktura endpointów API

Wszystkie endpointy auth znajdują się w katalogu `src/pages/api/auth` i są implementowane jako routy Astro (SSR disabled przez `export const prerender = false`):

- **`POST /api/auth/signup` → `src/pages/api/auth/signup.ts`**
  - **Wejście (JSON)** – `AuthSignupCommand`:
    - `email: string`
    - `password: string`
  - **Walidacja**: `authSignupSchema` (Zod) – sprawdza poprawny email, maksymalną długość, minimalną długość hasła (≥ 8 znaków po stronie backendu), trymuje i normalizuje email do lowercase.
  - **Proces**:
    - Używa `supabase.auth.signUp({ email, password })` przez serwis `signup(supabase, command)`.
    - W przypadku duplikatu emaila rozpoznaje komunikaty Supabase i rzuca błąd z kodem `DUPLICATE_EMAIL` (status 409).
  - **Wyjście** (`201 Created`) – `AuthSignupResponse`:
    - `userId: string` (UUID użytkownika Supabase),
    - `email: string` (email użytkownika).
  - **Kody błędów**:
    - `409 Conflict` – duplikat emaila.
    - `422 Unprocessable Entity` – błędny JSON lub walidacja Zod.
    - `500 Internal Server Error` – inne błędy.

- **`POST /api/auth/login` → `src/pages/api/auth/login.ts`**
  - **Wejście (JSON)** – `AuthLoginCommand`:
    - `email: string`
    - `password: string`
  - **Walidacja**: `authLoginSchema` (Zod) – analogicznie do signup (email+hasło).
  - **Proces**:
    - Używa `supabase.auth.signInWithPassword({ email, password })` przez serwis `login(supabase, command)`.
    - Rozpoznaje błędy Supabase związane z niepoprawnymi kredencjałami (komunikaty zawierające „Invalid” / „credentials”) i mapuje na błąd `INVALID_CREDENTIALS` (401).
    - Wymusza obecność sesji (`data.session`); w przypadku jej braku rzuca błąd.
  - **Wyjście** (`200 OK`) – `AuthLoginResponse`:
    - `accessToken: string` – token JWT sesji Supabase.
    - `expiresInSec: number` – czas ważności tokenu w sekundach (domyślnie 3600, jeżeli Supabase nie zwróci innej wartości).
  - **Kody błędów**:
    - `401 Unauthorized` – niepoprawny email/hasło.
    - `422 Unprocessable Entity` – błędne/niekompletne body.
    - `500 Internal Server Error` – wszelkie inne błędy.

- **`POST /api/auth/logout` → `src/pages/api/auth/logout.ts`**
  - **Wejście**: brak body.
  - **Proces**:
    - Najpierw wywołuje `supabase.auth.getUser()`; jeśli brak użytkownika lub błąd, zwraca 401.
    - Następnie wywołuje `supabase.auth.signOut()` przez serwis `logout(supabase)`.
  - **Wyjście**:
    - `204 No Content` – zakończona sesja.
  - **Kody błędów**:
    - `401 Unauthorized` – brak aktualnej sesji.
    - `500 Internal Server Error` – błąd wylogowania.

- **`POST /api/auth/reset-password` → `src/pages/api/auth/reset-password.ts`**
  - **Wejście (JSON)** – `AuthResetPasswordCommand`:
    - `email: string`
  - **Walidacja**: `authResetPasswordSchema` (Zod) – poprawny email, normalizacja.
  - **Proces**:
    - Oblicza `redirectUrl` dla linku resetu hasła w oparciu o:
      - `import.meta.env.PUBLIC_SITE_URL` (jeśli zdefiniowany), np. `https://app.obiadex.pl/auth/callback`,
      - lub origin requestu (`new URL(context.request.url).origin`) dla lokalnego środowiska.
    - Wywołuje `supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl })` przez serwis `resetPassword`.
    - Ewentualny błąd loguje w konsoli, ale **nie rzuca wyjątku**, aby uniknąć enumeracji kont.
  - **Wyjście**:
    - Zawsze `202 Accepted` – niezależnie od tego, czy email istnieje w systemie.
  - **Kody błędów**:
    - `422 Unprocessable Entity` – błędne body (np. brak/niepoprawny email).
    - `500 Internal Server Error` – błąd spoza ścieżki „zawsze 202” (np. błąd na poziomie obsługi route’a przed wywołaniem serwisu).

### 2.2. Mechanizm walidacji danych wejściowych

- **Zod schematy (`src/lib/validation/authSchemas.ts`)**:
  - `emailSchema`:
    - `z.string().email("Invalid email format").max(255).trim().toLowerCase()` – normalizuje email na lowercase i obcina spacje.
  - `passwordSchema`:
    - `z.string().min(8, "Password must be at least 8 characters").max(256, "Password must be at most 256 characters")`.
  - `authSignupSchema`:
    - Obiekt `{ email: emailSchema, password: passwordSchema }`.
  - `authLoginSchema`:
    - Obiekt `{ email: emailSchema, password: passwordSchema }`.
  - `authResetPasswordSchema`:
    - Obiekt `{ email: emailSchema }`.
  - `authorizationHeaderSchema` (przygotowany pod przyszłe użycie):
    - Waliduje nagłówek `Authorization` w formacie `Bearer <token>`.

- **Użycie w routach**:
  - Każdy endpoint **parse’uje i waliduje JSON** przed wywołaniem serwisu:
    - Przy braku/niepoprawnym JSON zwraca `422` z komunikatem „Invalid JSON body”.
    - Przy naruszeniu schematu – `422` z listą `issues` z Zod.
  - Schematy zapewniają spójność między frontendem i backendem: UI może przyjąć takie same reguły (min 8 znaków dla hasła itp.).

### 2.3. Obsługa wyjątków i błędów

- **Warstwa serwisów (`src/lib/services/authService.ts`)**:
  - `signup`:
    - Rozpoznaje duplikaty emaili na podstawie treści błędu Supabase („already registered”, „already exists”).
    - Rzuca specjalny `Error` z właściwościami `.code = "DUPLICATE_EMAIL"` i `.status = 409`, co ułatwia mapowanie w routach.
  - `login`:
    - Rozpoznaje błędne kredencjały na podstawie treści błędu (`"Invalid"` / `"credentials"`).
    - Rzuca `Error` z `.code = "INVALID_CREDENTIALS"`, `.status = 401`.
  - `logout`:
    - Przy błędzie `supabase.auth.signOut()` rzuca wyjątek; route loguje i zwraca `500`.
  - `resetPassword`:
    - Loguje błędy resetu (`console.error`) ale ich nie rzuca – zapobiega to ujawnianiu istnienia konta.

- **Warstwa HTTP helperów (`src/lib/http/responses.ts`)** (wspomniana w routach):
  - Dostarcza funkcje typu `respondValidationError`, `respondUnauthorized`, `respondCreated`, `respondConflict`, `respondInternalError`, które:
    - Ustalają odpowiedni status HTTP.
    - Zwracają zunifikowany kształt błędu:
      - `{ "error": { "code": string, "message": string, "details"?: object } }`
      - lub wynik walidacji z Zod w polu `issues`.

- **Logowanie błędów**:
  - Wszystkie endpointy auth w bloku `catch` logują błędy z prefiksem zawierającym nazwę routa:
    - Przykład: `console.error("Error in POST /api/auth/login:", error);`
  - Ułatwia to diagnozowanie problemów w logach serwera bez ujawniania szczegółów po stronie klienta.

### 2.4. Renderowanie server‑side i integracja z `astro.config.mjs`

- **Konfiguracja Astro (`astro.config.mjs`)**:
  - `output: "server"` oraz adapter `@astrojs/node` w trybie `standalone` – całe UI renderowane SSR (bez statycznego exportu).
  - Dzięki temu możliwe jest:
    - Sprawdzanie stanu sesji Supabase w middleware/onRequest i wykonywanie redirectów przed renderowaniem strony.
    - Renderowanie stron auth i chronionych w oparciu o aktualną sesję użytkownika.

- **Middleware (`src/middleware/index.ts`)**:
  - Aktualnie:
    - Tworzy globalnego klienta Supabase (`supabaseClient` z anon key) i zapisuje go w `context.locals.supabase`:
      - `context.locals.supabase = supabaseClient;`
    - Dzięki temu wszystkie routy API i ew. SSR mogą korzystać z jednego klienta:
      - Auth: `supabase.auth.signUp`, `signInWithPassword`, `signOut`, `resetPasswordForEmail`.
      - Inne API: `supabase.from("...")` z RLS.
  - **Docelowo** (rozszerzenie pod kompletne auth):
    - Middleware powinien używać wariantu klienta Supabase związanego z **cookies/requestem** (np. `createServerClient`):
      - Pozwala to, aby `supabase.auth.getUser()` w routach API i podczas SSR zwracało bieżącego użytkownika na podstawie cookies sesyjnych.
    - Dla żądań do stron chronionych (`/`, `/dishes`, itp.) middleware lub `get` handler strony:
      - Sprawdza `supabase.auth.getUser()`.
      - W przypadku braku użytkownika – zwraca redirect 302 → `/login`.

- **Aktualizacja renderingu wybranych stron (docelowo)**:
  - **`/login`, `/signup`, `/reset-password`**:
    - Pozwalają na dostęp bez sesji.
    - Opcjonalnie: jeśli `getUser()` zwróci użytkownika, można przekierować od razu na `/` (zapobieganie „utknięciu” na logowaniu).
  - **`/` (home) i `/dishes` (chronione)**:
    - Przy braku sesji – SSR redirect do `/login` (z zachowaniem docelowego URL w query, np. `?redirect=/dishes` jeśli chcemy pamiętać zamiar użytkownika).
    - Przy obecnej sesji – standardowe renderowanie strony; dalsze zapytania do API korzystają z tego samego Supabase clienta.


## 3. System autentykacji (Supabase + Astro)

### 3.1. Ogólny model

- **Dostawca**: Supabase Auth (na bazie Postgresa z RLS).
- **Identyfikacja użytkownika**:
  - Użytkownik identyfikowany jest przez UUID (`userId`) nadawany przez Supabase (`auth.users.id`).
  - Dane domenowe (`dishes`, `tags`, `day_plans`, `events`) zawierają kolumnę `user_id` i są objęte politykami RLS `USING (user_id = auth.uid())`.
- **Sesja**:
  - Po poprawnym logowaniu Supabase tworzy sesję i token JWT (`accessToken`, `expiresInSec`).
  - Token jest wykorzystywany przez Supabase do autoryzacji zapytań do bazy oraz do identyfikacji `auth.uid()` w politykach RLS.
  - Po stronie serwera aplikacji Obiadex:
    - Endpoint `/api/auth/login` zwraca `accessToken` i `expiresInSec` do klienta.
    - Równolegle, dzięki odpowiedniej konfiguracji klienta Supabase po stronie serwera (docelowo via cookies), `supabase.auth.getUser()` w innych endpointach może zwrócić bieżącego użytkownika.

### 3.2. Rejestracja (signup)

- **Flow**:
  1. Użytkownik wysyła formularz na `/signup`.
  2. Frontend wywołuje `POST /api/auth/signup` z `email`, `password`.
  3. Endpoint:
     - Waliduje dane (Zod).
     - Woła `supabase.auth.signUp`.
     - W razie sukcesu zwraca `userId`, `email`.
  4. UI pokazuje komunikat sukcesu i przekierowuje do `/login`.

- **Bezpieczeństwo**:
  - Hasło przekazywane jest w body `POST` po HTTPS.
  - Supabase przechowuje hasło w postaci zahashowanej; aplikacja Obiadex nie przechowuje haseł.
  - Przy próbie rejestracji istniejącego emaila użytkownik otrzymuje bezpośredni, ale nieszkodliwy komunikat („Konto z tym adresem email już istnieje…”).

### 3.3. Logowanie (login)

- **Flow**:
  1. Formularz na `/login` wysyła `POST /api/auth/login` z `email`, `password`.
  2. Endpoint waliduje dane i woła `supabase.auth.signInWithPassword`.
  3. W razie sukcesu:
     - Zwraca `accessToken` i `expiresInSec` do klienta.
     - Supabase utrwala sesję (zależnie od konfiguracji klienta – cookies/token storage).
  4. UI przekierowuje na `/`.

- **Obsługa błędów**:
  - Błędne dane logowania → 401 + neutralny komunikat („Nieprawidłowe dane logowania…”).
  - Inne błędy auth (np. chwilowy błąd Supabase) → 500, ogólny komunikat o błędzie serwera.

- **Użycie tokena po stronie klienta**:
  - `accessToken` jest obecnie używany wyłącznie informacyjnie (klient nie dołącza go bezpośrednio w nagłówku `Authorization` przy kolejnych requestach).
  - Dalsze zapytania do API opierają się na sesji utrzymywanej przez Supabase (docelowo przez cookies). Specyfikacja dopuszcza rozszerzenie o model Bearer JWT (wysyłanie `Authorization: Bearer <token>` do API), ale aktualny kod wykorzystuje `supabase.auth.getUser()` po stronie serwera.

### 3.4. Wylogowanie (logout)

- **Flow**:
  1. Użytkownik klika „Wyloguj” w `Header`.
  2. Frontend wywołuje `POST /api/auth/logout`.
  3. Endpoint:
     - Sprawdza użytkownika przez `supabase.auth.getUser()`; przy braku zwraca 401.
     - Woła `supabase.auth.signOut()`.
     - Zwraca `204 No Content`.
  4. UI przekierowuje na `/login`.

- **Skutki**:
  - Sesja Supabase zostaje zakończona; kolejne wywołania API wymagają ponownego logowania.
  - Dzięki RLS w bazie, nawet jeśli klient posiada przeterminowany token, zapytania nie będą przechodzić.

### 3.5. Reset hasła

- **Flow (backend zaimplementowany, UI do dodania)**:
  1. Formularz resetu hasła (docelowo `/reset-password`) wysyła `POST /api/auth/reset-password` z `email`.
  2. Endpoint waliduje email, oblicza `redirectUrl` do strony callbacku.
  3. Wywołuje `supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl })`.
  4. Niezależnie od powodzenia – zwraca `202 Accepted`.
  5. UI pokazuje neutralny komunikat.

- **Bezpieczeństwo**:
  - Brak ujawniania informacji, czy dane konto istnieje (stały status 202).
  - Szczegóły błędów widoczne są tylko w logach serwera.

### 3.6. Ochrona danych i tras

- **Izolacja danych (RLS)**:
  - Wszystkie tabele domenowe (`dishes`, `tags`, `dish_tags`, `day_plans`, `events`) mają kolumnę `user_id` i są zabezpieczone politykami RLS per użytkownik.
  - API **nigdy nie przyjmuje `user_id` z klienta**; zamiast tego:
    - Dla operacji mutujących (np. tworzenie dania) `user.id` przekazywany jest z wyniku `supabase.auth.getUser()`.
    - Dla zapytań wybierających (np. listy dań) – RLS ogranicza widoczność danych bezpośrednio w bazie.

- **Ochrona tras UI (docelowo)**:
  - Middleware lub logika SSR stron chronionych:
    - Wykrywa brak sesji Supabase i zwraca redirect 302 do `/login`.
    - Zapobiega SSR ujawnianiu treści stron bez zalogowania.
  - Komponenty client-side (React) traktują 401 z API jako sygnał do:
    - Oczyszczenia lokalnego stanu danych,
    - Przekierowania na `/login` lub pokazania ekranu „sesja wygasła”.

- **Konfiguracja środowiskowa**:
  - `SUPABASE_URL`, `SUPABASE_KEY` – adres i klucz anon Supabase, używany po stronie serwera do tworzenia klienta.
  - `PUBLIC_SITE_URL` – używany przy generowaniu linków resetu hasła (jeśli dostępny).
  - Klucze i adresy są dostępne przez `import.meta.env` i **nie są twardo zakodowane** w kodzie.

---

Ta specyfikacja opisuje docelowy i w dużej mierze już zaimplementowany system autentykacji w Obiadex, oparty o Supabase Auth, Astro 5 i React 19. Interfejs użytkownika (formularze, layouty, komunikaty błędów) jest powiązany z backendowymi endpointami `/api/auth/*`, a ochrona danych wymuszana jest przez polityki RLS i sprawdzanie sesji po stronie serwera. Kolejnym krokiem implementacyjnym jest domknięcie brakujących elementów UI (reset hasła, pełny SSR redirect dla tras chronionych) oraz ewentualne doprecyzowanie sposobu wykorzystania tokena `accessToken` (cookies vs nagłówek `Authorization`) w kolejnych iteracjach.


