<conversation_summary>
<decisions>

1. Kluczowe widoki: „Lista dni” (home) + „Baza dań”; tagi zarządzane wyłącznie z poziomu selecta; logowanie/rejestracja standardowo.
2. Weryfikacja dostępu po SSR: chronione widoki weryfikowane przy renderze (middleware/SSR), nie tylko kliencko.
3. Nawigacja tygodniowa: widok tygodniowy z nawigacją poprzedni/następny tydzień; desktop pokazuje 3 tygodnie (21 dni), mobile pokazuje 1 tydzień z prefetchem ±2 dni; zapytania o okna dat w zakresie prefetch.
4. date-fns jako biblioteka dat (już zainstalowana).
5. Wybór/edycja dania: UI jako dialog lub drawer (zależnie od urządzenia).
6. „Baza dań”: paginacja, wyszukiwanie, AND‑filtry tagów zgodnie z rekomendacją.
7. Usuwanie tagów globalnie z selecta: delikatne potwierdzenia, bez nadmiarowych kroków.
8. Walidacje formularzy: react-hook-form + zod.
9. Zarządzanie stanem i fetch: natywny fetch z React hooks (useState, useEffect, useCallback); brak TanStack Query.
10. Obsługa błędów i idempotencja: zgodnie z rekomendacjami (401/404/409/422/429; Idempotency-Key).
11. Overlay wyboru/edycji dania routowalny (deep‑link) — zaakceptowane.
12. SSR‑weryfikacja wszystkich widoków poza auth — zaakceptowane.
13. Strefa czasowa i „day” po lokalnej TZ; wysyłka YYYY‑MM‑DD — zaakceptowane.
14. Okna ładowania i prefetch — zaakceptowane.
15. Render ciągłych dni klientem + overlay danych z /day-plans — zaakceptowane.
16. Wzorzec Dialog (desktop) / Drawer (mobile) — zaakceptowane.
17. Potwierdzenie usunięcia tagu tylko gdy ma powiązania — zaakceptowane.
18. Domyślne sorty: dishes (created_desc), wybór dnia (usage_prio) — zaakceptowane.
19. Cache/synchronizacja — bez preferencji („whatever”), można przyjąć rekomendowane wartości.
20. A11y i standardy błędów — zaakceptowane.
    </decisions>

<matched_recommendations>

1. Routowalny overlay wyboru/edycji dania z `?day=YYYY-MM-DD` (accepted).
2. SSR auth w `src/middleware/index.ts` z redirectem do `/login` (accepted).
3. date-fns + „day” w lokalnej TZ użytkownika (accepted).
4. Okna: desktop prefetch ±1 tydzień od widocznego tygodnia (3 tygodnie = 21 dni), mobile prefetch ±2 dni od widocznego tygodnia (11 dni); bufor w pamięci jako mapa day→dish (accepted).
5. Render tygodniowy klientem + nakładanie odpowiedzi `/day-plans` jako mapa day→dish (accepted).
6. Dialog (desktop) / Drawer (mobile) + lista z `GET /dishes?sort=usage_prio` i filtr tagów (accepted).
7. Potwierdzenie `DELETE /tags/{id}` tylko gdy `dishCount>0` (accepted).
8. Sorty: „Baza dań” `created_desc`, overlay wyboru `usage_prio`; stan w URL (accepted).
9. Zarządzanie cache: ręczne zarządzanie stanem przez useState/useEffect; refetch po mutacjach; brak TanStack Query (no strong preference; proceed).
10. A11y: focus trap, role list/listitem, klawiatura w comboboxach; błędy mapowane inline + toast; 401 redirect; Idempotency-Key dla `POST /dishes` i `PUT /day-plans/{day}` (accepted).
    </matched_recommendations>

<ui_architecture_planning_summary>
a) Główne wymagania UI

- Home: widok tygodniowy z nawigacją poprzedni/następny tydzień; desktop pokazuje 3 tygodnie (21 dni) w układzie siatki, mobile pokazuje 1 tydzień w kolumnie; prefetch ±1 tydzień (desktop) lub ±2 dni (mobile).
- Dzień: klik otwiera routowalny overlay (Dialog/Drawer) z dwoma trybami: "view" (szczegóły przypisanego dania) i "edit" (wybór/zmiana dania); wybrane danie wyświetlane w kaflu dnia.
- Baza dań: paginacja (20/stronę), debounce wyszukiwania, AND‑filtry tagów, możliwość dodania/edycji dania; tagi tworzone w locie; usuwanie tagu globalnie z selecta (z potwierdzeniem tylko gdy są powiązania).
- Auth: standardowe logowanie/rejestracja; dostęp do aplikacji wyłącznie po zalogowaniu (SSR weryfikacja).

