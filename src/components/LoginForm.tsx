import { useState, useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/FormMessage";
import type { AuthLoginCommand } from "@/types";

interface LoginFormProps {
  onSuccess?: () => void;
  defaultEmail?: string;
}

interface LoginFormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  error: string | null;
}

export function LoginForm({ onSuccess, defaultEmail = "" }: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();

  const [formState, setFormState] = useState<LoginFormState>({
    email: defaultEmail,
    password: "",
    isSubmitting: false,
    error: null,
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): string | null => {
    if (!formState.email.trim()) {
      return "Email jest wymagany";
    }

    if (!validateEmail(formState.email)) {
      return "Podaj poprawny adres email";
    }

    if (!formState.password) {
      return "Hasło jest wymagane";
    }

    if (formState.password.length < 8) {
      return "Hasło musi mieć co najmniej 8 znaków";
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous errors
    setFormState((prev) => ({ ...prev, error: null }));

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setFormState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    // Submit form
    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const command: AuthLoginCommand = {
        email: formState.email.trim(),
        password: formState.password,
      };

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        // Handle different error status codes
        if (response.status === 401) {
          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
            error: "Nieprawidłowe dane logowania. Sprawdź email i hasło.",
          }));
          return;
        }

        if (response.status === 422) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || "Sprawdź poprawność danych logowania";
          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
            error: errorMessage,
          }));
          return;
        }

        if (response.status === 429) {
          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
            error: "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
          }));
          return;
        }

        if (response.status >= 500) {
          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
            error: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę.",
          }));
          return;
        }

        // Generic error
        setFormState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
        }));
        return;
      }

      await response.json();

      // Success - redirect or call onSuccess
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      // Network error or JSON parsing error
      console.error("Login error:", error);
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: "Błąd połączenia. Sprawdź połączenie internetowe i spróbuj ponownie.",
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={emailId}>Email</Label>
          <Input
            id={emailId}
            type="email"
            name="email"
            autoComplete="email"
            required
            value={formState.email}
            onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
            disabled={formState.isSubmitting}
            aria-invalid={formState.error ? "true" : "false"}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={passwordId}>Hasło</Label>
          <Input
            id={passwordId}
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={formState.password}
            onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
            disabled={formState.isSubmitting}
            aria-invalid={formState.error ? "true" : "false"}
            className="w-full"
          />
        </div>
      </div>

      {formState.error && (
        <FormMessage
          status="error"
          message={formState.error}
          onClose={() => setFormState((prev) => ({ ...prev, error: null }))}
        />
      )}

      <Button type="submit" disabled={formState.isSubmitting} className="w-full">
        {formState.isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </Button>
    </form>
  );
}
