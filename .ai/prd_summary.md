<conversation_summary>

<decisions>

1. Główne persony: pracujący single oraz rodziny z dziećmi, planujące obiady z wyprzedzeniem (np. na przyszły tydzień), docelowo także pod późniejsze tworzenie list zakupów (lista zakupów poza MVP).
2. Główny scenariusz: użytkownik planuje obiady z wyprzedzeniem, wybierając ręcznie danie na każdy dzień z własnej bazy dań (bez automatycznego planowania).
3. Minimalne dane dania: przy tworzeniu dania wymagane są pola `name` oraz co najmniej 1 `tag`; `recipe_text` i `url` pozostają opcjonalne (zgodnie z MVP).
4. Tagi są w pełni tworzone przez użytkownika, startujemy z 0 dań i 0 tagów; przy dodawaniu pierwszego dania użytkownik tworzy pierwszy tag.
5. UX tagów: użytkownik wpisuje nazwę tagu, zatwierdza (np. Enter), tag jest tworzony i od razu przypisywany do dania (zachowanie podobne do `Creatable` w komponentach select/autocomplete, ale bez użycia MUI).
6. Zasady tagów: nazwy tagów muszą być unikalne w obrębie użytkownika, przy czym unikalność jest case-insensitive (np. „mięso” = „Mięso”), a przy zapisie nazwy są normalizowane do lowercase.
7. Ekran startowy (home): po zalogowaniu użytkownik zawsze widzi widok listy dni (historia/plan) z infinite scroll w przód i w tył oraz widocznymi akcjami: przycisk „Dodaj danie” (FAB) i link do listy wszystkich dań.
8. Istnieje osobny widok „Baza dań” – lista wszystkich dań z możliwością zarządzania nimi (co najmniej dodawanie; edycja w domyśle, usuwanie wyłączone na poziomie UI MVP).
9. Główny flow wyboru dania na dzień: użytkownik wchodzi na listę dni → klika wybrany dzień → widzi formularz z opcjonalnym filtrowaniem po tagu → przegląda listę dań i wybiera jedno do przypisania temu dniu.
10. Jeśli użytkownik kliknie w dzień, a baza dań jest pusta, widzi komunikat (copy) informujący, że musi najpierw dodać danie.
11. Dodawanie nowego dania odbywa się poprzez jeden, wspólny przycisk „+” (floating action button) w prawym dolnym rogu, dostępny zarówno na widoku listy dni, jak i widoku pojedynczego dnia.
12. Odrzucono możliwość ręcznego wpisania nazwy dania w dniu: aby przypisać coś do dnia, danie musi zostać najpierw dodane do bazy, a następnie wybrane z listy.
13. Uwierzytelnianie ma być „na maksa uproszczone”, oparte wyłącznie na Supabase Auth (bez rozbudowanej obsługi kont ponad to, co daje Supabase out of the box).
14. Zakres funkcjonalności konta: poza logowaniem/rejestracją system korzysta z podstawowych mechanizmów Supabase (np. wylogowanie, ewentualne resetowanie hasła), bez dodatkowych, customowych funkcji zarządzania kontem.
15. Platforma / urządzenia: produkt ma działać nie tylko na web desktop, ale także sensownie na urządzeniach mobilnych (responsywność jest wymagana, choć bez dopieszczania szczegółów, bo to projekt na zaliczenie).
16. Zachowanie przy usunięciu dania (logiczne/poza UI): w zakresie MVP użycie UI do usuwania dań jest wyłączone („nie ma usuwania dań”), ale jeśli danie zostanie usunięte (np. administracyjnie), to jest odpinane od wszystkich dni, a w historii danego dnia nic nie jest wyświetlane (tak, jakby nigdy nie było przypisane).
17. Poziom złożoności i ambicji: całość ma być „na maksa prosta”, projekt jest przeznaczony na zaliczenie i nie jest planowany jako produkt realnie używany w produkcji.
18. Kryteria sukcesu formalne (na zaliczenie): użytkownik nie chce rozbudowanej analityki; akceptuje proste, minimalne metryki „jakie wymyśli model”, byle były banalne i wystarczające do zaliczenia.
19. Edycja dania jest częścią MVP: użytkownik może edytować wszystkie pola dania (nazwa, tagi, pola opcjonalne) w formularzu identycznym jak przy tworzeniu; zmiany nazwy są widoczne we wszystkich miejscach, gdzie danie jest przypisane do dni.
20. System nie posiada osobnej listy/tag-managementu: tagi istnieją wyłącznie jako wartości w komponencie wielokrotnego wyboru; usunięcie tagu z poziomu tego komponentu powoduje usunięcie tego tagu z systemu oraz automatyczne odpięcie go od wszystkich dań użytkownika.
21. Lista dań jest paginowana (np. 20 pozycji na stronę) i wspiera proste wyszukiwanie/filtrowanie po nazwie (pole tekstowe) oraz po tagach (multi-select).
22. Wprowadzono proste limity długości pól: nazwa dania 3–80 znaków, nazwa tagu 2–30 znaków, `recipe_text` do 2000 znaków, `url` do 255 znaków; krótsze lub dłuższe wartości są odrzucane z komunikatem walidacyjnym.
23. Nie definiuje się osobnych, sformalizowanych wymagań niefunkcjonalnych poza zdroworozsądkowym działaniem aplikacji (czas ładowania, brak krytycznych błędów).
24. PRD nie musi zawierać szczegółowych opisów UI (teksty, microcopy, dokładne layouty); opis pozostaje na poziomie funkcjonalnym i przepływów użytkownika.

