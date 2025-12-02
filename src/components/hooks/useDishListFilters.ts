import { useCallback, useEffect, useState } from "react";

export interface DishListFilters {
  q?: string;
  tagIds: string[];
  page: number;
  pageSize: number;
  sort: "created_desc" | "name_asc" | "usage_prio";
}

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_SORT = "created_desc";

/**
 * Hook for managing dish list filters with URL query parameter synchronization.
 * Reads filter values from URL on mount and updates URL when filters change.
 */
export function useDishListFilters() {
  const [filters, setFilters] = useState<DishListFilters>(() => {
    // Only run on client-side
    if (typeof window === "undefined") {
      return {
        q: undefined,
        tagIds: [],
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        sort: DEFAULT_SORT,
      };
    }

    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || undefined;
    const tagIds = params.getAll("tagId");
    const page = parseInt(params.get("page") || "1", 10);
    const pageSize = parseInt(params.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10);
    const sort = (params.get("sort") as DishListFilters["sort"]) || DEFAULT_SORT;

    return {
      q,
      tagIds,
      page: page > 0 ? page : 1,
      pageSize: pageSize > 0 && pageSize <= 100 ? pageSize : DEFAULT_PAGE_SIZE,
      sort,
    };
  });

  // Sync filters to URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();

    if (filters.q) {
      params.set("q", filters.q);
    }

    filters.tagIds.forEach((tagId) => {
      params.append("tagId", tagId);
    });

    params.set("page", String(filters.page));
    params.set("pageSize", String(filters.pageSize));
    params.set("sort", filters.sort);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [filters]);

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
    setFilters({
      q: undefined,
      tagIds: [],
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sort: DEFAULT_SORT,
    });
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}
