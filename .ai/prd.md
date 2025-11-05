# Dokument wymagań produktu (PRD) - Obiadex

## 1. Przegląd produktu

Obiadex to prosta webowa aplikacja PWA pomagająca układać plan obiadów z własnej bazy dań użytkownika. Celem jest szybkie planowanie bez złożonej logistyki: użytkownik dodaje swoje dania (nazwę, opcjonalny opis i URL), a wbudowane AI generuje skrócony opis i 2–3 tagi. Na podstawie bazy dań aplikacja generuje propozycje obiadów dla wybranego zakresu dni, respektując zasady antypowtórzeniowe. Historia pozwala przeglądać przeszłe i przyszłe dni, edytować, podmieniać i usuwać wpisy.

Zakres MVP koncentruje się na:

- rejestracji/logowaniu i usuwaniu konta,
- zarządzaniu własną bazą dań i tagami,
- jednorazowej generacji AI opisu i tagów dla dania,
- generatorze planu obiadów dla zakresu dat z regułami antypowtórzeń,
- historii obiadów z prostą edycją,
- prostych reklamach nieblokujących kluczowych flow.

Technologia i hosting:

- Frontend: Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + shadcn/ui (RWD, PWA)
- Backend i baza danych: Supabase (PostgreSQL + Authentication)
- AI: OpenAI GPT-4o-mini lub Google Gemini Flash (tani model)
- Hosting: Supabase (backend) + Vercel/Netlify (frontend)

Monetyzacja (faza testowa):

- darmowa aplikacja z reklamami (Google AdSense), z potencjalnym pakietem premium do wyłączenia reklam w przyszłości.

Lokalizacja: polski interfejs, format dat DD.MM.YYYY.

## 2. Problem użytkownika

Codzienne wymyślanie obiadu jest czasochłonne i męczące. Użytkownicy chcą szybko ułożyć prosty plan z własnych, lubianych dań, bez skomplikowanych przepisów, list zakupów czy planowania posiłków na wiele dni z góry. Potrzebują narzędzia, które:

- uprości katalogowanie ulubionych dań i ich podstawowe otagowanie,
- pomoże automatycznie wygenerować plan na wybrany zakres dni z minimalnym wysiłkiem,
- ułatwi korekty i logowanie faktycznie zjedzonych obiadów,
- zredukuje powtarzalność dań w krótkim okresie.

## 3. Wymagania funkcjonalne

3.1. Konta użytkowników i bezpieczeństwo

- Rejestracja i logowanie: e-mail/hasło (Supabase Auth). Opcjonalnie OAuth: Google i Facebook, jeśli dostępne i opłacalne.
- Wylogowanie i utrzymanie sesji zgodnie z mechanizmami Supabase.
- Usuwanie konta: trwałe usunięcie wszystkich danych użytkownika (GDPR-compliant).
- Separacja danych: użytkownik widzi i edytuje wyłącznie własne dane.

  3.2. Baza dań użytkownika

- Struktura dania: name (wymagane), tags[] (opcjonalne, multiselect), recipe_text (opcjonalnie krótki opis), url (opcjonalny link do przepisu).
- Operacje: dodawanie, edycja, usuwanie.
- Tagowanie: wolny tekst z multiselect autocomplete na bazie tagów użytych wcześniej przez danego użytkownika; możliwość dodania nowego tagu w miejscu.

  3.3. AI – generacja opisu i tagów

- Dostawca: GPT-4o-mini lub Gemini Flash (tanie modele).
- Trigger: pojedynczy przycisk po wpisaniu nazwy dania (1 generacja na danie w MVP).
- Wynik: krótki opis (2–3 zdania) i 2–3 tagi (użytkownik może edytować przed zapisem).
- Ochrona: throttling i anti-spam po stronie API; komunikaty o błędach dla użytkownika; brak wielokrotnej regeneracji w MVP.

  3.4. Generator planu obiadów

