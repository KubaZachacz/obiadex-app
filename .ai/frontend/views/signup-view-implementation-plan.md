# Plan implementacji widoku Rejestracja

## 1. Przegląd
Widok rejestracji tworzy konto w oparciu o Supabase Auth via `/api/auth/signup`, zapewnia walidacje pól i komunikaty o duplikacie emaila. Po sukcesie kieruje do `/login` lub automatycznie loguje zgodnie z konfiguracją.

## 2. Routing widoku
- Ścieżka: `/signup`
- Po sukcesie: redirect do `/login` (lub `/` przy auto-loginie).

## 3. Struktura komponentów
- `AuthPageLayout` (reuse z logowania) z linkiem powrotnym do `/login`.
- `AuthForm(Signup)` z polami `email`, `password`, zgody (opcjonalnie), CTA "Załóż konto".
- `FormMessage/Toast` dla błędów/confirmacji.

## 4. Szczegóły komponentów
### AuthForm(Signup)
- Opis: Formularz tworzący konto; waliduje dane, pokazuje błędy 409/422 z API.
- Elementy: `Input(email)`, `Input(password type=password)`, `Button`, `FormMessage`, link do logowania.
- Interakcje: submit -> POST `/api/auth/signup`, focus na pierwsze pole z błędem.
- Walidacja: email format, hasło minimalne (zgodnie z polityką Supabase, np. ≥6); required.
- Typy: `AuthSignupCommand`, `AuthSignupResponse` (`src/types.ts`).
- Propsy: `onSuccess?: () => void`, `defaultEmail?: string`.

### FormMessage/Toast
- Reuse z logowania, statusy success/error.

## 5. Typy
- DTO: `AuthSignupCommand`, `AuthSignupResponse`.
- ViewModel: `SignupFormState` { email, password, isSubmitting, error?, fieldErrors? }.

## 6. Zarządzanie stanem
- `react-hook-form` + Zod (opcjonalnie) lub `useState`. Flagi: `isSubmitting`, `error`, `fieldErrors`. Ustaw focus na błędach.

## 7. Integracja API
- Endpoint: `POST /api/auth/signup` (Postman kolekcja; implementacja `src/pages/api/auth/signup.ts`).
- Request: `AuthSignupCommand` { email, password }.
- Response: 201 -> `AuthSignupResponse`; 409 gdy email istnieje (mapuj na czytelny komunikat); 422 dla walidacji.

## 8. Interakcje użytkownika
- Uzupełnienie formularza → klik "Załóż konto" lub Enter.
- Po sukcesie: banner "Sprawdź email" (jeśli wymagane) + redirect.
- Link "Masz konto? Zaloguj się" → `/login`.

## 9. Warunki i walidacja
- Required `email`, `password`; email regex; hasło min długość (zgodnie z polityką Supabase); brak spacji w emailu (trim).

## 10. Obsługa błędów
- 409: "Konto z tym emailem już istnieje".
- 422: pokaż błędy pól; 401/5xx: komunikat ogólny + możliwość retry.

## 11. Kroki implementacji
1) Stworzyć stronę `/signup` reuse `AuthPageLayout`.
2) Zaimplementować `AuthForm(Signup)` z walidacjami i POST do `/api/auth/signup`.
3) Obsłużyć redirect/komunikat po sukcesie; dołączyć link do `/login`.
4) Dodać testy ręczne: błędny email, zbyt krótkie hasło, duplikat emaila.
