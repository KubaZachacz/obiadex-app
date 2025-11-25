# Obiadex – plan schematu bazy danych (PostgreSQL)

## 1. Lista tabel z kolumnami, typami danych i ograniczeniami

### `dishes`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 80)`
- `recipe_text text CHECK (char_length(recipe_text) <= 2000)`
- `url text CHECK (char_length(url) <= 255)`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

### `tags`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 30)`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- **Ograniczenia:** unikalność `(user_id, name)` (wartości zapisywane w lowercase w warstwie aplikacji).

### `dish_tags`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id uuid NOT NULL`
- `dish_id uuid NOT NULL`
- `tag_id uuid NOT NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- **Klucze obce:**
  - `(user_id, dish_id)` REFERENCES `dishes(user_id, id)` ON DELETE CASCADE
  - `(user_id, tag_id)` REFERENCES `tags(user_id, id)` ON DELETE CASCADE
- **Ograniczenia:** unikalność `(dish_id, tag_id)`; `user_id` spójne z rekordami nadrzędnymi dzięki złożonym FK.

### `day_plans`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `day date NOT NULL`
- `dish_id uuid NOT NULL REFERENCES dishes(id) ON DELETE CASCADE`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- **Ograniczenia:** unikalność `(user_id, day)` – tylko jeden wpis dziennie.

### `events`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `event_type text NOT NULL CHECK (event_type IN ('dish_added', 'day_planned'))`
- `payload jsonb NOT NULL DEFAULT '{}'::jsonb`
- `created_at timestamptz NOT NULL DEFAULT now()`

## 2. Relacje między tabelami

- `auth.users 1:N dishes` (każde danie należy do dokładnie jednego użytkownika).
- `auth.users 1:N tags`.
- `dishes M:N tags` poprzez `dish_tags`.
- `dishes 1:N day_plans` (dzień wskazuje wybrane danie).
- `dishes 1:N events` (pośrednio przez `dish_added` oraz `day_planned` w payload).
- `auth.users 1:N day_plans` (tylko dni z przypisanym daniem są zapisywane).
- `auth.users 1:N events`.

## 3. Indeksy

- `dishes_user_created_idx` na `(user_id, created_at DESC)` – szybkie listy użytkownika.
- `dishes_name_trgm_idx` GIN (`gin_trgm_ops`) na `name` – wyszukiwanie fragmentów (wymaga rozszerzenia `pg_trgm`).
- `tags_user_name_idx` unikalny `(user_id, name)` – enforce unikalności tagów.
- `dish_tags_tag_dish_idx` na `(user_id, tag_id, dish_id)` – filtrowanie po tagach (logika AND).
- `dish_tags_dish_tag_idx` na `(user_id, dish_id, tag_id)` – szybkie pobieranie tagów dania.
- `day_plans_user_day_idx` unikalny `(user_id, day)` – egzekwuje pojedynczy plan na dzień oraz wspiera infinite scroll.
- `day_plans_usage_idx` na `(user_id, dish_id, day DESC)` – sortowanie dań wg ostatniego użycia.
- `events_user_created_idx` na `(user_id, created_at DESC)` – zapytania analityczne.
- (Opcja) `profiles_user_idx` na `(user_id)` – redundantny, jeśli `user_id` jest PK.

## 4. Zasady PostgreSQL (RLS)

RLS włączone na wszystkich tabelach należących do użytkownika (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`):

- **Polityki SELECT/INSERT/UPDATE/DELETE** dla `dishes`, `tags`, `dish_tags`, `day_plans`, `events`, `profiles`:
  - `USING (user_id = auth.uid())`
  - `WITH CHECK (user_id = auth.uid())`
- Dodatkowo, w `dish_tags` złożone FK wymuszają spójność `user_id` bez konieczności dodatkowych triggerów.
- Brak polityk na `auth.users` (zarządzane przez Supabase).

## 5. Uwagi projektowe

- Wszystkie tabele korzystają z `gen_random_uuid()` (wymaga rozszerzenia `pgcrypto`).
- `updated_at` aktualizowane przez trigger (np. `updated_at = now()` w `BEFORE UPDATE`) lub logikę aplikacji.
- `payload` w `events` przechowuje minimalne dane (`dish_id`, `tags_count`, `date`), przy czym błędy zapisu eventu nie blokują operacji użytkownika.
- Wyszukiwanie po nazwie oraz filtrowanie po wielu tagach powinno zawsze zawierać warunki `user_id`, aby wykorzystać indeksy.
- UI generuje „puste” dni – tabela `day_plans` przechowuje wyłącznie dni z przypisanym daniem; usunięcie dania automatycznie czyści powiązane dni dzięki `ON DELETE CASCADE`.

