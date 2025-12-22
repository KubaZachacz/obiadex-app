import axios from "axios";
import { toast } from "sonner";
import type { ApiError } from "./types";

const ERROR_MESSAGES: Record<number, string> = {
  401: "Sesja wygasła. Zaloguj się ponownie.",
  403: "Brak dostępu do zasobu.",
  404: "Nie znaleziono zasobu.",
  409: "Zasób już istnieje.",
  422: "Nieprawidłowe dane.",
  429: "Zbyt wiele prób. Spróbuj ponownie później.",
  500: "Wystąpił błąd serwera. Spróbuj ponownie później.",
  503: "Usługa chwilowo niedostępna. Spróbuj ponownie później.",
};

interface HandleApiErrorOptions {
  showToast?: boolean;
  redirectOnUnauthorized?: boolean;
}

export function handleApiError(error: unknown, options: HandleApiErrorOptions = {}): ApiError {
  const { showToast = true, redirectOnUnauthorized = true } = options;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data as
      | {
          message?: string;
          error?: string;
          code?: string;
          details?: unknown;
        }
      | undefined;
    const message =
      responseData?.message ||
      responseData?.error ||
      (status ? ERROR_MESSAGES[status] : undefined) ||
      "Wystąpił nieoczekiwany błąd.";

    if (status === 401 && redirectOnUnauthorized && typeof window !== "undefined") {
      window.location.assign("/login");
    }

    if (showToast) {
      toast.error(message);
    }

    return {
      status,
      message,
      code: responseData?.code,
      details: responseData?.details,
    };
  }

  const fallbackMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd.";
  if (showToast) {
    toast.error(fallbackMessage);
  }

  return {
    message: fallbackMessage,
  };
}
