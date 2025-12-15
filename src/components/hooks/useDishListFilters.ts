import { useCallback, useEffect, useState } from "react";

export interface DishListFilters {
  q?: string;
  tagIds: string[];
  page: number;
  pageSize: number;
  sort: "created_desc" | "created_asc" | "name_asc" | "name_desc" | "last_used_asc" | "last_used_desc";
}

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT = "name_asc";

const createDefaultFilters = (): DishListFilters => ({
  q: undefined,
  tagIds: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  sort: DEFAULT_SORT,
});

/**
 * Hook for managing dish list filters in component state only.
 * Keeps URL clean (/dishes) by avoiding query param syncing.
 */
export function useDishListFilters() {
  const [filters, setFilters] = useState<DishListFilters>(() => createDefaultFilters());

  // Strip any existing query params from the URL on first render.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const updateFilters = useCallback((updates: Partial<DishListFilters>) => {
    setFilters((prev) => {
      const newFilters = { ...prev, ...updates };

      // Reset page to 1 when changing search or tags
      if ("q" in updates || "tagIds" in updates) {
        newFilters.page = 1;
      }

      return newFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(createDefaultFilters());
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}
