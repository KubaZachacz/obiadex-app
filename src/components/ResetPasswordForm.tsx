import { useState, useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/FormMessage";
import { useMutation } from "@/lib/http/hooks";
import type { AuthResetPasswordCommand } from "@/types";

interface ResetPasswordFormProps {
  onSuccess?: () => void;
  defaultEmail?: string;
}

export function ResetPasswordForm({ onSuccess, defaultEmail = "" }: ResetPasswordFormProps) {
  const emailId = useId();

  const [email, setEmail] = useState(defaultEmail);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutateAsync, isSubmitting, error, reset } = useMutation<unknown, AuthResetPasswordCommand>(
    "/api/auth/reset-password",
    {
      onSuccess: () => {
        setSuccessMessage("Jesli konto z tym adresem email istnieje, wyslalismy instrukcje resetu hasla.");
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 3000);
        }
      },
    }
  );

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const validateForm = (emailValue: string): string | null => {
    if (!emailValue.trim()) {
      return "Email jest wymagany";
    }

    if (!validateEmail(emailValue)) {
      return "Podaj poprawny adres email";
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setValidationError(null);
    setSuccessMessage(null);
    reset();

    const validationMessage = validateForm(email);
    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    const command: AuthResetPasswordCommand = {
      email: email.trim(),
    };

    try {
      await mutateAsync(command);
    } catch {
      return;
    }
  };

  const displayError = validationError ?? error?.message ?? null;

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            aria-invalid={displayError ? "true" : "false"}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Wprowadz adres email powiazany z Twoim kontem. Wyslemy Ci link do resetu hasla.
          </p>
        </div>
      </div>

      {displayError && (
        <FormMessage
          status="error"
          message={displayError}
          onClose={() => {
            setValidationError(null);
            reset();
          }}
        />
      )}

      {successMessage && <FormMessage status="success" message={successMessage} autoHide={false} />}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Wysylanie..." : "Wyslij link do resetu hasla"}
      </Button>
    </form>
  );
}
