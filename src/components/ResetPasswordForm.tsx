import { useState, useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/FormMessage";
import type { AuthResetPasswordCommand } from "@/types";

interface ResetPasswordFormProps {
  onSuccess?: () => void;
  defaultEmail?: string;
}

interface ResetPasswordFormState {
  email: string;
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
}

export function ResetPasswordForm({ onSuccess, defaultEmail = "" }: ResetPasswordFormProps) {
  const emailId = useId();

  const [formState, setFormState] = useState<ResetPasswordFormState>({
    email: defaultEmail,
    isSubmitting: false,
    error: null,
    success: null,
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
      const command: AuthResetPasswordCommand = {
        email: formState.email.trim(),
      };

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      // Always treat 202 as success (prevents email enumeration)
      if (response.status === 202) {
        setFormState((prev) => ({
          ...prev,
          isSubmitting: false,
          success: "Jeśli konto z tym adresem email istnieje, wysłaliśmy instrukcję resetu hasła.",
        }));

        // Optionally redirect after delay
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 3000);
        }
        return;
      }

      // Handle other status codes
      if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Sprawdź poprawność adresu email";
        setFormState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: errorMessage,
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
    } catch (error) {
      // Network error or JSON parsing error
      console.error("Reset password error:", error);
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
          <p className="text-xs text-muted-foreground">
            Wprowadź adres email powiązany z Twoim kontem. Wyślemy Ci link do resetu hasła.
          </p>
        </div>
      </div>

      {formState.error && (
        <FormMessage
          status="error"
          message={formState.error}
          onClose={() => setFormState((prev) => ({ ...prev, error: null }))}
        />
      )}

      {formState.success && <FormMessage status="success" message={formState.success} autoHide={false} />}

      <Button type="submit" disabled={formState.isSubmitting} className="w-full">
        {formState.isSubmitting ? "Wysyłanie..." : "Wyślij link do resetu hasła"}
      </Button>
    </form>
  );
}
