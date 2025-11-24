# Dokument wymagań produktu (PRD) - Obiadex

## 1. Przegląd produktu

Obiadex to prosta aplikacja webowa, która pomaga użytkownikom szybko odpowiadać na pytanie „co na obiad?”. Umożliwia stworzenie prywatnej bazy ulubionych dań i ręczne planowanie jednego dania na każdy dzień, z opcjonalnym filtrowaniem po tagach oraz z priorytetyzacją rzadziej wybieranych potraw. Projekt jest celowo uproszczony, przeznaczony na zaliczenie i nie aspiruje do produkcyjnego użycia na tym etapie.

Zakres MVP obejmuje:

1. Uwierzytelnianie i konta oparte w całości na Supabase Auth (rejestracja, logowanie, wylogowanie; opcjonalnie reset hasła).
2. Prywatna baza dań użytkownika z polami: name, tags[], opcjonalne recipe_text i url; edycja dań; brak UI do usuwania.
3. Historia/plan dni z możliwością przypisania jednego dania do dnia oraz podglądem minionych i nadchodzących dni (infinite scroll w przód i w tył).
4. Widok „Baza dań” z listą paginowaną, możliwością dodawania i edycji, podstawowym wyszukiwaniem po nazwie oraz filtrowaniem po tagach (multi-select, logika AND).
5. Prosta nawigacja: po zalogowaniu ekranem startowym jest lista dni; FAB „+” do dodawania dań na liście dni i w widoku dnia; link do widoku „Baza dań”.
6. Podstawowa responsywność na desktop i mobile.
7. Minimalna analityka: zliczanie dodanych dań i zaplanowanych dni poprzez proste eventy.

Grupa docelowa:

1. Pracujący single potrzebujący prostego sposobu planowania i różnicowania obiadów bez dużego nakładu czasu.
2. Rodziny z dziećmi planujące posiłki z wyprzedzeniem (np. tydzień), chcące wybierać dania z własnej, rosnącej bazy (lista zakupów poza MVP).

Założenia technologiczne i organizacyjne:

1. Aplikacja webowa, wymagająca zalogowania do korzystania z danych użytkownika.
2. Brak rozbudowanego zarządzania kontem poza mechanizmami dostarczanymi przez Supabase.
3. Minimalne wymagania niefunkcjonalne: sensowna responsywność, brak krytycznych błędów, rozsądny czas ładowania.

## 2. Problem użytkownika

Codzienne decydowanie „co na obiad?” zużywa czas i energię decyzyjną. Użytkownicy chcą mieć:

1. Prywatną listę sprawdzonych dań, do której łatwo dopisywać nowe pozycje.
2. Prosty mechanizm wyboru dania na konkretny dzień bez konieczności rozbudowanego planowania.
3. Możliwość filtrowania po własnych tagach oraz wsparcie w unikaniu ciągłego powtarzania tych samych potraw (priorytetyzacja rzadziej wybieranych).

## 3. Wymagania funkcjonalne

3.1. Uwierzytelnianie i konta

1. Rejestracja, logowanie i wylogowanie w oparciu o Supabase Auth.
2. Opcjonalnie reset hasła, jeśli dostępny out of the box.
3. Brak dodatkowego panelu zarządzania kontem (poza mechanizmami Supabase).
4. Dostęp do aplikacji i danych wyłącznie po zalogowaniu.
5. Dane są prywatne per użytkownik; użytkownik nie widzi danych innych użytkowników.

3.2. Baza dań

1. Pola dania: name (wymagane), tags[] (co najmniej 1 wymagany tag), opcjonalne recipe_text, opcjonalny url.
2. Dodawanie i edycja dań w tym samym formularzu; zmiana nazwy od razu widoczna wszędzie (np. na liście dni).
3. Tagi są tworzone przez użytkownika w locie (wpis → zatwierdzenie, np. Enter) i przypisywane do dania.
4. Nazwy tagów muszą być unikalne w obrębie użytkownika z unikalnością case-insensitive; przy zapisie normalizacja do lowercase.
5. Usunięcie tagu z komponentu multi-select powoduje usunięcie tagu z systemu użytkownika i odpięcie go od wszystkich jego dań.
6. Brak UI do usuwania dań w MVP; jeśli danie zostanie usunięte administracyjnie, jest odpinane od dni.
7. Walidacje pól:
   a) name: 3–80 znaków,
   b) tag: 2–30 znaków,
   c) recipe_text: maks. 2000 znaków,
   d) url: maks. 255 znaków.
8. Widok „Baza dań”: lista paginowana (np. 20 pozycji na stronę), wyszukiwanie po nazwie (fragment), filtrowanie po tagach (multi-select, wyniki muszą zawierać wszystkie wybrane tagi).
9. Pusty stan: jasny komunikat, gdy brak dań.