</decisions>

<matched_recommendations>

1. Ustalenie jednego, prostego ekranu startowego – przyjęto rekomendację, że home screenem jest lista dni z infinite scroll i podstawowymi akcjami (dodawanie dania, przejście do listy dań).
2. Rozdzielenie widoku planowania dni i widoku „Baza dań” – zaakceptowano osobny ekran listy wszystkich dań, co upraszcza opis struktury nawigacji w PRD.
3. Doprecyzowany prosty UX dla tagów – przyjęto zalecenie opisania konkretnego zachowania (wpisanie tekstu → Enter → utworzenie i przypisanie tagu), co zapewnia jasność implementacyjną.
4. Wprowadzenie reguł dla tagów (unikalność, case-insensitive, normalizacja) – zdecydowano się na minimalny zestaw zasad zwiększających porządek w bazie danych i klarowność logiki.
5. Zaprojektowanie czytelnego empty state przy braku dań – uzgodniono, że po kliknięciu dnia bez istniejących dań użytkownik otrzymuje komunikat zachęcający do dodania pierwszego dania.
6. Ujednolicony mechanizm dodawania dań (FAB „+”) – przyjęto rekomendację prostego, powtarzalnego sposobu dodawania dania dostępnego z kluczowych widoków (lista dni, dzień), co redukuje złożoność.
7. Minimalna, prosta analityka – użytkownik zaakceptował koncepcję 2–3 banalnych metryk (np. dodane dania, zaplanowane dni) jako wystarczającą warstwę pomiaru sukcesu akademickiego.
8. Wymóg podstawowej responsywności – zareagowano pozytywnie na rekomendację, aby uwzględnić działanie na mobile, ale bez inwestowania w rozbudowane dopracowanie UX.
9. Ograniczenie zakresu funkcji konta – przyjęto rekomendację, aby nie projektować dodatkowego zarządzania kontem poza tym, co daje Supabase Auth, co ogranicza zakres PRD.
10. Jawne zdefiniowanie zachowania historii przy usuwaniu dania – doprecyzowano, że w MVP dane są „odpinane” i nic się nie wyświetla, co rozwiązuje niejednoznaczność w logice historii.

</matched_recommendations>

<prd_planning_summary>

a. **Główne wymagania funkcjonalne produktu**

- **Konta użytkowników i uwierzytelnianie**
  - Logowanie, rejestracja i wylogowanie oparte w całości na Supabase Auth.
  - Zakres funkcjonalności kont ograniczony do mechanizmów dostępnych „out of the box” (np. reset hasła z Supabase, bez dodatkowego panelu ustawień konta).

