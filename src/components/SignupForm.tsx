import { useState, useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/FormMessage";
import type { AuthSignupCommand } from "@/types";

interface SignupFormProps {
  onSuccess?: () => void;
  defaultEmail?: string;
}

interface SignupFormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
}

export function SignupForm({ onSuccess, defaultEmail = "" }: SignupFormProps) {
  const emailId = useId();
  const passwordId = useId();

  const [formState, setFormState] = useState<SignupFormState>({
    email: defaultEmail,
    password: "",
    isSubmitting: false,
    error: null,
    success: null,
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): string | null => {
    const trimmedEmail = formState.email.trim();

    if (!trimmedEmail) {
      return "Email jest wymagany";
    }

    if (!validateEmail(trimmedEmail)) {
      return "Podaj poprawny adres email";
    }

    if (!formState.password) {
      return "Hasło jest wymagane";
    }

    if (formState.password.length < 6) {
      return "Hasło musi mieć co najmniej 6 znaków";
    }

    // Check for spaces in password (common security issue)
    if (formState.password !== formState.password.trim()) {
      return "Hasło nie może zaczynać się ani kończyć spacją";
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous messages
    setFormState((prev) => ({ ...prev, error: null, success: null }));

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setFormState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    // Submit form
    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const command: AuthSignupCommand = {
        email: formState.email.trim(),
        password: formState.password,
      };

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        // Handle different error status codes
        if (response.status === 409) {
          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
            error: "Konto z tym adresem email już istnieje. Spróbuj się zalogować.",
          }));
          return;
        }

        if (response.status === 422) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || "Sprawdź poprawność danych rejestracji";
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

      // Success - show success message and redirect after delay
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        success: "Konto zostało utworzone pomyślnie! Przekierowywanie...",
      }));

      // Redirect after showing success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = "/login";
        }
      }, 1500);
    } catch (error) {
      // Network error or JSON parsing error
      console.error("Signup error:", error);
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
            autoComplete="new-password"
            required
            value={formState.password}
            onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
            disabled={formState.isSubmitting}
            aria-invalid={formState.error ? "true" : "false"}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Minimum 6 znaków</p>
        </div>
      </div>

      {formState.error && (
        <FormMessage
          status="error"
          message={formState.error}
          onClose={() => setFormState((prev) => ({ ...prev, error: null }))}
        />
      )}

      {formState.success && <FormMessage status="success" message={formState.success} autoHide={true} />}

      <Button type="submit" disabled={formState.isSubmitting} className="w-full">
        {formState.isSubmitting ? "Tworzenie konta..." : "Załóż konto"}
      </Button>
    </form>
  );
}
