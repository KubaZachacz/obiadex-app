# Plan implementacji widoku Nakładka dodawania/edycji dania

## 1. Przegląd
Routowalny dialog/drawer (`/dishes/new`, `/dishes/:id/edit`) umożliwia tworzenie i edycję dań wraz z tagami. Walidacje zgodne z PRD (name 3–80, tag 2–30, recipe_text ≤2000, url ≤255). Wykorzystuje `/api/dishes` (POST/PUT/GET), `/api/tags` oraz integruje usuwanie tagu (DELETE `/api/tags/{id}`) po odpięciu w multi-select.

## 2. Routing widoku
- Ścieżki: `/dishes/new`, `/dishes/:id/edit` (nakładka na `/dishes` lub wywołana z nakładki dnia).
- Zamknięcie: powrót do `/dishes` lub poprzedniego URL, bez reloadu.

## 3. Struktura komponentów
- `Dialog/Drawer` z nagłówkiem (Dodaj/Edytuj danie) i przyciskiem zamknięcia.
- `DishForm` (react-hook-form + zod) zawierający pola: `name`, `tags[]` (creatable), `recipe_text` (textarea), `url` (input type=url).
- `TagCreatableCombobox` z możliwością usuwania tagu (global delete) i normalizacją do lowercase.
- `FormMessage/Toast` dla błędów 409/422/404/429.
- `Footer` z przyciskami `Zapisz` i `Anuluj`.

## 4. Szczegóły komponentów
### DishForm
- Opis: formularz tworzenia/edycji; inicjalizuje dane przy edycji (`GET /api/dishes/{id}`), mapuje typy DTO.
- Elementy: Input name, TagCreatableCombobox, Textarea recipe_text, Input url, helper teksty z limitami, checkbox/CTA do usunięcia tagu (opcjonalny confirm), przyciski akcji.
- Interakcje: submit → POST/PUT; tworzenie tagów w locie (Enter/Comma); usuwanie tagu z multi-select -> wywołanie DELETE `/api/tags/{id}` z potwierdzeniem gdy `dishCount>0`.
- Walidacja: zod schema zgodna z PRD; `url` optional z max 255, `recipe_text` max 2000; co najmniej 1 tag.
- Typy: `DishCreateCommand`, `DishUpdateCommand`, `DishDetailResponse`, `TagDTO`, `TagListResponse` z `src/types.ts`.
- Propsy: `mode: "create"|"edit"`, `dishId?`, `initialData?`, `onSuccess(dishId)`, `onCancel()`.

### TagCreatableCombobox
- Opis: multi-select pozwalający tworzyć tagi i usuwać je globalnie przy odpięciu.
- Elementy: input z chipsami, dropdown z istniejącymi tagami, opcja „Utwórz tag „...”” (lowercase).
- Interakcje: create -> POST `/api/tags`; select/deselect -> aktualizacja formularza; deselect istniejącego tagu -> opcjonalny confirm i DELETE `/api/tags/{id}`.
- Walidacja: długość tagu 2–30; normalizacja do lowercase; unikalność (409) → komunikat „Tag już istnieje, został użyty”.
- Typy: `TagDTO`, `TagCreateCommand`, `TagDeleteResult`.
- Propsy: `value: TagDTO[]`, `onChange(tags)`, `onCreate(name)`, `onDelete(tag)`.

## 5. Typy
- DTO: `DishCreateCommand`, `DishUpdateCommand`, `DishDetailResponse`, `TagDTO`, `TagListResponse`, `TagDeleteResult`.
- ViewModel: `DishFormValues` { name: string; tags: TagDTO[]; recipe_text?: string; url?: string }.
- Schema: Zod odpowiadający walidacjom PRD; mapuje do DTO przed wysyłką (`tagNames` lub `tagIds`).

## 6. Zarządzanie stanem
- `react-hook-form` z resolverem Zod dla walidacji synchronicznej.
- `useEffect` ładuje dane przy edycji (`GET /api/dishes/{id}`) i ustawia default values.
- Flagi: `isSubmitting`, `isLoadingDish`, `tagActionLoading`. Po sukcesie reset formularza (create) lub zostaw dane (edit) i zamknij nakładkę.

## 7. Integracja API
- `GET /api/dishes/{id}` (`src/pages/api/dishes/[dishId]/index.ts`) do wstępnego załadowania.
- `POST /api/dishes` (`src/pages/api/dishes/index.ts`) przy tworzeniu; body `DishCreateCommand` (z `tagNames` lub `tagIds`).
- `PUT /api/dishes/{id}` (`src/pages/api/dishes/[dishId]/index.ts`) przy edycji; body `DishUpdateCommand`.
- `POST /api/tags` / `DELETE /api/tags/{id}` dla operacji na tagach (`src/pages/api/tags/index.ts`, `src/pages/api/tags/[tagId].ts`).
- Obsługa 201/200 sukcesu, 404 (danie/tag nie istnieje), 409 (duplikat tagu), 422 (walidacja), 429/5xx.

## 8. Interakcje użytkownika
- Dodawanie tagu wpisaniem i Enter → tworzenie + dodanie do listy.
- Odpięcie tagu: jeśli tag ma `dishCount>0`, pokaż confirm "Usunąć tag ze wszystkich dań?" przed DELETE.
- Klik "Zapisz" → POST/PUT; sukces zamyka nakładkę i odświeża listę dań / nakładkę dnia.
- Klik "Anuluj" lub zamknięcie dialogu → nawigacja do poprzedniej trasy.

## 9. Warunki i walidacja
- name 3–80, wymagany; min 1 tag; tag 2–30, lowercase; recipe_text ≤2000; url ≤255 i poprawny format.
- Przy edycji weryfikować, że `dishId` z URL jest dostępny; 404 → komunikat + zamknięcie.

## 10. Obsługa błędów
- 409 przy tagu: pokaż info i użyj istniejącego tagu.
- 422: pokaż błędy pól inline.
- 404: komunikat + zamknij nakładkę; 401: redirect do `/login`.
- 429/5xx: toast + opcja "Spróbuj ponownie".

## 11. Kroki implementacji
1) Utworzyć routowalne nakładki `/dishes/new` i `/dishes/:id/edit` z Dialog/Drawer, pamiętając o focus trap i zamykaniu do `/dishes`.
2) Zaimplementować `DishForm` z Zod + react-hook-form, polami i helperami limitów.
3) Dodać integrację tagów (create + delete) w `TagCreatableCombobox` z normalizacją do lowercase i confirm przed DELETE.
4) Podłączyć POST/PUT/GET endpointy; mapować DTO do `tagNames`/`tagIds`; obsłużyć komunikaty błędów.
5) Na sukces emitować refetch listy dań i (jeśli otwarta) nakładki dnia; dodać ręczne QA scenariuszy walidacji.
