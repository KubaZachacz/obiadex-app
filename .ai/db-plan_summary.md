<conversation_summary>
<decisions>

1. Przechowujemy tylko dni z przypisanym daniem; „puste” dni pochodzą z kalendarza/UI.
2. Dopuszczamy duplikaty nazw dań w MVP (brak unikalności nazwy per użytkownik).
3. Usunięcie tagu z dania lub poprzez „trash” usuwa go globalnie (dla całego konta) i odpina od wszystkich dań.
4. Normalizacja tagów do lowercase i logika unikalności case-insensitive realizowane w backendzie (nie w DB).
5. Wyszukiwanie nazw dań ma wspierać dowolny fragment (substring).
6. Lista wyboru dania ma być sortowana według ostatniego użycia na podstawie historii (maksymalna data w „planie dni” per danie).
7. Zdarzenia analityczne: brak preferencji – akceptowalne minimalne podejście.
8. RLS ma być włączone dla danych użytkownika.
9. Reprezentacja dnia i strefa czasowa – „tak, żeby było dobrze” (pozostawione do dobrej praktyki).
10. Klucze, indeksy i zachowanie przy usunięciach – „sensible defaults”.
    </decisions>

<matched_recommendations>

1. Encje: dishes, tags, dish_tags, day_plans, events; bazować na Supabase `auth.users` jako źródle użytkowników.
2. `day_plans`: przechowywać tylko wpisy z daniem; kolumna `day` typu date; unikalność `(user_id, day)`; FK do `dishes(id)` z `ON DELETE CASCADE`; indeks `(user_id, day)`.
3. `tags`: backend dostarcza znormalizowane lowercase; w DB unikalność `(user_id, name)`; długości przez CHECK (2–30). Globalne usunięcie: `tags → dish_tags` z `ON DELETE CASCADE`.
4. `dish_tags`: dodać `user_id` i wymusić własność przez złożone FK: `(user_id, dish_id) → dishes(user_id, id)` oraz `(user_id, tag_id) → tags(user_id, id)`; unikalność `(dish_id, tag_id)`; indeksy `(tag_id, dish_id)` i `(dish_id, tag_id)` dla filtrów AND.
5. Wyszukiwanie: włączyć `pg_trgm` i GIN na `dishes.name` (substring search); zapytania `ILIKE '%q%'` filtrowane `user_id`.
6. Sortowanie według ostatniego użycia: LEFT JOIN do agregacji `day_plans` z `MAX(day) BY dish_id`; indeks `(user_id, dish_id, day)`; ewentualnie później cache `last_used_at`/`times_used`.
7. Walidacje: `dishes.name` 3–80, `recipe_text` ≤2000, `url` ≤255 (CHECK); typy: `text` z CHECK lub `varchar(n)`.
8. Klucze: `uuid` PK z `gen_random_uuid()`; na wszystkich tabelach `created_at/updated_at timestamptz DEFAULT now()`.
9. RLS: polityki `SELECT/INSERT/UPDATE/DELETE` z `user_id = auth.uid()`; `WITH CHECK` na INSERT/UPDATE; w `dish_tags` prostsza polityka dzięki `user_id` w wierszu i złożonym FK.
10. Analityka: minimalna tabela `events(user_id, type, payload jsonb, created_at)`; indeks `(user_id, created_at)`; RLS włączone; partycjonowanie rozważyć dopiero przy dużym wolumenie.
    </matched_recommendations>

<database_planning_summary>
a. Główne wymagania schematu:

- Dane prywatne per użytkownik, dostępne tylko po zalogowaniu (RLS).
- Przechowywanie tylko faktycznie zaplanowanych dni z daniem; UI generuje „puste” dni.
- Tagi globalne per użytkownik, unikalne i znormalizowane w backendzie; usunięcie ma globalny efekt.
- Wyszukiwanie po fragmencie nazwy; sortowanie listy wyboru według historii użycia.

b. Kluczowe encje i relacje:

- `dishes (1)` ←→ `(N) day_plans` (FK `ON DELETE CASCADE`, unikalne `(user_id, day)`).
- `dishes (M)` ←→ `(N) tags` przez `dish_tags` (z `user_id` w wierszu i złożonymi FK, unikalne `(dish_id, tag_id)`).
- `users (auth.users)` ma relacje 1:N do `dishes`, `tags`, `day_plans`, `events` przez `user_id`.
- `events` niezależne logicznie, służą do prostego logowania akcji.

c. Bezpieczeństwo i skalowalność:

- RLS na wszystkich tabelach z `user_id = auth.uid()`; `WITH CHECK` na INSERT/UPDATE.
- Indeksy pod krytyczne ścieżki: `day_plans(user_id, day)`, `day_plans(user_id, dish_id, day)`, `dish_tags(tag_id, dish_id)`, `dishes` GIN trigram na `name` + btree `(user_id, created_at)`.
- Typy `uuid` z `gen_random_uuid()`; znaczniki czasu `timestamptz`.
- Brak partycjonowania na start; rozważyć dla `events` przy dużym wolumenie.

d. Nierozwiązane operacje i edge cases (ujęte jako „sensible defaults”):

- Dzień jako `date` (TZ w logice aplikacji); `created_at/updated_at` w `timestamptz`.
- Brak soft-delete dla `dishes`; administracyjne usunięcie usuwa także powiązane `day_plans` (konsystencja wymogu „tylko dni z daniem”).
- Backend egzekwuje lowercase i unikalność tagów; DB nie używa `citext` ani triggerów normalizujących.
  </database_planning_summary>

<unresolved_issues>

1. Retencja i wolumen `events` (TTL, archiwizacja, ewentualne partycjonowanie w przyszłości).
2. Czy przechowywać ustawienia profilu (np. strefa czasowa) w osobnej tabeli `profiles` dla poprawnej interpretacji `date` po stronie backendu?
3. Czy walidacje długości mają być także wymuszane w DB (CHECK) czy wyłącznie w backendzie?
4. Łączenie filtrowania po wielu tagach z wyszukiwaniem po nazwie: docelowe limity (maks. liczba tagów w filtrze) i oczekiwania wydajnościowe.
5. Ewentualna potrzeba soft-delete dla `tags`/`dishes` w przyszłości (MVP: brak).
   </unresolved_issues>
   </conversation_summary>
