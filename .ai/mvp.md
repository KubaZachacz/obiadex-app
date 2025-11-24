# Aplikacja - Obiadex (MVP)

## Główny problem

Codzienne wymyślanie „co na obiad?” zużywa czas i energię. Użytkownicy chcą mieć prostą bazę ulubionych obiadów oraz szybki sposób wybierania czegoś „innego niż zwykle” na konkretny dzień, bez rozbudowanej logistyki i planowania.

## Najmniejszy zestaw funkcjonalności

- Konta użytkowników:
  - rejestracja, logowanie, wylogowanie, usuwanie konta.

- Baza dań (tylko obiady):
  - dodawanie, edycja, usuwanie, lista dań,
  - pola: `name`, `tags[]` (np. szybkie, makaron, wege), opcjonalne `recipe_text`, opcjonalny `url`.

- Historia obiadów / plan:
  - dla każdego dnia użytkownik może przypisać jedno danie z bazy,
  - przegląd minionych i nadchodzących dni w prostej liście (np. „2025-11-24 – Spaghetti bolognese”).

- Wybór dania na konkretny dzień:
  - filtrowanie dań po tagach,
  - sortowanie listy tak, by:
    - najpierw pojawiały się dania nigdy niewybrane,
    - następnie dania użyte dawno temu,
    - na końcu dania użyte ostatnio,

  - użytkownik ręcznie wybiera danie z listy i zapisuje je w historii.

## Co NIE wchodzi w zakres MVP

- Współdzielenie w ramach „rodzin” i role użytkowników.
- Import/eksport danych (CSV, PDF, itp.).
- Widok kalendarza w formie siatki miesiąca oraz drag & drop.
- Zaawansowane planowanie (np. gotowanie na kilka dni, bilansowanie różnorodności).
- Model składników, lista zakupów, przeliczanie porcji, kalorii.
- Publiczne udostępnianie treści i wyszukiwarka publiczna.
- Powiadomienia oraz integracje z aplikacjami zewnętrznymi.
- Aplikacje mobilne (na start tylko web).

## Kryteria sukcesu

- Użytkownik ma wypełnione co najmniej 7 dni historii/planów w pierwszym miesiącu korzystania.
- Mediana ≥20 dań dodanych na użytkownika w pierwszym tygodniu.