- **Baza dań (obiady)**
  - Użytkownik posiada prywatną bazę dań.
  - Dodawanie nowego dania z wymaganymi polami: `name` + co najmniej 1 `tag`; opcjonalne: `recipe_text`, `url`.
  - Edycja dania odbywa się w identycznym formularzu jak tworzenie – użytkownik może zmienić nazwę, zestaw tagów oraz pola opcjonalne; zmiany nazwy są od razu widoczne we wszystkich miejscach, w których danie jest przypisane do dni.
  - Tagi są w pełni użytkownika, tworzone podczas wpisywania: wpis → zatwierdzenie → utworzenie tagu i przypisanie go do dania.
  - System nie posiada osobnej listy tagów; tagi istnieją wyłącznie jako wartości w komponencie wielokrotnego wyboru. Usunięcie tagu z poziomu tego komponentu oznacza usunięcie danego tagu z systemu oraz automatyczne odpięcie go od wszystkich dań użytkownika.
  - Nazwy tagów są unikalne (case-insensitive) i normalizowane do lowercase przy zapisie.
  - Walidacja pól: nazwa dania 3–80 znaków, nazwa tagu 2–30 znaków, opcjonalny `recipe_text` do 2000 znaków, pole `url` do 255 znaków; wartości niespełniające tych kryteriów są odrzucane z komunikatem walidacyjnym w formularzu.
  - MVP nie przewiduje usuwania dań z poziomu interfejsu (brak UI do delete); jeśli danie zostanie usunięte poza UI, to automatycznie odpinane jest od wszystkich przypisanych dni, a historia/dany dzień nie pokazuje żadnej pozycji.

- **Historia obiadów / planowanie dni**
  - Główny widok to lista dni (infinite scroll w przód i w tył), pokazująca dla każdego dnia przypisane danie (lub brak).
  - Kliknięcie konkretnego dnia otwiera widok/formularz planowania dla tego dnia:
    - Możliwość filtrowania listy dań po tagach (opcjonalnie).
    - Przeglądanie listy dań pasujących do filtra lub wszystkich dań.
    - Ręczne wybranie jednego dania z listy i przypisanie go do dnia.
  - Nie można wpisać dowolnej nazwy dania dla dnia – trzeba najpierw dodać danie do bazy, a potem wybrać je z listy.
  - Jeśli brak dań w bazie, po kliknięciu dnia użytkownik otrzymuje komunikat informujący, że musi najpierw dodać danie.

- **Widok „Baza dań”**
  - Osobny ekran z listą wszystkich dań użytkownika w formie paginowanej (np. 20 pozycji na stronę).
  - Możliwość dodawania i edytowania dań (formularz taki sam jak przy tworzeniu).
  - Możliwość wyszukiwania po nazwie (pole tekstowe filtrujące po fragmencie nazwy) oraz filtrowania po tagach (multi-select; wyniki zawierają dania posiadające wszystkie wybrane tagi).
  - Spójna obsługa tagów jak wyżej.

- **Nawigacja i główne entry pointy**
  - Po zalogowaniu użytkownik trafia na widok listy dni (home screen).
  - Na widoku listy dni:
    - Widoczny przycisk „+” (FAB) w prawym dolnym rogu do dodawania nowego dania.
    - Link do widoku „Baza dań”.
  - Na widoku pojedynczego dnia:
    - Taki sam przycisk „+” (FAB) do dodania nowego dania (np. gdy w trakcie planowania dnia użytkownik widzi, że brakuje odpowiedniej pozycji).

- **Platforma i UX**
  - Aplikacja webowa z podstawową responsywnością umożliwiającą komfortowe użycie zarówno na desktopie, jak i na urządzeniach mobilnych.
  - Projekt celowo uproszczony (projekt zaliczeniowy, brak założeń o realnym użyciu produkcyjnym), z naciskiem na prostą nawigację i minimalną liczbę ekranów, bez sformalizowanego zestawu wymagań niefunkcjonalnych poza zdroworozsądkowym działaniem aplikacji.

b. **Kluczowe historie użytkownika i ścieżki korzystania**

