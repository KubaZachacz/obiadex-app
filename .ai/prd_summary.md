# Podsumowanie rozmowy - Planowanie PRD dla Obiadex MVP

## Decyzje podjęte przez użytkownika

1. **Grupa docelowa**: Młode małżeństwa, rodziny z dziećmi, osoby gotujące samodzielnie - bez specjalnego dostosowania UI do poszczególnych segmentów.

2. **Model monetyzacji**: Aplikacja darmowa w fazie testowej z reklamami (Google AdSense), w przyszłości opcja płatnego pakietu do wyłączenia reklam.

3. **Stack technologiczny**: Astro z komponentami React + Supabase (PostgreSQL + Authentication).

4. **Dostawca AI**: Tani model z OpenAI (GPT-4o-mini) lub Google Gemini, jedna generacja opisu i tagów na danie, implementacja throttlingu i mechanizmów anty-spam po stronie API.

5. **Algorytm generacji planu**:
   - Wybór zakresu dat (date picker od-do)
   - Pomijanie dni z już przypisanymi pomysłami
   - Opcjonalne przypisanie oczekiwanego tagu dla konkretnego dnia
   - Generacja wymaga min. 1 dania z danym tagiem
   - Zasada: 1 danie max 1x w tygodniu (pon-ndz), min. 10 dni karencji od ostatniego wystąpienia
   - Generacja iteracyjna dzień po dniu ze zmieniającym się oknem
   - Łamanie zasad przy deficycie pomysłów (szczególnie dla specjalistycznych tagów)

6. **System tagów**: Lista tagów per użytkownik, multiselect autocomplete przy dodawaniu dania, możliwość dodania nowego lub usunięcia istniejącego tagu, brak dedykowanego widoku zarządzania tagami.

7. **Historia obiadów**:
   - Lista chronologiczna ze wszystkimi dniami (włącznie z pustymi)
   - Opcjonalny filtr (jest danie / brak dania)
   - Możliwy infinite scroll
   - Edycja: wymiana pomysłu z listy dań, prośba o nową generację AI, dodanie pomysłu do pustego dnia
   - Weryfikacja historii przed kolejną generacją zalecana dla lepszych wyników

8. **Autentykacja**: Email/hasło jako podstawa, opcjonalnie Google i Facebook (w zależności od możliwości Supabase).

9. **Responsywność**: PWA z responsive web design (RWD).

10. **Onboarding**: Minimalny - brak dań w bazie uniemożliwia generację planu.

11. **Statystyki**: Użytkownik nie widzi statystyk użycia dań (częstotliwość, ostatnie wystąpienie).

12. **Metryki produktowe**: Nie będą aktywnie śledzone i analizowane w MVP.

13. **Strategia marketingowa**: Brak planu zdobywania pierwszych użytkowników i testów beta.

14. **Usuwanie konta**: Permanentne usunięcie wszystkich danych użytkownika.

## Dopasowane rekomendacje

1. **Stack technologiczny**: ✅ Astro + Supabase to doskonały wybór dla MVP - niskie koszty (~$0-25/miesiąc dla pierwszych 1000 użytkowników), szybki development, gotowe rozwiązania auth.

2. **Model AI**: ✅ OpenAI GPT-4o-mini (~$0.15 za 1M tokenów) lub Gemini Flash to optymalne rozwiązanie kosztowe. Throttling zabezpieczy przed nadużyciami.

3. **System tagów z autocomplete**: ✅ Wolny tekst z autocomplete na bazie historii użytkownika to intuicyjne rozwiązanie, AI generuje 2-3 tagi automatycznie.

4. **Historia z możliwością edycji**: ✅ Elastyczność w zarządzaniu historią (wymiana, regeneracja, dodawanie) zwiększa użyteczność i dokładność przyszłych generacji.

5. **PWA mobile-first**: ✅ Krytyczne dla aplikacji kulinarnej - użytkownicy korzystają z telefonu podczas gotowania.

6. **Minimalny onboarding**: ✅ "Empty state" motywujący do dodania pierwszych dań - naturalny przepływ bez zbędnych barier.

7. **Formularz dania na jednym ekranie**: ✅ Prosty flow: nazwa → generacja AI → edycja → zapis. Minimalizuje friction.

8. **Auth z Google/Facebook**: ✅ 90% użytkowników preferuje social login - szybszy onboarding, mniej porzuconych rejestracji.

9. **Reklamy nieblokujące**: ✅ Banner na dole/boku listy, pomiędzy pozycjami historii, ale NIE podczas kluczowych flow (generacja, dodawanie).

10. **GDPR-compliant usuwanie danych**: ✅ Permanentne usunięcie wszystkich danych użytkownika jest zgodne z regulacjami.

## Szczegółowe podsumowanie planowania PRD

### Problem użytkownika