- Interfejs: wybór zakresu dat (od–do), jeden loader na całą generację.
- Logika:
  - dni z już przypisanymi pomysłami są pomijane,
  - opcjonalnie można wskazać oczekiwany tag dla konkretnego dnia w zakresie,
  - wykorzystanie dania z tagiem wymaga, aby w bazie istniało ≥1 danie z tym tagiem.
- Zasady antypowtórzeń:
  - jedno danie maksymalnie raz w tygodniu (pon–ndz),
  - co najmniej 10 dni karencji od ostatniego wystąpienia dania,
  - łamanie zasad dopuszczalne przy deficycie dań (szczególnie w wąskich tagach), z informacją ostrzegawczą.
- Wynik: propozycje zapisane do historii w zakresie dat; możliwość późniejszej edycji pozycji.

  3.5. Historia obiadów

- Lista chronologiczna ze wszystkimi dniami (w tym puste), z infinite scroll.
- Filtr: „z daniem” / „bez dania”.
- Edycje z poziomu historii:
  - wymiana pomysłu na inne danie z listy,
  - dodanie pomysłu do pustego dnia,
  - prośba o nową generację AI dla konkretnego dnia,
  - usuwanie wpisu (dzień wraca do pustego).
- Rekomendacja: przed nową generacją zachęta do weryfikacji ostatnich wpisów dla lepszych wyników algorytmu.

  3.6. Reklamy

- Format: banery AdSense nieblokujące kluczowych działań.
- Umiejscowienie: sticky banner na dole (mobile) lub sidebar (desktop) w widoku listy dań; w historii co 7–10 pozycji.
- Zakazy: brak reklam podczas dodawania dania, generowania planu, onboardingu.

  3.7. PWA i RWD

- Aplikacja mobil-first, działająca jako PWA; responsywne layouty dla głównych widoków.

  3.8. Lokalizacja i formaty

- Język polski; format dat DD.MM.YYYY.

  3.9. Walidacje i komunikaty błędów

- Próba generacji planu bez dań w bazie.
- Wybór tagu, dla którego brak dań w bazie.
- Niewystarczająca pula dań do wypełnienia zakresu bez łamania zasad (komunikat ostrzegawczy + możliwe częściowe łamanie zasad).
- Awaria API AI: komunikat, opcjonalny retry, zachowanie spójności danych.

## 4. Granice produktu

4.1. W zakresie MVP

- Konta użytkowników: rejestracja, logowanie, usuwanie konta.
- Baza dań (tylko obiady) z tagami i opcjonalnym opisem/URL.
- Jednorazowa generacja AI opisu i tagów.
- Generator planu z zasadami antypowtórzeń i opcjonalnymi preferencjami tagów.
- Historia z listą dni, filtrem, edycjami i infinite scroll.
- Reklamy nieinwazyjne w wybranych widokach.
- PWA, RWD, polska lokalizacja, format DD.MM.YYYY.

  4.2. Poza zakresem MVP

- Współdzielenie w „rodzinach” i role użytkowników.
- Import/eksport (CSV, PDF), drukowanie.
- Widok kalendarza (grid miesiąca), drag&drop.
- Zaawansowany model częstotliwości i gotowanie „na kilka dni”.
- Składniki, lista zakupów, przeliczanie porcji, kalorii.
- Publiczne udostępnianie treści, wyszukiwarka publiczna.
- Powiadomienia, integracje zewnętrzne.
- Aplikacje mobilne native.
- Analityka produktowa i zaawansowane statystyki użycia dań.

  4.3. Założenia i ograniczenia

- Koszty AI minimalizowane przez wybór tanich modeli i throttling.
- Brak limitu liczby dań w wersji darmowej.
- Iteracyjna generacja odbywa się po stronie backendu; w UI pojedynczy loader.

## 5. Historyjki użytkowników

US-001
Tytuł: Rejestracja e-mail/hasło
Opis: Jako nowy użytkownik chcę założyć konto przez e-mail/hasło, aby zacząć korzystać z aplikacji.
Kryteria akceptacji:

- Formularz przyjmuje poprawny e-mail i silne hasło; walidacje błędów są czytelne.
- Po rejestracji i weryfikacji (jeśli wymagana) użytkownik jest zalogowany lub przekierowany do logowania.
- Dane konta tworzą izolowaną przestrzeń danych.

