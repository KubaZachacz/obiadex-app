# Plan implementacji widoku Logowanie

## 1. Przegląd
Widok logowania umożliwia uwierzytelnienie użytkownika przed dostępem do listy dni (`/`). Wspiera podstawowe walidacje formularza, obsługę błędów 401/422 z `/api/auth/login` oraz linki do rejestracji i (opcjonalnie) resetu hasła.

## 2. Routing widoku
- Ścieżka: `/login`
- Po sukcesie: redirect do `/`.
- Niezalogowani kierowani tutaj przez middleware/SSR.

## 3. Struktura komponentów
- `AuthPageLayout` → shell z tytułem, krótkim opisem i linkiem do `/signup`.
- `AuthForm(Login)` → formularz z polami `email`, `password`, CTA "Zaloguj się", sekcją komunikatów.
- `FormMessage/Toast` → informacja o błędach (401/422) i sukcesie.

## 4. Szczegóły komponentów
### AuthPageLayout
- Opis: kontener strony auth, ustawia max-width, spacing i link do rejestracji.
- Elementy: nagłówek, slot na formularz, link do `/signup`, opcjonalnie do `/reset-password`.
- Interakcje: klikalne linki; brak własnych zdarzeń.
- Walidacja: brak (deleguje do dziecka).
- Typy: żadnych własnych; przekazuje children.
- Propsy: `title: string`, `subtitle?: string`, `children: ReactNode`, `secondaryLink: { href: string; label: string }[]`.

### AuthForm(Login)
- Opis: obsługuje wpis e-mail/hasło, walidacje klienta, wywołanie `/api/auth/login`.
- Elementy: `Input(email)`, `Input(password type=password)`, `Button`, `FormMessage`.
- Interakcje: submit (POST), focus management, enter to submit.
- Walidacja: email format, hasło min 6? (jeśli PRD nie wymaga, zostaw tylko required). Błędy serwera mapowane na komunikaty ogólne ("Nieprawidłowe dane logowania").
- Typy: `AuthLoginCommand`, `AuthLoginResponse` z `src/types.ts`.
- Propsy: `onSuccess?: () => void` (domyślnie redirect), `defaultEmail?: string`.

### FormMessage/Toast
- Opis: jednolity komponent statusu.
- Elementy: ikona statusu, tekst.
- Interakcje: zamknięcie (opcjonalnie auto-hide po sukcesie).
- Walidacja: brak.
- Typy: `status: "error" | "success" | "info"`, `message: string`.
- Propsy: jw.

## 5. Typy
- DTO z `src/types.ts`: `AuthLoginCommand`, `AuthLoginResponse`.
- ViewModel: `LoginFormState` { `email`, `password`, `isSubmitting`, `error?: string` }.

## 6. Zarządzanie stanem
- Lokalny `useState`/`useReducer` lub `react-hook-form`. Flagi `isSubmitting`, `error`, `fieldErrors` (opcjonalnie z Zod). Po sukcesie czyszczenie błędów i redirect.

## 7. Integracja API
- Endpoint: `POST /api/auth/login` (z Postman: `Obiadex_API.postman_collection.json`, ścieżka auth/login; implementacja w `src/pages/api/auth/login.ts`).
- Request body: `AuthLoginCommand` { email, password }.
- Response: 200 -> `AuthLoginResponse` z tokenem; 401/422 -> komunikat.
- Obsługa: fetch z `credentials: "omit"`, zapamiętać token via Supabase session (jeśli SDK używane globalnie).

## 8. Interakcje użytkownika
- Wypełnienie pól, klik "Zaloguj się" lub Enter → spinner + disable przycisku.
- Link "Załóż konto" → `/signup`; "Reset hasła" (opcjonalny) → `/reset-password` lub flow Supabase.

## 9. Warunki i walidacja
- Required `email`, `password`; email regex, brak pustego hasła.
- Błędy 401/422: pokaż w `FormMessage` pod przyciskiem.

## 10. Obsługa błędów
- 401/422: komunikat ogólny "Sprawdź dane logowania".
- 429/5xx: "Spróbuj ponownie za chwilę".
- Network/JSON: fallback komunikat, reset `isSubmitting`.

## 11. Kroki implementacji
1) Dodać trasę `/login` w Astro/React z `AuthPageLayout`.
2) Zaimplementować `AuthForm(Login)` z walidacją klienta i wywołaniem `/api/auth/login`.
3) Dodać obsługę komunikatów (success/error) i redirect do `/` po sukcesie.
4) Spiąć linki do `/signup` i opcjonalnego resetu; zapewnić focus management i a11y (labels, `aria-live`).
