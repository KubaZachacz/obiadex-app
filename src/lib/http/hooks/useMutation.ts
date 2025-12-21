import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { apiClient } from "../axios.config";
import { handleApiError } from "../error-handler";
import type { ApiError, UseMutationOptions, UseMutationResult } from "../types";

export function useMutation<TData, TVariables>(
  url: string | ((variables: TVariables) => string),
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const method = options.method ?? "POST";

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setError(null);

      const resolvedUrl = typeof url === "function" ? url(variables) : url;

      try {
        const response = await apiClient.request<TData>({
          url: resolvedUrl,
          method,
          data: variables,
        });
        const data = response.data;

        if (options.successMessage) {
          toast.success(options.successMessage);
        }

        options.onSuccess?.(data, variables);
        return data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.code === "ERR_CANCELED") {
          throw err;
        }

        const apiError = handleApiError(err, options.showErrorToast !== false);
        setError(apiError);
        options.onError?.(apiError, variables);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [method, options, url]
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      mutateAsync(variables).catch(() => {
        return;
      });
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  const isDeleting = useMemo(() => isLoading && method === "DELETE", [isLoading, method]);
  const isSubmitting = useMemo(() => isLoading && method !== "DELETE", [isLoading, method]);

  return {
    mutate,
    mutateAsync,
    isLoading,
    isSubmitting,
    isDeleting,
    error,
    reset,
  };
}