- **Historia 1: Dodanie pierwszego dania i pierwszego tagu**
  - Jako nowy użytkownik wchodzę na listę dni (pusta historia).
  - Klikam wybrany dzień, widzę informację, że nie mam jeszcze żadnych dań i że muszę dodać danie.
  - Używam przycisku „+” (FAB), aby dodać pierwsze danie.
  - W formularzu wpisuję `name` i nowy tag (np. „szybkie”), zatwierdzam – tag jest tworzony i przypisany do dania.
  - Po zapisaniu mogę wrócić do dnia i przypisać to danie.

- **Historia 2: Planowanie tygodnia z filtrowaniem po tagach**
  - Jako użytkownik z istniejącą bazą dań otwieram aplikację i widzę listę dni.
  - Przewijam do kolejnych dni tygodnia (infinite scroll) i po kolei klikam każdy dzień.
  - Dla danego dnia używam filtra po tagu (np. „wege”), przeglądam listę pasujących dań i wybieram jedno.
  - Powtarzam ten proces dla wszystkich dni tygodnia, planując różnorodne obiady.

- **Historia 3: Zarządzanie bazą dań**
  - Z listy dni klikam link „Baza dań”.
  - Widzę listę wszystkich dań i ich tagów.
  - Dodaję kolejne dania przy użyciu tego samego formularza (name + tagi).
  - W przyszłości korzystam z tych dań przy planowaniu kolejnych dni.

- **Historia 4: Szybki dostęp do dodawania dania w trakcie planowania dnia**
  - Otwieram dzień, filtruję dania po tagu, ale nie znajduję nic odpowiedniego.
  - Używam FAB „+” na ekranie dnia, aby dodać nowe danie „w locie”.
  - Po zapisaniu dania wracam do listy dań dla dnia i od razu mogę je przypisać.

c. **Ważne kryteria sukcesu i sposoby ich mierzenia**

- **Kryteria sukcesu (akademickie / na zaliczenie)**
  - Użytkownik jest w stanie:
    - Dodać co najmniej kilka dań do własnej bazy, każde z przynajmniej jednym tagiem.
    - Zaplanować obiady na co najmniej kilka dni z rzędu, wybierając dania z listy.
  - Minimalne metryki (proste, do implementacji):
    - Liczba dodanych dań na użytkownika (`dish_added` count).
    - Liczba dni, dla których przypisano danie (`day_planned` count).

- **Sposoby mierzenia**
  - Proste eventy wysyłane do Supabase / logowane po stronie backendu/aplikacji:
    - `dish_added` (parametry: user_id, dish_id, tags_count).
    - `day_planned` (user_id, date, dish_id).
  - Wystarczające jest utrzymanie tych danych w bazie i możliwość prostego zliczania (np. query w panelu lub skrypt), bez pełnego systemu dashboardów.

d. **Nierozwiązane kwestie lub obszary wymagające wyjaśnienia**

- Czy edycja dania (zmiana nazwy, tagów, opisu) ma być częścią MVP, czy może zostać pominięta lub ograniczona do prostego formularza?
- Jak dokładnie ma wyglądać interfejs listy dań (sortowanie, ewentualne filtrowanie po tagach, paginacja vs scroll) – na razie przyjęto istnienie listy, ale bez szczegółów interakcji.
- Czy i jakie walidacje długości pól (np. maksymalna długość nazwy dania, tagu) oraz ewentualne ograniczenia liczby tagów na danie mają zostać wprowadzone?
- Jakie są minimalne wymagania niefunkcjonalne (wydajność przy dużej liczbie dań/dni, dostępność, obsługa błędów sieciowych) konieczne do opisania w PRD, biorąc pod uwagę charakter projektu „na zaliczenie”?
- Czy PRD ma uwzględniać szczegóły UI (np. konkretne teksty komunikatów, kopie przycisków, szkice widoków), czy ma pozostać na wyższym poziomie opisów funkcjonalnych?

</prd_planning_summary>

<unresolved_issues>

Brak istotnych nierozwiązanych kwestii na poziomie PRD; drobne decyzje implementacyjne (np. detale wizualne UI) mogą zostać podjęte swobodnie w trakcie realizacji przez zespół deweloperski.

</unresolved_issues>

</conversation_summary>
