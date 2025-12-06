import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/SearchInput";
import { TagFilterCombobox } from "@/components/TagFilterCombobox";
import { DishList } from "@/components/DishList";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import { FormMessage } from "@/components/FormMessage";
import { DishEditorOverlay } from "@/components/DishEditorOverlay";
import { FAB } from "@/components/FAB";
import { useDishListFilters } from "@/components/hooks/useDishListFilters";
import { useDebouncedValue } from "@/components/hooks/useDebouncedValue";
import { useAddDishDialog } from "@/components/hooks/useAddDishDialog";
import type { DishListResponse, TagListItemDTO, TagListResponse } from "@/types";

export function DishesView() {
  const { filters, updateFilters, resetFilters } = useDishListFilters();
  const debouncedSearch = useDebouncedValue(filters.q, 400);
  const { isOpen: isAddDishOpen, open: openAddDish, close: closeAddDish } = useAddDishDialog();

  const [dishes, setDishes] = useState<DishListResponse | null>(null);
  const [tags, setTags] = useState<TagListItemDTO[]>([]);
  const [isLoadingDishes, setIsLoadingDishes] = useState(true);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tags
  useEffect(() => {
    const controller = new AbortController();

    const fetchTags = async () => {
      setIsLoadingTags(true);
      try {
        const response = await fetch("/api/tags?includeCounts=true", {
          signal: controller.signal,
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error("Nie udało się wczytać tagów");
        }

        const data: TagListResponse = await response.json();
        setTags(data.data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Error fetching tags:", err);
        }
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();

    return () => {
      controller.abort();
    };
  }, []);

  // Fetch dishes
  useEffect(() => {
    const controller = new AbortController();

    const fetchDishes = async () => {
      setIsLoadingDishes(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(filters.page),
          pageSize: String(filters.pageSize),
          sort: filters.sort,
        });

        if (debouncedSearch) {
          params.set("q", debouncedSearch);
        }

        filters.tagIds.forEach((tagId) => {
          params.append("tagId", tagId);
        });

        const response = await fetch(`/api/dishes?${params.toString()}`, {
          signal: controller.signal,
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 422) {
          setError("Nieprawidłowe parametry wyszukiwania");
          resetFilters();
          return;
        }

        if (response.status === 429) {
          setError("Zbyt wiele zapytań. Spróbuj ponownie za chwilę.");
          return;
        }

        if (response.status >= 500) {
          setError("Wystąpił błąd serwera. Spróbuj ponownie za chwilę.");
          return;
        }

        if (!response.ok) {
          throw new Error("Nie udało się wczytać dań");
        }

        const data: DishListResponse = await response.json();
        setDishes(data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Error fetching dishes:", err);
          setError("Wystąpił błąd podczas wczytywania dań");
        }
      } finally {
        setIsLoadingDishes(false);
      }
    };

    fetchDishes();

    return () => {
      controller.abort();
    };
  }, [filters.page, filters.pageSize, filters.sort, filters.tagIds, debouncedSearch, resetFilters]);

  const handleEdit = useCallback((dishId: string) => {
    window.location.href = `/dishes/${dishId}/edit`;
  }, []);

  const handleAddNew = useCallback(() => {
    openAddDish();
  }, [openAddDish]);

  // Refetch dishes when a new dish is added
  const handleDishAdded = useCallback(() => {
    // Refetch dishes list
    const params = new URLSearchParams({
      page: String(filters.page),
      pageSize: String(filters.pageSize),
      sort: filters.sort,
    });

    if (debouncedSearch) {
      params.set("q", debouncedSearch);
    }

    filters.tagIds.forEach((tagId) => {
      params.append("tagId", tagId);
    });

    fetch(`/api/dishes?${params.toString()}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data: DishListResponse) => {
        if (data) {
          setDishes(data);
        }
      })
      .catch((error) => {
        console.error("Error refetching dishes:", error);
      });
  }, [filters.page, filters.pageSize, filters.sort, filters.tagIds, debouncedSearch]);

  const hasFilters = !!filters.q || filters.tagIds.length > 0;
  const isEmpty = dishes && dishes.data.length === 0;
  const hasNoData = !isLoadingDishes && isEmpty;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Page Title and Filters */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Baza dań</h1>

          {/* Filters */}
          <div className="space-y-4">
            <SearchInput
              value={filters.q || ""}
              onChange={(value) => updateFilters({ q: value || undefined })}
              isLoading={isLoadingDishes}
            />

            <TagFilterCombobox
              value={tags.filter((tag) => filters.tagIds.includes(tag.id))}
              onChange={(selectedTags) => updateFilters({ tagIds: selectedTags.map((tag) => tag.id) })}
              allTags={tags}
              isLoading={isLoadingTags}
            />

            {hasFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-4"
                  aria-hidden="true"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
                Wyczyść filtry
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && <FormMessage status="error" message={error} onClose={() => setError(null)} className="mb-6" />}

        {/* Content */}
        {hasNoData && !hasFilters && (
          <EmptyState
            title="Brak dań"
            description="Zacznij dodawać dania do swojej bazy, aby móc planować posiłki."
            action={{
              label: "Dodaj pierwsze danie",
              onClick: handleAddNew,
            }}
          />
        )}

        {hasNoData && hasFilters && (
          <EmptyState
            title="Brak wyników"
            description="Nie znaleziono dań pasujących do wybranych filtrów."
            action={{
              label: "Wyczyść filtry",
              onClick: resetFilters,
            }}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-12"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            }
          />
        )}

        {!hasNoData && (
          <>
            <DishList items={dishes?.data || []} onEdit={handleEdit} isLoading={isLoadingDishes} />

            {dishes && dishes.totalPages > 1 && (
              <Pagination
                page={filters.page}
                totalPages={dishes.totalPages}
                pageSize={filters.pageSize}
                onChange={(page) => updateFilters({ page })}
                onPageSizeChange={(pageSize) => updateFilters({ pageSize })}
                className="mt-8"
              />
            )}
          </>
        )}

        <DishEditorOverlay mode="create" isOpen={isAddDishOpen} onClose={closeAddDish} onSuccess={handleDishAdded} />

        <FAB onClick={handleAddNew} label="Dodaj danie" />
      </div>
    </div>
  );
}
