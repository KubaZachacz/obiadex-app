import { useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/FormMessage";
import { useMutation } from "@/lib/http/hooks";
import type { AuthLoginCommand, AuthLoginResponse } from "@/types";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: defaultEmail,
      password: "",
    },
  });

  const { mutateAsync, isSubmitting, error, reset } = useMutation<AuthLoginResponse, AuthLoginCommand>(
    "/api/auth/login",
    {
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.assign("/");
        }
      },
    }
  );

  const onSubmit = async (values: LoginFormValues) => {
    const command: AuthLoginCommand = {
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
            data-testid="login-email"
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
            data-testid="login-password"
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
      </div>

      {error && <FormMessage status="error" message={error.message} onClose={reset} />}

      <Button type="submit" disabled={isSubmitting} className="w-full" data-testid="login-submit">
        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </Button>
    </form>
  );
}