US-002
Tytuł: Logowanie e-mail/hasło
Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do swoich danych.
Kryteria akceptacji:

- Prawidłowe dane logują; błędne dane zwracają komunikat bez ujawniania szczegółów.
- Sesja jest utrzymywana zgodnie z konfiguracją Supabase.

US-003
Tytuł: Logowanie przez Google
Opis: Jako użytkownik chcę logować się kontem Google, aby szybciej rozpocząć korzystanie.
Kryteria akceptacji:

- Logowanie OAuth przez Google działa end-to-end.
- Przy pierwszym logowaniu tworzone jest konto powiązane z danymi użytkownika.

US-004
Tytuł: Wylogowanie
Opis: Jako zalogowany użytkownik chcę się wylogować, aby zakończyć sesję na urządzeniu.
Kryteria akceptacji:

- Kliknięcie „Wyloguj” kończy sesję i przenosi do ekranu logowania.

US-005
Tytuł: Reset hasła (e-mail)
Opis: Jako użytkownik, który zapomniał hasła, chcę ustawić nowe hasło przez e-mail.
Kryteria akceptacji:

- Wysłanie linku resetu na podany e-mail (jeśli konto istnieje) i komunikat o powodzeniu.
- Ustawienie nowego hasła umożliwia ponowne logowanie.

US-006
Tytuł: Usunięcie konta i danych
Opis: Jako użytkownik chcę trwale usunąć konto wraz ze wszystkimi danymi, aby przestać korzystać z usługi.
Kryteria akceptacji:

- Ekran potwierdzenia informuje o nieodwracalności operacji.
- Po potwierdzeniu wszystkie dane użytkownika są nieodwracalnie usunięte.

US-007
Tytuł: Pusty stan po rejestracji
Opis: Jako nowy użytkownik chcę zobaczyć jasny pusty stan z CTA do dodania pierwszego dania.
Kryteria akceptacji:

- Widoczny komunikat i przycisk „Dodaj pierwsze danie”.

US-008
Tytuł: Dodanie dania
Opis: Jako użytkownik chcę dodać danie z nazwą oraz opcjonalnie opisem i URL.
Kryteria akceptacji:

- Nazwa jest wymagana; formularz waliduje pola.
- Zapis powoduje pojawienie się dania w liście.

US-009
Tytuł: Generacja AI opisu i tagów
Opis: Jako użytkownik chcę jednym kliknięciem otrzymać opis i tagi na podstawie nazwy dania, aby szybciej uzupełnić dane.
Kryteria akceptacji:

- Po kliknięciu generacji AI wypełnia 2–3 zdania opisu i 2–3 tagi.
- Użytkownik może edytować wynik przed zapisem.
- Throttling błędów jest komunikowany wprost (spróbuj ponownie później).

US-010
Tytuł: Edycja dania
Opis: Jako użytkownik chcę edytować istniejące danie, aby poprawić nazwę, opis, tagi lub URL.
Kryteria akceptacji:

- Zmiany zapisują się i są widoczne w liście i generatorze.

US-011
Tytuł: Usunięcie dania
Opis: Jako użytkownik chcę usunąć danie, którego już nie używam.
Kryteria akceptacji:

- Potwierdzenie usunięcia; po usunięciu danie znika z listy i nie jest dobierane przez generator.

US-012
Tytuł: Zarządzanie tagami inline
Opis: Jako użytkownik chcę dodawać nowe tagi w polu multiselect i usuwać istniejące z dania.
Kryteria akceptacji:

- Autocomplete podpowiada wcześniej użyte tagi użytkownika.
- Dodanie nowego tagu jest możliwe bez wychodzenia z formularza.

US-013
Tytuł: Generacja planu dla zakresu dat
Opis: Jako użytkownik chcę wygenerować propozycje obiadów dla wybranego zakresu dat.
Kryteria akceptacji:

- Wybór dat od–do jest obowiązkowy i walidowany.
- Dni z już przypisanymi pomysłami są pomijane.
- Po zakończeniu generacji wynik pojawia się w historii.