3.3. Historia obiadów / plan dni

1. Lista dni z infinite scroll w przód i w tył; każdy dzień może mieć przypisane jedno danie lub brak.
2. Kliknięcie dnia otwiera formularz przypisania dania na ten dzień, z opcjonalnym filtrem po tagu.
3. Użytkownik ręcznie wybiera danie z listy i zapisuje.
4. Logika sortowania listy wyboru dania:
   a) najpierw dania nigdy niewybrane (brak historii użycia),
   b) następnie dania użyte dawno temu (rosnąco po dacie ostatniego użycia),
   c) na końcu dania użyte ostatnio (malejąco po dacie ostatniego użycia).
5. Jeśli baza dań jest pusta, użytkownik widzi informację o konieczności dodania dania.
6. Zmiana przypisanego dania w dniu nadpisuje poprzedni wybór.

3.4. Nawigacja i entry pointy

1. Po zalogowaniu ekranem startowym (home) jest lista dni.
2. Na liście dni:
   a) widoczny FAB „+” do dodania dania,
   b) link do widoku „Baza dań”.
3. W widoku pojedynczego dnia:
   a) ten sam FAB „+” do dodania nowego dania w trakcie planowania.

3.5. Analityka (minimalna)

1. Event dish_added z parametrami: user_id, dish_id, tags_count.
2. Event day_planned z parametrami: user_id, date, dish_id.
3. Wystarczające jest utrzymanie danych eventów w bazie i prosta agregacja.

3.6. UX i responsywność

1. Podstawowa responsywność na urządzenia mobilne i desktop.
2. Prosty, czytelny empty state w miejscach bez danych (brak dań, brak wyników filtrów).

3.7. Bezpieczeństwo i prywatność

1. Dostęp do danych tylko po zalogowaniu.
2. Dane są izolowane per użytkownik; brak dostępu do cudzych danych.
3. Brak publicznego udostępniania treści w MVP.

## 4. Granice produktu

Poza zakresem MVP:

1. Współdzielenie w ramach rodzin i role użytkowników.
2. Import/eksport danych (CSV, PDF itp.).
3. Widok kalendarza w siatce miesiąca z drag and drop.
4. Zaawansowane planowanie (np. gotowanie na kilka dni, różnorodność algorytmiczna).
5. Model składników, lista zakupów, przeliczanie porcji, kalorii.
6. Publiczne udostępnianie treści i wyszukiwarka publiczna.
7. Powiadomienia i integracje zewnętrzne.
8. Aplikacje mobilne natywne (na start tylko web).
9. UI do usuwania dań (logika usunięcia istnieje, ale nie ma UI w MVP).
10. Rozbudowane zarządzanie kontem poza mechanizmami Supabase.
11. Sformalizowane wymagania niefunkcjonalne poza zdroworozsądkowymi.

Założone uproszczenia:

1. Minimalna analityka i brak dashboardów.
2. Brak wielostopniowych ról i uprawnień.
3. Brak automatycznego planowania; tylko ręczny wybór z listy.

## 5. Historyjki użytkowników

US-001
Tytuł: Rejestracja konta
Opis: Jako nowy użytkownik chcę utworzyć konto, aby korzystać z mojej prywatnej bazy dań i planowania.
Kryteria akceptacji:

- Formularz przyjmuje poprawny email i hasło; po wysłaniu konto zostaje utworzone i użytkownik może się zalogować.
- Dla istniejącego emaila pojawia się czytelny komunikat o błędzie.
- Niepoprawny email lub zbyt słabe hasło zwracają komunikat walidacyjny.
- Po rejestracji użytkownik widzi możliwość przejścia do logowania lub jest automatycznie zalogowany, zależnie od konfiguracji Supabase.

US-002
Tytuł: Logowanie
Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do moich danych.
Kryteria akceptacji:

- Poprawne dane logowania skutkują zalogowaniem i przejściem do listy dni.
- Błędne dane logowania zwracają czytelny komunikat o błędzie bez ujawniania szczegółów bezpieczeństwa.
- Po zalogowaniu dostępne są wyłącznie zasoby użytkownika.

US-003
Tytuł: Wylogowanie
Opis: Jako zalogowany użytkownik chcę móc się wylogować.
Kryteria akceptacji:

- Wylogowanie kończy sesję i usuwa dostęp do zasobów chronionych.
- Po wylogowaniu próba wejścia w chronione widoki kieruje do logowania.

US-004
Tytuł: Reset hasła
Opis: Jako użytkownik, który zapomniał hasła, chcę je zresetować, jeśli jest to dostępne w Supabase.
Kryteria akceptacji:

