<user_journey_analysis>
- **Ścieżki użytkownika (auth)**:
  - Rejestracja nowego konta (US-001)
  - Logowanie do istniejącego konta (US-002)
  - Wylogowanie z aplikacji (US-003)
  - Reset hasła (US-004)
- **Ścieżki użytkownika (aplikacja)**:
  - Dostęp do widoków chronionych po zalogowaniu (US-020, US-021, US-022, US-025)
  - Próba wejścia na widoki chronione bez logowania (US-030)
- **Główne stany**:
  - Niezalogowany, Strona logowania, Strona rejestracji, Reset hasła
  - Zalogowany, Widok home (lista dni), Widok „Baza dań”, Formularze planowania
- **Punkty decyzyjne**:
  - Wynik logowania / rejestracji (sukces vs błąd)
  - Czy użytkownik ma konto (przejście login ↔ signup)
  - Czy użytkownik jest zalogowany przy wejściu na widok chroniony
- **Cel stanów (skrótowo)**:
  - Stany auth: umożliwienie bezpiecznego wejścia do aplikacji
  - Stany aplikacji: planowanie obiadów i zarządzanie bazą dań wyłącznie po zalogowaniu
</user_journey_analysis>

<mermaid_diagram>
```mermaid
stateDiagram-v2

  [*] --> Niezalogowany

  %% Stany wysokiego poziomu
  state "Niezalogowany" as Niezalogowany
  state "Zalogowany" as Zalogowany

  %% Wejścia na ekrany auth
  Niezalogowany --> StronaLogowania: Wejście na /login
  Niezalogowany --> StronaRejestracji: Wejście na /signup
  Niezalogowany --> BlokadaChronionych: Wejście na widok chroniony

  state "Strona logowania" as StronaLogowania {
    [*] --> FormularzLogowania
    FormularzLogowania --> WalidacjaLogowania: Wysłanie formularza
    WalidacjaLogowania --> ZalogowanyLocal: Dane poprawne
    WalidacjaLogowania --> FormularzLogowania: Błędne dane
    FormularzLogowania --> StronaResetHasla: Klik "Zapomniałem hasła?"
    FormularzLogowania --> StronaRejestracji: Brak konta

    state "Zalogowany (lokalnie)" as ZalogowanyLocal
    ZalogowanyLocal --> [*]: Redirect do /
  }

  state "Strona rejestracji" as StronaRejestracji {
    [*] --> FormularzRejestracji
    FormularzRejestracji --> WalidacjaRejestracji: Wysłanie formularza
    WalidacjaRejestracji --> RejestracjaUdana: Dane poprawne
    WalidacjaRejestracji --> FormularzRejestracji: Błąd walidacji
    WalidacjaRejestracji --> FormularzRejestracji: Duplikat email

    state "RejestracjaUdana" as RejestracjaUdana
    RejestracjaUdana --> [*]: Komunikat + redirect do /login

    FormularzRejestracji --> StronaLogowania: Mam już konto
  }

  state "Reset hasła" as StronaResetHasla {
    [*] --> FormularzResetu
    FormularzResetu --> WalidacjaResetu: Wysłanie emaila
    WalidacjaResetu --> PotwierdzenieResetu: Email poprawny
    WalidacjaResetu --> FormularzResetu: Błąd walidacji

    state "PotwierdzenieResetu" as PotwierdzenieResetu
    PotwierdzenieResetu --> [*]: Neutralny komunikat
  }

  %% Blokada dostępu do widoków chronionych
  state if_auth <<choice>>
  BlokadaChronionych --> if_auth
  if_auth --> StronaLogowania: Brak sesji
  if_auth --> Zalogowany: Sesja obecna

  %% Stany po zalogowaniu
  Zalogowany --> WidokHome: Redirect po logowaniu
  Zalogowany --> WidokHome: Powrót na /

  state "Widoki aplikacji" as Aplikacja {
    state "Home / lista dni" as WidokHome {
      [*] --> ListaDni
      ListaDni --> DzienDetale: Klik w dzień
      ListaDni --> BazaDan: Klik "Baza dań"
    }

    state "Dzień" as DzienDetale {
      [*] --> StanDzien
      StanDzien --> FormularzPlanu: FAB "+"
      FormularzPlanu --> StanDzien: Zapis dania
    }

    state "Baza dań" as BazaDan {
      [*] --> ListaDan
      ListaDan --> FormularzDania: FAB "+"
      FormularzDania --> ListaDan: Zapis dania
    }
  }

  Zalogowany --> Aplikacja

  %% Wylogowanie
  Aplikacja --> Niezalogowany: Wyloguj (Header)
  Zalogowany --> Niezalogowany: Wyloguj (Header)

  %% Koniec podróży
  Aplikacja --> [*]: Zamknięcie aplikacji
  Niezalogowany --> [*]: Wyjście bez logowania
```
</mermaid_diagram>


