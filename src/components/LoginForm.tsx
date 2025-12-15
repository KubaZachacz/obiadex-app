import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/FormMessage";
import type { AuthLoginCommand } from "@/types";

interface LoginFormProps {
  onSuccess?: () => void;
  defaultEmail?: string;
}

const loginFormSchema = z.object({
  email: z.string().trim().min(1, "Email jest wymagany").email("Podaj poprawny adres email"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm({ onSuccess, defaultEmail = "" }: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: defaultEmail,
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    try {
      const command: AuthLoginCommand = {
        email: values.email.trim(),
        password: values.password,
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
          setServerError("Nieprawidłowe dane logowania. Sprawdź email i hasło.");
          return;
        }

        if (response.status === 422) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || "Sprawdź poprawność danych logowania";
          setServerError(errorMessage);
          return;
        }

        if (response.status === 429) {
          setServerError("Zbyt wiele prób. Spróbuj ponownie za chwilę.");
          return;
        }

        if (response.status >= 500) {
          setServerError("Wystąpił błąd serwera. Spróbuj ponownie za chwilę.");
          return;
        }

        // Generic error
        setServerError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
        return;
      }

      await response.json();

      // Success - redirect or call onSuccess
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.assign("/");
      }
    } catch {
      // Network error or JSON parsing error
      setServerError("Błąd połączenia. Sprawdź połączenie internetowe i spróbuj ponownie.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate data-testid="login-form">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={emailId}>Email</Label>
          <Input
            id={emailId}
            type="email"
            autoComplete="email"
            required
            {...register("email")}
            disabled={isSubmitting}
            aria-invalid={errors.email ? "true" : "false"}
            className="w-full"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor={passwordId}>Hasło</Label>
          <Input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            required
            {...register("password")}
            disabled={isSubmitting}
            aria-invalid={errors.password ? "true" : "false"}
            className="w-full"
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
      </div>

      {serverError && <FormMessage status="error" message={serverError} onClose={() => setServerError(null)} />}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </Button>
    </form>
  );
}