US-014
Tytuł: Preferencja tagu dla dnia
Opis: Jako użytkownik chcę przypisać oczekiwany tag do konkretnego dnia w zakresie (np. „ryba” na piątek).
Kryteria akceptacji:

- Generator dobiera danie z wymaganym tagiem, jeśli istnieje w bazie.
- Jeśli brak dania z tagiem, użytkownik otrzymuje jasny komunikat przed uruchomieniem generacji.

US-015
Tytuł: Pomijanie dni już zaplanowanych
Opis: Jako użytkownik nie chcę nadpisań istniejących wpisów w historii podczas generacji.
Kryteria akceptacji:

- Dni z istniejącym wpisem pozostają bez zmian; są wyłączone z generacji.

US-016
Tytuł: Zasady antypowtórzeń i ich łamanie przy deficycie
Opis: Jako użytkownik chcę, aby generator nie powtarzał dania częściej niż raz w tygodniu i zachowywał 10 dni karencji, chyba że brakuje opcji.
Kryteria akceptacji:

- Standardowo spełnione: 1×/tydzień oraz ≥10 dni karencji.
- Przy deficycie generator może złamać zasady, ale wyświetla ostrzeżenie.

US-017
Tytuł: Ręczna podmiana dania w planie
Opis: Jako użytkownik chcę ręcznie zamienić zaproponowane danie na inne z mojej bazy.
Kryteria akceptacji:

- Dropdown z listą dań pozwala na wybór zastępnika.
- Zmiana zapisuje się w historii.

US-018
Tytuł: Usunięcie pozycji z dnia
Opis: Jako użytkownik chcę usunąć przypisane danie z konkretnego dnia.
Kryteria akceptacji:

- Po usunięciu dzień staje się pusty.

US-019
Tytuł: Historia z filtrem i infinite scroll
Opis: Jako użytkownik chcę przeglądać historię wszystkich dni z opcjonalnym filtrem i płynnym ładowaniem.
Kryteria akceptacji:

- Lista obejmuje puste i wypełnione dni.
- Filtr „z daniem”/„bez dania” działa poprawnie.
- Infinite scroll doładowuje kolejne porcje.

US-020
Tytuł: Korekta przeszłego wpisu
Opis: Jako użytkownik chcę skorygować przeszłe danie na to faktycznie ugotowane.
Kryteria akceptacji:

- Edycja w historii umożliwia wybranie innego dania z bazy i zapis.

US-021
Tytuł: Dodanie dania do pustego dnia
Opis: Jako użytkownik chcę ręcznie dodać danie do pustego dnia z historii.
Kryteria akceptacji:

- Formularz dodania z listą dań zapisuje wpis.

US-022
Tytuł: Regeneracja propozycji AI dla dnia
Opis: Jako użytkownik chcę poprosić o nową propozycję AI dla konkretnego dnia.
Kryteria akceptacji:

- Po wywołaniu AI proponuje nowe danie z mojej bazy (respektując zasady jak możliwe).
- W razie błędu AI pojawia się komunikat i możliwość ponowienia.

US-023
Tytuł: Przypomnienie o weryfikacji przed generacją
Opis: Jako użytkownik chcę zostać zachęcony do weryfikacji ostatnich wpisów przed kolejną generacją.
Kryteria akceptacji:

- Przed startem generacji pojawia się nienachalny komunikat rekomendujący weryfikację historii.

US-024
Tytuł: Obsługa błędów AI
Opis: Jako użytkownik chcę jasnych komunikatów, gdy AI nie działa lub limit został przekroczony.
Kryteria akceptacji:

- Komunikaty rozróżniają błąd chwilowy, limit i inne problemy.
- UI nie pozostaje w stanie zawieszenia; można ponowić akcję lub wrócić.

US-025
Tytuł: Reklamy nieinwazyjne
Opis: Jako użytkownik chcę, aby reklamy nie przeszkadzały w kluczowych działaniach.
Kryteria akceptacji:

