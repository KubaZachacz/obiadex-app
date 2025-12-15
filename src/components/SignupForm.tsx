import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/FormMessage";
import type { AuthSignupCommand } from "@/types";

interface SignupFormProps {
  onSuccess?: () => void;
  defaultEmail?: string;
}

const signupFormSchema = z.object({
  email: z.string().trim().min(1, "Email jest wymagany").email("Podaj poprawny adres email"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .refine((value) => value.trim() === value, {
      message: "Hasło nie może zaczynać się ani kończyć spacją",
    }),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupForm({ onSuccess, defaultEmail = "" }: SignupFormProps) {
  const emailId = useId();
  const passwordId = useId();

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: defaultEmail,
      password: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      const command: AuthSignupCommand = {
        email: values.email.trim(),
        password: values.password,
      };

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 409) {
          setServerError("Konto z tym adresem email już istnieje. Spróbuj się zalogować.");
          return;
        }

        if (response.status === 422) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || "Sprawdź poprawność danych rejestracji";
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

        setServerError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
        return;
      }

      await response.json();

      setSuccessMessage("Konto zostało utworzone pomyślnie! Przekierowywanie...");

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.assign("/login");
        }
      }, 1500);
    } catch {
      setServerError("Błąd połączenia. Sprawdź połączenie internetowe i spróbuj ponownie.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate data-testid="signup-form">
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
            autoComplete="new-password"
            required
            {...register("password")}
            disabled={isSubmitting}
            aria-invalid={errors.password ? "true" : "false"}
            className="w-full"
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          <p className="text-xs text-muted-foreground">Minimum 8 znaków</p>
        </div>
      </div>

      {serverError && <FormMessage status="error" message={serverError} onClose={() => setServerError(null)} />}

      {successMessage && <FormMessage status="success" message={successMessage} autoHide={true} />}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Tworzenie konta..." : "Załóż konto"}
      </Button>
    </form>
  );
}

