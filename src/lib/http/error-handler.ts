import axios from "axios";
import { toast } from "sonner";
import type { ApiError } from "./types";

const ERROR_MESSAGES: Record<number, string> = {
  401: "Sesja wygasla. Zaloguj sie ponownie.",
  403: "Brak dostepu do zasobu.",
  404: "Nie znaleziono zasobu.",
  409: "Zasob juz istnieje.",
  422: "Nieprawidlowe dane.",
  429: "Zbyt wiele prob. Sprobuj ponownie pozniej.",
  500: "Wystapil blad serwera. Sprobuj ponownie pozniej.",
  503: "Usluga chwilowo niedostepna. Sprobuj ponownie pozniej.",
};

export function handleApiError(error: unknown, showToast = true): ApiError {
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
      "Wystapil nieoczekiwany blad.";

    if (status === 401 && typeof window !== "undefined") {
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

  const fallbackMessage = error instanceof Error ? error.message : "Wystapil nieoczekiwany blad.";
  if (showToast) {
    toast.error(fallbackMessage);
  }

  return {
    message: fallbackMessage,
  };
}