- Reklamy pojawiają się w liście dań i historii (co 7–10 pozycji).
- Brak reklam podczas dodawania dania, generacji planu i onboardingu.

US-026
Tytuł: PWA i RWD
Opis: Jako użytkownik mobilny chcę wygodnie korzystać z aplikacji na telefonie oraz opcjonalnie zainstalować PWA.
Kryteria akceptacji:

- Widoki są responsywne; PWA przechodzi podstawowe checki instalowalności.

US-027
Tytuł: Lokalizacja i format dat
Opis: Jako użytkownik w Polsce chcę interfejsu po polsku i dat w formacie DD.MM.YYYY.
Kryteria akceptacji:

- Cały UI jest po polsku; daty wyświetlane jako DD.MM.YYYY.

US-028
Tytuł: Throttling i informowanie użytkownika
Opis: Jako użytkownik chcę jasnych informacji, gdy osiągam limity wywołań AI.
Kryteria akceptacji:

- W razie przekroczenia limitu UI informuje o czasie oczekiwania lub próbie później.

US-029
Tytuł: Izolacja danych i autoryzacja
Opis: Jako użytkownik chcę mieć pewność, że nikt poza mną nie zobaczy moich dań i historii.
Kryteria akceptacji:

- Zapytania i operacje zwracają wyłącznie rekordy danego użytkownika.
- Próby dostępu do cudzych zasobów są odrzucane.

US-030
Tytuł: Responsywność widoków kluczowych
Opis: Jako użytkownik chcę wygodnej obsługi listy dań, generatora i historii na różnych rozmiarach ekranu.
Kryteria akceptacji:

- Brak poziomego scrolla; elementy kluczowe są dostępne i czytelne.

US-031
Tytuł: Walidacja „brak dań w bazie”
Opis: Jako użytkownik chcę jasnego komunikatu, gdy próbuję generować plan bez dań w bazie.
Kryteria akceptacji:

- Przycisk generacji jest zablokowany lub pojawia się komunikat z linkiem/CTA do dodania dań.

US-032
Tytuł: Walidacja „brak dań dla tagu”
Opis: Jako użytkownik chcę wiedzieć, że wybrany tag nie ma przypisanych dań.
Kryteria akceptacji:

- UI informuje o braku dań z tagiem i nie pozwala wystartować generacji z tym wymogiem.

US-033
Tytuł: Ostrzeżenie „niewystarczająca pula dań”
Opis: Jako użytkownik chcę ostrzeżenia, gdy zakres dat może wymusić złamanie zasad antypowtórzeń.
Kryteria akceptacji:

- Przed startem generacji widoczny jest komunikat, że system może powtórzyć dania wcześniej.

US-034
Tytuł: Loader generacji planu
Opis: Jako użytkownik chcę widzieć pojedynczy loader na czas całej generacji, aby rozumieć postęp.
Kryteria akceptacji:

- W trakcie generacji widoczny jest jeden spójny loader; po zakończeniu znika i pojawia się wynik w historii.

US-035
Tytuł: Logowanie przez Facebook (opcjonalne)
Opis: Jako użytkownik chcę mieć możliwość logowania przez Facebook, jeśli dostępne.
Kryteria akceptacji:

- OAuth Facebook działa analogicznie do Google; w razie braku konfiguracji funkcja jest ukryta.

## 6. Metryki sukcesu

- ≥75% wygenerowanych przez AI opisów i tagów akceptowanych bez zmian w formularzu dania.
- ≥70% pozycji w planie generowanych przez algorytm zamiast ręcznie.
- Mediana ≥20 dodanych dań na użytkownika w pierwszym tygodniu od rejestracji.

Checklist weryfikacyjny PRD

- Każda historyjka użytkownika jest testowalna i ma jasne kryteria akceptacji.
- Ujęto wystarczający zestaw historyjek do zbudowania w pełni funkcjonalnego MVP (auth, baza dań, AI, generator, historia, reklamy, PWA, walidacje, bezpieczeństwo).
- Uwzględniono wymagania dotyczące uwierzytelniania i autoryzacji.
