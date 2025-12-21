import { useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/FormMessage";
import { useMutation } from "@/lib/http/hooks";
import type { AuthSignupCommand, AuthSignupResponse } from "@/types";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: defaultEmail,
      password: "",
    },
  });

  const { mutateAsync, isSubmitting, error, reset } = useMutation<AuthSignupResponse, AuthSignupCommand>(
    "/api/auth/signup",
    {
      successMessage: "Konto zostalo utworzone pomyslnie.",
      onSuccess: () => {
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            window.location.assign("/login");
          }
        }, 1500);
      },
    }
  );

  const onSubmit = async (values: SignupFormValues) => {
    const command: AuthSignupCommand = {
      email: values.email.trim(),
      password: values.password,
    };

    try {
      await mutateAsync(command);
    } catch {
      return;
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

      {error && <FormMessage status="error" message={error.message} onClose={reset} />}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Tworzenie konta..." : "Załóż konto"}
      </Button>
    </form>
  );
}