Codzienne wymyślanie obiadu jest czasochłonne i męczące. Użytkownicy potrzebują prostego narzędzia do planowania obiadów z ich ulubionych dań, bez skomplikowanych przepisów, list zakupów czy zaawansowanej logistyki.

### Główne wymagania funkcjonalne

#### 1. System kont użytkownika

- Rejestracja i logowanie (email/hasło + opcjonalnie Google/Facebook via Supabase)
- Usuwanie konta z permanentnym usunięciem wszystkich danych
- Brak współdzielenia między użytkownikami w MVP

#### 2. Baza dań użytkownika

- **Struktura dania**: nazwa (required), opis (optional), tagi (array), URL do przepisu (optional)
- **Operacje**: dodawanie, edycja, usuwanie dań
- **System tagów**:
  - Wolny tekst z multiselect autocomplete
  - Lista tagów budowana per użytkownik
  - Możliwość dodania nowego tagu podczas dodawania dania
  - Brak dedykowanego widoku zarządzania tagami
  - Brak statystyk użycia dań

#### 3. Generacja AI opisu i tagów

- **Provider**: OpenAI GPT-4o-mini lub Google Gemini (tani model)
- **Trigger**: Jeden przycisk po wpisaniu nazwy dania
- **Output**: Krótki opis (2-3 zdania) + 2-3 tagi
- **Edycja**: Użytkownik może zmodyfikować przed zapisem
- **Zabezpieczenia**: Throttling i anti-spam po stronie API
- **Częstotliwość**: Tylko 1 generacja na danie (brak regeneracji)

#### 4. Generator planu obiadów

- **Interfejs**: Osobny ekran z dwoma date pickerami (od-do)
- **Logika generacji**:
  - Dni z już przypisanymi pomysłami są pomijane
  - Opcjonalne przypisanie tagu do konkretnego dnia (np. "ryba" dla piątku)
  - Użycie tagu wymaga ≥1 dania z tym tagiem w bazie
  - Iteracyjne generowanie dzień po dniu ze zmieniającym się oknem kontekstowym
- **Algorytm antypowtórzeń**:
  - 1 danie max 1x w tygodniu (poniedziałek-niedziela)
  - Minimum 10 dni karencji od ostatniego wystąpienia
  - Łamanie zasad przy deficycie dań (szczególnie dla specjalistycznych tagów)
  - W przypadku deficytu: wykorzystanie całej puli lub całej puli dla tagu, bez karencji

- **Operacje na wygenerowanym planie**: Ręczna podmiana i usuwanie pozycji

#### 5. Historia obiadów

- **Wyświetlanie**:
  - Lista chronologiczna ze wszystkimi dniami (włącznie z pustymi)
  - Opcjonalny filtr: "z daniem" / "bez dania"
  - Infinite scroll dla wydajności przy długiej historii
- **Edycja**:
  - Wymiana pomysłu na inne danie z listy (dropdown z bazy dań)
  - Prośba o nową generację AI dla danego dnia
  - Dodanie pomysłu do pustego dnia (ręcznie lub AI)
  - Usuwanie wpisu (dzień wraca do stanu pustego)
- **Weryfikacja**: Przed kolejną generacją użytkownik jest zachęcany do zweryfikowania ostatnich wpisów z rzeczywistością dla lepszych wyników algorytmu

### Kluczowe historie użytkownika

**Historia 1: Nowy użytkownik buduje bazę dań**

1. Użytkownik rejestruje się (email lub Google)
2. Widzi pusty stan z informacją "Dodaj pierwsze danie, aby móc generować plany"
3. Klika "Dodaj danie" → wpisuje nazwę np. "Rosół"
4. Klika "Wygeneruj opis i tagi AI" → AI wypełnia opis i dodaje tagi ["zupa", "tradycyjne", "dłuższe gotowanie"]
5. Użytkownik może edytować wyniki AI lub od razu zapisać
6. Powtarza proces dla 5-10 swoich ulubionych dań

**Historia 2: Generacja tygodniowego planu**

1. Użytkownik ma ≥10 dań w bazie
2. Wchodzi w "Wygeneruj plan"
3. Wybiera zakres: poniedziałek-piątek przyszłego tygodnia
4. Opcjonalnie: dla piątku wybiera tag "ryba"
5. Klika "Generuj" → iteracyjnie generowane są pomysły dla kolejnych dni
6. System respektuje zasady: brak powtórzeń w tygodniu, karencja 10 dni
7. Dla piątku wybiera tylko z dań z tagiem "ryba"
8. Użytkownik widzi wygenerowany plan w historii

**Historia 3: Zarządzanie historią**

1. Użytkownik przegląda historię (przeszłe i przyszłe dni)
2. Widzi, że we wtorek faktycznie zrobił coś innego niż zaplanowano
3. Klika "Edytuj" przy wtorku → wybiera faktyczne danie z listy
4. W środę widzi pusty dzień (zapomniał zalogować) → dodaje ręcznie co faktycznie gotował
5. Dla czwartku zmienia zdanie → klika "Wygeneruj ponownie" → AI proponuje nowe danie
6. Przed kolejną generacją planu system przypomina o weryfikacji historii