b) Kluczowe widoki, ekrany i przepływy

- Trasy: `/` (Lista dni - widok tygodniowy), overlay routowany przez `?day=YYYY-MM-DD`; `/dishes` (Baza dań); `/dishes/[dishId]/edit` (edycja dania); `/login`, `/signup`.
- Przepływy:
  - Lista dni → nawigacja tygodniowa (poprzedni/następny) → prefetch okien dat → klik dnia → overlay (tryb "view" jeśli plan istnieje, "edit" jeśli nie) → lista dań `usage_prio` + filtry tagów → zapis `PUT /day-plans/{day}` → odświeżenie widoku.
  - „Baza dań” → wyszukiwanie/paginacja/filtry → dodanie/edycja dania (tagi „creatable”) → zapis `POST/PUT /dishes` → invalidacje i odświeżenie.
  - Usunięcie tagu z selecta → jeśli `dishCount>0` potwierdzenie → `DELETE /tags/{id}` → odpięcie od dań → invalidacje.

c) Integracja z API i zarządzanie stanem

- Autoryzacja: SSR w `src/middleware/index.ts` (Supabase session); API z Bearer JWT.
- Zarządzanie stanem: natywny fetch z React hooks (useState, useEffect, useCallback); brak TanStack Query.
  - Cache: ręczne zarządzanie stanem; mapa day→dish w pamięci; refetch po mutacjach.
  - Mutacje: refetch po `PUT /day-plans/{day}`, `POST/PUT /dishes`, `DELETE /tags`.
  - Idempotencja: `Idempotency-Key` dla `POST /dishes` i `PUT /day-plans/{day}`.
- Walidacje: react-hook-form + zod (lokalne reguły zgodne z PRD); 422 mapowane do pól; 409 (duplikaty tagów) z komunikatem o normalizacji.
- Dane dni: tygodnie generowane po kliencie (date-fns), „day” jako `YYYY‑MM‑DD` w lokalnej TZ.

d) Responsywność, dostępność i bezpieczeństwo

- Responsywność: mobile‑first (Tailwind 4), układ siatki tygodniowej (desktop: 3 kolumny tygodni, mobile: 1 kolumna), FAB dla dodania dania/dish.
- A11y: role list/listitem, focus trap, obsługa klawiatury w Dialog/Drawer i comboboxach; czytelne empty states.
- Bezpieczeństwo: SSR redirect na `/login` przy braku sesji; RLS po stronie DB; UI nie przyjmuje `user_id`; błędy 401/404/409/422/429 obsługiwane przewidywalnie.
- Stack UI: Astro 5 + React 19; shadcn/ui (`Dialog`, `Drawer`, `Button`, `Input`, „creatable” combobox na tagi).

e) Nierozwiązane lub do potwierdzenia (drobne doprecyzowania)

- Finalne rozmiary okien prefetch (obecnie desktop: ±1 tydzień, mobile: ±2 dni) — można doprecyzować po testach.
- Dokładna treść i styl potwierdzenia usunięcia tagu (krótko i nieinwazyjnie).
- Ustalony kształt deep‑linków overlayu (param vs hash); przyjęto `?day=YYYY-MM-DD`, zaimplementowane.
- DST/edge cases dla lokalnej TZ (np. dni „skracane/wydłużane”) — przyjąć prostą normalizację i testy e2e.

</ui_architecture_planning_summary>

<unresolved_issues>

1. Potwierdzenie ostatecznego formatu deep‑linku overlayu (`?day=` vs dedykowana trasa) — zaimplementowano `?day=YYYY-MM-DD`.
2. Parametry prefetch (dokładny próg, rozmiary okien) — zaimplementowano desktop: ±1 tydzień, mobile: ±2 dni; można doprecyzować po testach.
3. Dokładne kopie komunikatów a11y/błędów i potwierdzeń — do ustalenia w UI copy.
4. Testy zachowania dni w zmianach czasu (DST) — do zaplanowania.
   </unresolved_issues>
   </conversation_summary>
