import { useState, useEffect, useCallback, useMemo } from "react";
import type { DishListItemDTO, DishListResponse, TagDTO, TagListResponse, DayPlanUpsertCommand } from "@/types";
import { useMutation, useQuery } from "@/lib/http/hooks";

interface DishPickerState {
  day: string;
  tags: TagDTO[];
  nameSearch: string;
  dishes: DishListItemDTO[];
  selectedId?: string;
  saving: boolean;
}

interface UseDishPickerReturn {
  state: DishPickerState;
  allTags: TagDTO[];
  isLoadingTags: boolean;
  isLoadingDishes: boolean;
  error: string | null;
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
  const [selectedTags, setSelectedTagsState] = useState<TagDTO[]>([]);
  const [nameSearch, setNameSearchState] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    data: tagsData,
    isLoading: isLoadingTags,
    refetch: refetchTags,
  } = useQuery<TagListResponse>("/api/tags?includeCounts=true", { enabled: false });

  useEffect(() => {
    refetchTags().catch(() => {
      return;
    });
  }, [refetchTags]);

  const dishesUrl = useMemo(() => {
    const params = new URLSearchParams({
      sort: "last_used_asc",
      page: "1",
      pageSize: "50",
    });

    selectedTags.forEach((tag) => {
      params.append("tagId", tag.id);
    });

    if (nameSearch.trim()) {
      params.append("q", nameSearch.trim());
    }

    return `/api/dishes?${params.toString()}`;
  }, [nameSearch, selectedTags]);

  const {
    data: dishesData,
    isLoading: isLoadingDishes,
    error: dishesError,
    refetch: refetchDishesQuery,
  } = useQuery<DishListResponse>(dishesUrl, {
    debounce: 300,
  });

  const saveDayPlanMutation = useMutation<unknown, DayPlanUpsertCommand>(() => `/api/day-plans/${day}`, {
    method: "PUT",
  });

  const selectDish = useCallback((dishId: string) => {
    setSelectedId((prev) => (prev === dishId ? undefined : dishId));
    setValidationError(null);
  }, []);

  const setSelectedTags = useCallback((tags: TagDTO[]) => {
    setSelectedTagsState(tags);
    setSelectedId(undefined);
  }, []);

  const setNameSearch = useCallback((search: string) => {
    setNameSearchState(search);
    setSelectedId(undefined);
  }, []);

  const saveDayPlan = useCallback(async (): Promise<boolean> => {
    if (!selectedId) {
      setValidationError("Wybierz danie przed zapisaniem");
      return false;
    }

    try {
      const body: DayPlanUpsertCommand = {
        dishId: selectedId,
      };

      await saveDayPlanMutation.mutateAsync(body);
      setValidationError(null);
      return true;
    } catch {
      return false;
    }
  }, [saveDayPlanMutation, selectedId]);

  const refetchDishes = useCallback(() => {
    refetchDishesQuery().catch(() => {
      return;
    });
  }, [refetchDishesQuery]);

  const dishes = dishesData?.data ?? [];
  const error = validationError ?? saveDayPlanMutation.error?.message ?? dishesError?.message ?? null;

  return {
    state: {
      day,
      tags: selectedTags,
      nameSearch,
      dishes,
      selectedId,
      saving: saveDayPlanMutation.isSubmitting,
    },
    allTags: tagsData?.data ?? [],
    isLoadingTags,
    isLoadingDishes,
    error,
    selectDish,
    setSelectedTags,
    setNameSearch,
    saveDayPlan,
    refetchDishes,
  };
}