**Historia 4: Zarządzanie kontem**

1. Użytkownik decyduje się usunąć konto
2. Wchodzi w ustawienia → "Usuń konto"
3. Widzi ostrzeżenie o permanentnym usunięciu wszystkich danych
4. Potwierdza → konto i wszystkie dane są usuwane

### Kryteria sukcesu (z dokumentu MVP)

1. **≥75%** wygenerowanych przez AI opisów/tagów jest akceptowanych bez zmian
2. **≥70%** pozycji w planie powstaje przez generator (zamiast ręcznie)
3. **Mediana ≥20** dodanych dań na użytkownika w pierwszym tygodniu

### Ograniczenia techniczne i funkcjonalne

**Nie wchodzi w zakres MVP:**

- Współdzielenie w "rodzinach" i role użytkowników
- Import/eksport (CSV, PDF)
- Widok kalendarza (grid miesiąca) i drag & drop
- Zaawansowany algorytm częstotliwości i gotowanie "na kilka dni"
- Model składników, lista zakupów, przeliczanie porcji i kalorii
- Publiczne udostępnianie treści, wyszukiwarka publiczna
- Powiadomienia, integracje zewnętrzne
- Aplikacje mobilne native (tylko PWA)
- Analityka i monitoring metryk produktowych
- Szczegółowe statystyki użycia dań dla użytkownika

### Stack techniczny

**Frontend**: Astro + React  
**Backend & Database**: Supabase (PostgreSQL + Authentication + API)  
**AI**: OpenAI GPT-4o-mini lub Google Gemini Flash  
**Hosting**: Supabase (backend) + Vercel/Netlify (frontend)  
**Autentykacja**: Supabase Auth (email/password + OAuth Google/Facebook)  
**Architektura**: PWA z responsive web design

### Model monetyzacji

- **Faza testowa**: Darmowa aplikacja z reklamami (Google AdSense)
- **Umiejscowienie reklam**:
  - Banner sticky na dole (mobile) lub sidebar (desktop) w widoku listy dań
  - Banner co 7-10 pozycji w historii
  - Unikanie reklam podczas: dodawania dania, generacji planu, onboardingu
- **Przyszła monetyzacja**: Płatny pakiet premium (~$2-3/miesiąc lub $20/rok) do wyłączenia reklam

## Nierozwiązane kwestie wymagające dalszych decyzji

1. **Szczegóły UX generacji planu**: Jak wyświetlić progress iteracyjnej generacji? Czy pokazywać każdy dzień osobno w czasie rzeczywistym, czy zbiorczy loader?
   ODP: Jeden loader na cała generacje (iteracyjnie tylko backend)
2. **Komunikaty walidacji**: Jakie dokładnie komunikaty pokazać gdy:
   - Użytkownik próbuje generować bez dań w bazie?
   - Wybiera tag, ale nie ma dań z tym tagiem?
   - Nie ma wystarczająco dań do wypełnienia zakresu bez łamania zasad?

3. **Zachowanie przy deficycie dań**: Czy system powinien informować użytkownika, że łamie zasady (powtarza danie przed karencją) i dlaczego? Czy to ma być transparentne czy ciche?
   ODP: powinna być możliwość ostrzeżenia jeszcze przed generacją, może mogą być kłopoty
4. **Format daty i lokalizacja**: Czy aplikacja ma być wyłącznie po polsku? Jakie formaty dat (DD.MM.YYYY vs DD/MM/YYYY)?
   ODP: Po polsku, DD.MM.YYYY
5. **Limit dań w bazie**: Czy wprowadzić jakieś ograniczenie dla wersji darmowej (np. max 50 dań) czy unlimited?
   ODP: Bez limitu
6. **Szczegóły wyświetlania reklam**: Konkretne rozmiary banerów AdSense, częstotliwość w historii, zachowanie na różnych rozmiarach ekranu.
7. **Długość historii**: Czy historia ma być ograniczona czasowo (np. ostatnie 6 miesięcy) czy unlimited? Wpływ na performance przy bardzo długiej historii.

8. **Polityka prywatności i regulamin**: Czy są już przygotowane dokumenty wymagane dla GDPR i zgodności z polskim prawem?

9. **Handling błędów API AI**: Co się dzieje gdy API OpenAI/Gemini zwróci błąd podczas generacji? Retry logic? Komunikat użytkownikowi?

10. **Onboarding flow szczegóły**: Czy pokazać tooltip/hint przy pierwszym logowaniu? Czy empty state ma przycisk CTA "Dodaj pierwsze danie"?

---

**Podsumowanie gotowości do PRD**: Zebrano 90% informacji niezbędnych do stworzenia kompletnego PRD. Pozostałe 10% to szczegóły implementacyjne, które można doprecyzować podczas development lub założyć rozsądne defaults.
