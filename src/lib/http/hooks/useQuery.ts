import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { apiClient } from "../axios.config";
import { handleApiError } from "../error-handler";
import type { ApiError, UseQueryOptions, UseQueryResult } from "../types";

export function useQuery<TData>(url: string | null, options: UseQueryOptions<TData> = {}): UseQueryResult<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
  }, [options.onSuccess]);

  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const fetchNow = useCallback(async (): Promise<TData | null> => {
    if (!url) {
      return null;
    }

    abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<TData>(url, { signal: controller.signal });
      setData(response.data);
      onSuccessRef.current?.(response.data);
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.code === "ERR_CANCELED") {
        return null;
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        return null;
      }
      const apiError = handleApiError(err);
      setError(apiError);
      onErrorRef.current?.(apiError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [abort, url]);

  useEffect(() => {
    if (!url || options.enabled === false) {
      return () => {
        abort();
      };
    }

    const debounceMs = options.debounce ?? 0;

    if (debounceMs > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        fetchNow();
      }, debounceMs);
    } else {
      fetchNow();
    }

    return () => {
      abort();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [abort, fetchNow, options.debounce, options.enabled, url]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchNow,
    abort,
  };
}
