# API Endpoint Implementation Plan: Auth REST Path

## 1. Przegląd punktu końcowego

- Zakres obejmuje wszystkie operacje `/auth` opisane w `@api-plan.md` (46–89): rejestracja, logowanie, wylogowanie i reset hasła.
- Astro 5 będzie hostował cztery endpointy REST (`POST`), pełniące rolę proxy do Supabase Auth (`@.ai/tech-stack.md`).
- Celem jest ujednolicenie walidacji, DTO i logowania błędów w warstwie serwerowej oraz utrzymanie kompatybilności z Supabase RLS.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST` dla wszystkich ścieżek.
- **Struktura URL**:
  - `/auth/signup`
  - `/auth/login`
  - `/auth/logout`
  - `/auth/reset-password`
- **Parametry**:
  - Wymagane:
    - Signup/Login: body `email`, `password`.
    - Logout: header `Authorization: Bearer <JWT>`.
    - Reset password: body `email`.
  - Opcjonalne: brak (redirect URL i lokalizacja mogą być konfigurowane serwerowo, nie przyjmowane z żądań).
- **Request body**:
  - `signup`: `{ email: string, password: string }`.
  - `login`: `{ email: string, password: string }`.
  - `logout`: brak body, tylko nagłówek.
  - `reset-password`: `{ email: string }`.
- **Walidacja wejścia (zod)**:
  - Email: `z.string().email().max(255).trim().toLowerCase()`.
  - Password: `z.string().min(8).max(256)`.
  - Authorization header: `z.string().regex(/^Bearer\s.+/)`.
  - Błędy walidacji → HTTP `400`.

## 3. Wykorzystywane typy

- `AuthSignupCommand`, `AuthSignupResponse`.
- `AuthLoginCommand`, `AuthLoginResponse`.
- `AuthResetPasswordCommand`.
- Brak DTO dla logout/reset-password odpowiedzi (status-only).
- Typy importowane z `src/types.ts` w handlerach i serwisach.

## 4. Szczegóły odpowiedzi

- `/auth/signup`: `201 Created` + `AuthSignupResponse`.
- `/auth/login`: `200 OK` + `AuthLoginResponse`.
- `/auth/logout`: `204 No Content`.
- `/auth/reset-password`: `202 Accepted` (brak body, aby uniknąć ujawniania informacji).
- Błędy:
  - `400` – nieprawidłowy email/hasło/Authorization header.
  - `401` – błędne poświadczenia loginu lub brak tokenu przy logout.
  - `409` – email już istnieje podczas signup.
  - `500` – błąd Supabase/serwera (np. sieć, awaria SDK).

## 5. Przepływ danych

1. Astro endpoint w `src/pages/api/auth/*.ts` odbiera HTTP `POST`.
2. Body/Header parsowany i walidowany przez zod (umieszczony w `src/lib/validation/authSchemas.ts`).
3. Powstałe komendy przekazywane do serwisu `src/lib/services/authService.ts`, który współdzieli instancję Supabase Admin/Anon klienta (`src/lib/supabase/serverClient.ts`).
4. Serwis:
   - `signup(cmd)` → `supabase.auth.admin.createUser` (Service Role key), normalizuje DTO i emituje event log.
   - `login(cmd)` → `supabase.auth.signInWithPassword`.
   - `logout(token)` → `supabase.auth.admin.signOut(token)` lub `supabase.auth.signOut` zależnie od kontekstu.
   - `resetPassword(cmd)` → `supabase.auth.resetPasswordForEmail` z serwerowym redirect URL (np. `import.meta.env.PUBLIC_SITE_URL + "/auth/callback"`).
5. Serwis rzuca kontrolowane wyjątki (`AuthDuplicateEmailError`, `AuthInvalidCredentialsError`, itp.).
6. Handler mapuje wyjątki na statusy, serializuje JSON, dodaje nagłówki (CORS, cache-control: no-store).

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: tylko logout wymaga Bearer tokenu; weryfikacja przez Supabase.
- **Autoryzacja**: brak dodatkowych warstw (operacje publiczne), ale rate limiting/IP throttling powinny chronić przed nadużyciami.
- **Ochrona danych**: nie logować haseł; adresy email maskować (np. hash + domena) przy logowaniu zdarzeń.
- **CSRF**: żądania JSON + Bearer token → niskie ryzyko; CORS ograniczony do zaufanych originów.
- **Transport**: wymuszony HTTPS oraz HSTS.
- **Sekrety**: service key i anon key przechowywane w `import.meta.env.*`, nigdy w repo.
- **Enumeracja użytkowników**: reset password zawsze zwraca 202, niezależnie od istnienia emaila; brak szczegółowych komunikatów dla signup/login błędów.

## 7. Obsługa błędów

- Dedykowane wyjątki w `src/lib/errors/authErrors.ts`:
  - `ValidationError` → 400.
  - `AuthInvalidCredentialsError` → 401.
  - `AuthDuplicateEmailError` → 409.
  - `AuthMissingTokenError` → 401.
  - `AuthServiceError` (wrap Supabase) → 500.
- Globalny logger (`src/lib/logger.ts`) zapisuje `requestId`, `route`, `status`, `errCode`.
- Błędy krytyczne raportowane do Sentry/New Relic (jeśli dostępne); brak wymogu zapisu do dedykowanej tabeli.
- Wyjście JSON błędu: `{ "error": "string", "code": "string" }`, poza 202/204 gdzie body jest puste.

## 8. Rozważania dotyczące wydajności

- Reużywanie singletona Supabase clienta minimalizuje koszty handshake (zgodnie z zasadami w `@.cursor/rules/shared.mdc`).
- Rate limiting (Redis/Edge KV) na `/auth/signup`, `/auth/login`, `/auth/reset-password` ogranicza brute force.
- Unikać zbędnych round-tripów – każdy endpoint to pojedyncze wywołanie Supabase.
- Monitorować latencję Supabase; w razie time-outu implementować ponawianie z backoff (dla reset password).
- Body parser limit ustawić nisko (np. 10KB) – payloady są małe.

## 9. Kroki implementacji

1. **Serwis Supabase**: utworzyć `src/lib/supabase/serverClient.ts` z memoizowanym klientem admin + anon (Service Role key z env).
2. **Modele błędów**: dodać `src/lib/errors/authErrors.ts` z klasami oraz mapą statusów.
3. **Walidacja**: przygotować `src/lib/validation/authSchemas.ts` (zod) obejmujące body i nagłówki.
4. **Auth service**: zaimplementować `src/lib/services/authService.ts` z metodami `signup`, `login`, `logout`, `resetPassword`, konwersją do DTO (`src/types.ts`).
5. **Endpointy Astro**: stworzyć pliki:
   - `src/pages/api/auth/signup.ts`
   - `src/pages/api/auth/login.ts`
   - `src/pages/api/auth/logout.ts`
   - `src/pages/api/auth/reset-password.ts`
     Każdy eksportuje `POST`, używa schematów, serwisu i mapy błędów; dodaje `export const prerender = false`.
6. **Middleware/logging**: rozszerzyć `src/middleware/index.ts` o requestId, rate limiting i CORS.
7. **Testy**: napisać testy jednostkowe serwisu (mock Supabase) i integracyjne endpointów (Vitest + supertest lub Astro test runner).
8. **Konfiguracja**: udokumentować wymagane zmienne w `.env.example`, ewentualnie dodać `README` sekcję Auth API.
9. **Observability**: opcjonalnie podłączyć Sentry/New Relic w serwisie (try/catch + `captureException`).
