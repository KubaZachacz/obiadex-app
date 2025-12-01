<conversation_summary>
<decisions>

1. Kluczowe widoki: „Lista dni” (home) + „Baza dań”; tagi zarządzane wyłącznie z poziomu selecta; logowanie/rejestracja standardowo.
2. Weryfikacja dostępu po SSR: chronione widoki weryfikowane przy renderze (middleware/SSR), nie tylko kliencko.
3. Płynne przewijanie listy dni: ~7 dni na ekranie; zapytania o okna po 21 dni; prefetch przy przewijaniu.
4. date-fns jako biblioteka dat (już zainstalowana).
5. Wybór/edycja dania: UI jako dialog lub drawer (zależnie od urządzenia).
6. „Baza dań”: paginacja, wyszukiwanie, AND‑filtry tagów zgodnie z rekomendacją.
7. Usuwanie tagów globalnie z selecta: delikatne potwierdzenia, bez nadmiarowych kroków.
8. Walidacje formularzy: react-hook-form + zod.
9. Zarządzanie stanem i fetch: TanStack Query.
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
4. Okna: initial 21 dni, prefetch kolejne 21 przy ~70% scrolla, bufor ~42 (accepted).
5. Render ciągłych dni + nakładanie odpowiedzi `/day-plans` jako mapa day→dish (accepted).
6. Dialog (desktop) / Drawer (mobile) + lista z `GET /dishes?sort=usage_prio` i filtr tagów (accepted).
7. Potwierdzenie `DELETE /tags/{id}` tylko gdy `dishCount>0` (accepted).
8. Sorty: „Baza dań” `created_desc`, overlay wyboru `usage_prio`; stan w URL (accepted).
9. TanStack Query klucze i czasy życia: tags 5 min, day-plans 10 s, dishes 30 s; invalidacje po mutacjach (no strong preference; proceed).
10. A11y: focus trap, role list/listitem, klawiatura w comboboxach; błędy mapowane inline + toast; 401 redirect; Idempotency-Key dla `POST /dishes` i `PUT /day-plans/{day}` (accepted).
    </matched_recommendations>

<ui_architecture_planning_summary>
a) Główne wymagania UI

- Home: lista dni z płynnym, nieskończonym przewijaniem; widocznych ~7 dni; inteligentny prefetch (okna 21, bufor 42).
- Dzień: klik otwiera routowalny overlay (Dialog/Drawer) do wyboru/zmiany dania; wybrane danie wyświetlane w kaflu dnia.
- Baza dań: paginacja (20/stronę), debounce wyszukiwania, AND‑filtry tagów, możliwość dodania/edycji dania; tagi tworzone w locie; usuwanie tagu globalnie z selecta (z potwierdzeniem tylko gdy są powiązania).
- Auth: standardowe logowanie/rejestracja; dostęp do aplikacji wyłącznie po zalogowaniu (SSR weryfikacja).

b) Kluczowe widoki, ekrany i przepływy

- Trasy: `/` (Lista dni), overlay routowany przez `?day=YYYY-MM-DD`; `/dishes` (Baza dań); `/login`, `/signup`.
- Przepływy:
  - Lista dni → scroll → prefetch kolejnych okien → klik dnia → overlay wyboru → lista dań `usage_prio` + filtry tagów → zapis `PUT /day-plans/{day}` → odświeżenie widoku.
  - „Baza dań” → wyszukiwanie/paginacja/filtry → dodanie/edycja dania (tagi „creatable”) → zapis `POST/PUT /dishes` → invalidacje i odświeżenie.
  - Usunięcie tagu z selecta → jeśli `dishCount>0` potwierdzenie → `DELETE /tags/{id}` → odpięcie od dań → invalidacje.

c) Integracja z API i zarządzanie stanem

- Autoryzacja: SSR w `src/middleware/index.ts` (Supabase session); API z Bearer JWT.
- TanStack Query:
  - Klucze: `['day-plans', {start,end}]`, `['day-plan', day]`, `['dishes', params]`, `['tags', {withCounts}]`.
  - Cache: tags 5 min; day-plans 10 s (background refetch); dishes 30 s + keepPreviousData.
  - Mutacje: optymistyczny update dla `PUT /day-plans/{day}`; invalidacje po `POST/PUT /dishes`, `DELETE /tags`.
  - Idempotencja: `Idempotency-Key` dla `POST /dishes` i `PUT /day-plans/{day}`.
- Walidacje: react-hook-form + zod (lokalne reguły zgodne z PRD); 422 mapowane do pól; 409 (duplikaty tagów) z komunikatem o normalizacji.
- Dane dni: ciąg generowany po kliencie (date-fns), „day” jako `YYYY‑MM‑DD` w lokalnej TZ.

d) Responsywność, dostępność i bezpieczeństwo

- Responsywność: mobile‑first (Tailwind 4), wirtualizacja listy dni, FAB dla dodania dania/dish.
- A11y: role list/listitem, focus trap, obsługa klawiatury w Dialog/Drawer i comboboxach; czytelne empty states.
- Bezpieczeństwo: SSR redirect na `/login` przy braku sesji; RLS po stronie DB; UI nie przyjmuje `user_id`; błędy 401/404/409/422/429 obsługiwane przewidywalnie.
- Stack UI: Astro 5 + React 19; shadcn/ui (`Dialog`, `Drawer`, `Button`, `Input`, „creatable” combobox na tagi).

e) Nierozwiązane lub do potwierdzenia (drobne doprecyzowania)

- Finalny próg prefetch (przy ~70% scrolla) i rozmiary okien/buforów — obecnie wg rekomendacji, można doprecyzować po testach.
- Dokładna treść i styl potwierdzenia usunięcia tagu (krótko i nieinwazyjnie).
- Ustalony kształt deep‑linków overlayu (param vs hash); przyjęto `?day=YYYY-MM-DD`, do potwierdzenia.
- DST/edge cases dla lokalnej TZ (np. dni „skracane/wydłużane”) — przyjąć prostą normalizację i testy e2e.

</ui_architecture_planning_summary>

<unresolved_issues>

1. Potwierdzenie ostatecznego formatu deep‑linku overlayu (`?day=` vs dedykowana trasa).
2. Parametry prefetch (dokładny próg, rozmiary okien) — pozostawione do kalibracji po prototypie.
3. Dokładne kopie komunikatów a11y/błędów i potwierdzeń — do ustalenia w UI copy.
4. Testy zachowania dni w zmianach czasu (DST) — do zaplanowania.
   </unresolved_issues>
   </conversation_summary>