- Użytkownik może wysłać żądanie resetu na swój email.
- Po poprawnym procesie hasło można ustawić ponownie.
- Błędy procesu resetu wyświetlane są w przyjaznej formie.

US-010
Tytuł: Dodanie pierwszego dania i tagu
Opis: Jako nowy użytkownik chcę dodać pierwsze danie z co najmniej jednym nowym tagiem.
Kryteria akceptacji:

- Formularz wymaga pola name i co najmniej 1 tagu.
- Wpisanie nowego tagu i zatwierdzenie tworzy tag i przypisuje go do dania.
- Po zapisaniu dania licznik analityczny dish_added jest rejestrowany z tags_count.

US-011
Tytuł: Dodanie dania z wieloma tagami
Opis: Jako użytkownik chcę dodać danie z kilkoma tagami, tworząc tagi w locie.
Kryteria akceptacji:

- Można dodać kilka tagów, każdy powstaje i przypisuje się po zatwierdzeniu.
- Jeśli tag o tej samej nazwie (różny case) już istnieje, system wykorzystuje istniejący po normalizacji do lowercase.

US-012
Tytuł: Walidacje pól dania
Opis: Jako użytkownik chcę otrzymywać jasne komunikaty walidacyjne przy błędnych danych dania.
Kryteria akceptacji:

- name krótsze niż 3 lub dłuższe niż 80 znaków jest odrzucane z komunikatem.
- każdy tag krótszy niż 2 lub dłuższy niż 30 znaków jest odrzucany z komunikatem.
- recipe_text dłuższy niż 2000 znaków jest odrzucany z komunikatem.
- url dłuższy niż 255 znaków jest odrzucany z komunikatem.

US-013
Tytuł: Unikalność i normalizacja tagów
Opis: Jako użytkownik chcę, aby tagi były unikalne per konto i normalizowane.
Kryteria akceptacji:

- tagi są unikalne case-insensitive; próba dodania duplikatu skutkuje użyciem istniejącego lub komunikatem.
- wszystkie tagi są zapisywane w lowercase niezależnie od wpisanego case.

US-014
Tytuł: Usunięcie tagu z systemu użytkownika
Opis: Jako użytkownik chcę usunąć tag poprzez zdjęcie go z komponentu multi-select.
Kryteria akceptacji:

- zdjęcie tagu z dania skutkuje jego usunięciem z systemu użytkownika,
- tag zostaje automatycznie odpięty od innych dań użytkownika,
- brak błędów dla dań, które traciły tag.

US-015
Tytuł: Edycja dania
Opis: Jako użytkownik chcę edytować nazwę, tagi i pola opcjonalne dania.
Kryteria akceptacji:

- edycja wykorzystuje ten sam formularz co dodawanie,
- zmiana nazwy jest od razu widoczna na liście dni i w innych miejscach,
- walidacje pól działają identycznie jak przy dodawaniu.

US-016
Tytuł: Lista dań z paginacją, wyszukiwaniem i filtrami
Opis: Jako użytkownik chcę przeglądać listę wszystkich moich dań i szybko znaleźć potrzebne.
Kryteria akceptacji:

- lista jest paginowana (np. 20 pozycji na stronę) z możliwością przewijania stron,
- wyszukiwanie po fragmencie nazwy zawęża wyniki,
- filtr po tagach (multi-select) zwraca dania posiadające wszystkie wybrane tagi (logika AND),
- puste wyniki prezentują czytelny komunikat.

US-017
Tytuł: Pusty stan bazy dań
Opis: Jako użytkownik bez dań chcę zobaczyć jasny komunikat i CTA do dodania dania.
Kryteria akceptacji:

- widok „Baza dań” pokazuje komunikat, gdy brak pozycji,
- dostępny jest FAB „+” do szybkiego dodania pierwszego dania.

US-020
Tytuł: Ekran startowy lista dni (infinite scroll)
Opis: Jako zalogowany użytkownik chcę przeglądać dni w przód i w tył bez ograniczeń kalendarzowych.
Kryteria akceptacji:

- po zalogowaniu wyświetla się lista dni jako home,
- infinite scroll ładuje kolejne porcje dni zarówno w przód, jak i wstecz,
- każdy dzień prezentuje datę i ewentualnie przypisane danie.

US-021
Tytuł: Otwarcie dnia i filtrowanie po tagu
Opis: Jako użytkownik chcę otworzyć wybrany dzień i zawęzić listę dań po tagach.
Kryteria akceptacji:

