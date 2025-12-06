import { useState, useEffect, useCallback, useRef } from "react";
import type { DishListItemDTO, DishListResponse, TagDTO, TagListResponse, DayPlanUpsertCommand } from "@/types";

interface DishPickerState {
  day: string;
  tags: TagDTO[];
  nameSearch: string;
  dishes: DishListItemDTO[];
  selectedId?: string;
  status: "idle" | "loading" | "error";
  saving: boolean;
  error?: string;
}

interface UseDishPickerReturn {
  state: DishPickerState;
  allTags: TagDTO[];
  isLoadingTags: boolean;
  selectDish: (dishId: string) => void;
  setSelectedTags: (tags: TagDTO[]) => void;
  setNameSearch: (search: string) => void;
  saveDayPlan: () => Promise<boolean>;
  refetchDishes: () => void;
}

/**
 * Custom hook for managing dish picker state, fetching tags, dishes,
 * and saving day plans.
 */
export function useDishPicker(day: string): UseDishPickerReturn {
  const [state, setState] = useState<DishPickerState>({
    day,
    tags: [],
    nameSearch: "",
    dishes: [],
    selectedId: undefined,
    status: "idle",
    saving: false,
    error: undefined,
  });

  const [allTags, setAllTags] = useState<TagDTO[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoadingTags(true);
        const response = await fetch("/api/tags?includeCounts=true");

        if (!response.ok) {
          throw new Error(`Failed to fetch tags: ${response.status}`);
        }

        const data: TagListResponse = await response.json();
        setAllTags(data.data);
      } catch (err) {
        console.error("Failed to fetch tags:", err);
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();
  }, []);

  // Fetch dishes based on selected tags
  const fetchDishes = useCallback(
    async (signal: AbortSignal) => {
      try {
        setState((prev) => ({ ...prev, status: "loading", error: undefined }));

        const params = new URLSearchParams({
          sort: "last_used_asc",
          page: "1",
          pageSize: "50",
        });

        // Add tag filters (AND logic)
        state.tags.forEach((tag) => {
          params.append("tagId", tag.id);
        });

        // Add name search filter
        if (state.nameSearch.trim()) {
          params.append("q", state.nameSearch.trim());
        }

        const response = await fetch(`/api/dishes?${params.toString()}`, {
          signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }
          throw new Error(`Failed to fetch dishes: ${response.status}`);
        }

        const data: DishListResponse = await response.json();

        setState((prev) => ({
          ...prev,
          dishes: data.data,
          status: "idle",
        }));
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "AbortError") return;
          setState((prev) => ({
            ...prev,
            status: "error",
            error: err.message,
          }));
        }
      }
    },
    [state.tags, state.nameSearch]
  );

  // Debounced fetch effect
  useEffect(() => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Debounce fetch by 300ms
    debounceTimerRef.current = setTimeout(() => {
      fetchDishes(controller.signal);
    }, 300);

    return () => {
      controller.abort();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchDishes]);

  const selectDish = useCallback((dishId: string) => {
    setState((prev) => ({
      ...prev,
      selectedId: prev.selectedId === dishId ? undefined : dishId,
    }));
  }, []);

  const setSelectedTags = useCallback((tags: TagDTO[]) => {
    setState((prev) => ({
      ...prev,
      tags,
      selectedId: undefined, // Reset selection when filters change
    }));
  }, []);

  const setNameSearch = useCallback((search: string) => {
    setState((prev) => ({
      ...prev,
      nameSearch: search,
      selectedId: undefined, // Reset selection when filters change
    }));
  }, []);

  const saveDayPlan = useCallback(async (): Promise<boolean> => {
    if (!state.selectedId) {
      setState((prev) => ({
        ...prev,
        error: "Wybierz danie przed zapisaniem",
      }));
      return false;
    }

    try {
      setState((prev) => ({ ...prev, saving: true, error: undefined }));

      const body: DayPlanUpsertCommand = {
        dishId: state.selectedId,
      };

      const response = await fetch(`/api/day-plans/${day}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return false;
        }
        if (response.status === 404) {
          throw new Error("Wybrane danie nie istnieje");
        }
        if (response.status === 422) {
          throw new Error("Nieprawidłowe dane");
        }
        throw new Error(`Failed to save day plan: ${response.status}`);
      }

      await response.json();

      setState((prev) => ({ ...prev, saving: false }));
      return true;
    } catch (err) {
      if (err instanceof Error) {
        setState((prev) => ({
          ...prev,
          saving: false,
          error: err.message,
        }));
      }
      return false;
    }
  }, [state.selectedId, day]);

  const refetchDishes = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchDishes(controller.signal);
  }, [fetchDishes]);

  return {
    state,
    allTags,
    isLoadingTags,
    selectDish,
    setSelectedTags,
    setNameSearch,
    saveDayPlan,
    refetchDishes,
  };
}
