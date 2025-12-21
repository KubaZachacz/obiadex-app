export interface ApiError {
  status?: number;
  message: string;
  code?: string;
  details?: unknown;
}

export interface UseQueryOptions<TData> {
  enabled?: boolean;
  debounce?: number;
  onSuccess?: (data: TData) => void;
  onError?: (error: ApiError) => void;
}

export interface UseQueryResult<TData> {
  data: TData | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<TData | null>;
  abort: () => void;
}

export interface UseMutationOptions<TData, TVariables> {
  method?: "POST" | "PUT" | "DELETE";
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: ApiError, variables: TVariables) => void;
  successMessage?: string;
  showErrorToast?: boolean;
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  error: ApiError | null;
  reset: () => void;
}