- otwarcie dnia pokazuje listę dań z opcjonalnym filtrem po tagu,
- zastosowanie filtra ogranicza listę do dań posiadających wybrane tagi,
- puste wyniki mają czytelny komunikat.

US-022
Tytuł: Przypisanie dania do dnia
Opis: Jako użytkownik chcę ręcznie wybrać jedno danie i zapisać je dla dnia.
Kryteria akceptacji:

- zapis powoduje widoczność wyboru na liście dni,
- event day_planned zostaje zarejestrowany z parametrami user_id, date, dish_id,
- zapis można wykonać tylko, gdy w bazie istnieją dania.

US-023
Tytuł: Pusty stan dnia bez dań w bazie
Opis: Jako użytkownik bez dań w bazie chcę wiedzieć, że muszę najpierw dodać danie.
Kryteria akceptacji:

- po kliknięciu dnia bez istniejących dań wyświetla się komunikat informujący o konieczności dodania dania,
- dostępny jest FAB „+” do szybkiego dodania.

US-024
Tytuł: Sortowanie listy wyboru dania według historii użycia
Opis: Jako użytkownik chcę, aby lista wyboru promowała dania rzadziej wybierane.
Kryteria akceptacji:

- dania nigdy niewybrane są na górze listy,
- następnie dania sortowane rosnąco po dacie ostatniego użycia,
- najniżej znajdują się dania użyte ostatnio (najbardziej świeża data),
- dla jednakowej daty użycia obowiązuje stabilne sortowanie alfabetyczne po name.

US-025
Tytuł: Zmiana przypisanego dania
Opis: Jako użytkownik chcę móc zmienić danie przypisane do dnia.
Kryteria akceptacji:

- ponowny zapis nadpisuje poprzedni wybór,
- lista dni od razu prezentuje zaktualizowaną nazwę dania.

US-026
Tytuł: Zachowanie po administracyjnym usunięciu dania
Opis: Jako użytkownik chcę, aby po usunięciu dania poza UI historia nie pokazywała już tej pozycji.
Kryteria akceptacji:

- po usunięciu dania jest ono odpinane od wszystkich dni użytkownika,
- w historii nie widać pustych placeholderów ani błędów.

US-027
Tytuł: FAB „+” na liście dni i w widoku dnia
Opis: Jako użytkownik chcę mieć szybki dostęp do dodawania dania.
Kryteria akceptacji:

- FAB jest widoczny i dostępny na liście dni i w widoku dnia,
- kliknięcie otwiera formularz dodawania dania.

US-028
Tytuł: Rejestrowanie eventów analitycznych
Opis: Jako właściciel produktu chcę zliczać dodane dania i zaplanowane dni.
Kryteria akceptacji:

- zapis dania emituje event dish_added z tags_count,
- przypisanie dania do dnia emituje event day_planned z date,
- błędy zapisu eventów nie blokują akcji użytkownika.

US-029
Tytuł: Izolacja danych użytkownika
Opis: Jako użytkownik chcę mieć pewność, że nikt nie zobaczy moich danych.
Kryteria akceptacji:

- zapytania i widoki zwracają wyłącznie dane zalogowanego użytkownika,
- próba dostępu do cudzych zasobów kończy się błędem/odmową.

US-030
Tytuł: Ochrona tras i dostęp tylko po zalogowaniu
Opis: Jako niezalogowany użytkownik nie powinienem widzieć zasobów prywatnych.
Kryteria akceptacji:

- wejście na chronione widoki wymaga zalogowania,
- niezalogowany użytkownik jest kierowany do ekranu logowania.

US-031
Tytuł: Responsywność interfejsu
Opis: Jako użytkownik mobilny chcę wygodnie korzystać z aplikacji.
Kryteria akceptacji:

- kluczowe widoki (lista dni, dzień, baza dań, formularze) skalują się poprawnie na typowych szerokościach mobilnych i desktopowych,
- elementy interfejsu nie nachodzą na siebie, a akcje są łatwo dostępne.

## 6. Metryki sukcesu

1. Użytkownik ma wypełnione co najmniej 7 dni historii/planów w pierwszym miesiącu korzystania.
2. Mediana co najmniej 20 dań dodanych na użytkownika w pierwszym tygodniu.
3. Minimalne eventy i sposób mierzenia:
   a) dish_added (user_id, dish_id, tags_count),
   b) day_planned (user_id, date, dish_id),
   c) możliwość prostego zliczania tych eventów zapytaniami.
4. Dodatkowe sygnały jakościowe (opcjonalne):
   a) odsetek użytkowników, którzy dodali co najmniej 1 danie w pierwszej sesji,
   b) czas do dodania pierwszego dania po rejestracji,
   c) liczba sesji, w których zaplanowano co najmniej 1 dzień.
