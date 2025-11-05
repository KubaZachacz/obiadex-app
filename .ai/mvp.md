# Aplikacja – Obiadex (MVP)

### Główny problem

Codzienne wymyślanie obiadu zużywa czas i energię. Użytkownicy chcą szybko ułożyć prosty plan obiadów z ulubionych dań – bez skomplikowanych przepisów, zakupów czy logistyki.

### Najmniejszy zestaw funkcjonalności

- **Konta użytkowników**: rejestracja, logowanie, usuwanie konta.
- **Baza dań (tylko obiady)**: dodawanie/edycja/usuwanie z polami `name`, `tags[]`, opcjonalny `recipe_text`, `url`.
- **AI – generator opisu i tagów**: po wpisaniu nazwy dania jedno kliknięcie uzupełnia krótki opis (2–3 zdania) i 2–3 tagi; użytkownik może je edytować przed zapisem.
- **Plan obiadów**: generowanie propozycji dla wskazanych dni (pojedynczy dzień lub zakres) z uwzględnieniem opcjonalnej preferencji tagów, ręczna podmiana i usuwanie pozycji.
- **Historia**: przegląd minionych i nadchodzących obiadów w prostej liście.

### Co NIE wchodzi w zakres MVP

- Współdzielenie w „rodzinach” i role użytkowników.
- Import/eksport (CSV, PDF, itp.).
- Widok kalendarza (grid miesiąca) i drag & drop.
- Zaawansowany algorytm częstotliwości i gotowanie „na kilka dni”.
- Model składników, lista zakupów, przeliczanie porcji i kalorii.
- Publiczne udostępnianie treści, wyszukiwarka publiczna.
- Powiadomienia, integracje z aplikacjami zewnętrznymi.
- Aplikacje mobilne (na start tylko web).

### Kryteria sukcesu

- **≥75%** wygenerowanych przez AI opisów/tagów jest akceptowanych bez zmian.
- **≥70%** pozycji w planie powstaje przez generator (zamiast ręcznie).
- **Mediana ≥20** dodanych dań na użytkownika w pierwszym tygodniu.
