import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/SearchInput";
import { TagFilterCombobox } from "@/components/TagFilterCombobox";
import { DishList } from "@/components/DishList";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import { FormMessage } from "@/components/FormMessage";
import { DishEditorOverlay } from "@/components/DishEditorOverlay";
import { FAB } from "@/components/FAB";
import { CloseIcon, MagnifyingGlassIcon } from "@/components/icons";
import { useDishListFilters } from "@/components/hooks/useDishListFilters";
import { useDebouncedValue } from "@/components/hooks/useDebouncedValue";
import { useAddDishDialog } from "@/components/hooks/useAddDishDialog";
import { useQuery } from "@/lib/http/hooks";
import type { DishListResponse, TagListResponse } from "@/types";

export function DishesView() {
  const { filters, updateFilters, resetFilters } = useDishListFilters();
  const debouncedSearch = useDebouncedValue(filters.q, 400);
  const { isOpen: isAddDishOpen, open: openAddDish, close: closeAddDish } = useAddDishDialog();

  const [error, setError] = useState<string | null>(null);

  const tagsQuery = useQuery<TagListResponse>("/api/tags?includeCounts=true", {
    onError: (apiError) => {
      setError(apiError.message);
    },
  });

  const dishesUrl = useMemo(() => {
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

    return `/api/dishes?${params.toString()}`;
  }, [debouncedSearch, filters.page, filters.pageSize, filters.sort, filters.tagIds]);

  const {
    data: dishes,
    isLoading: isLoadingDishes,
    refetch: refetchDishes,
  } = useQuery<DishListResponse>(dishesUrl, {
    onSuccess: () => {
      setError(null);
    },
    onError: (apiError) => {
      if (apiError.status === 422) {
        setError("Nieprawidlowe parametry wyszukiwania");
        resetFilters();
        return;
      }
      setError(apiError.message);
    },
  });

  const tags = tagsQuery.data?.data ?? [];
  const isLoadingTags = tagsQuery.isLoading;

  const handleEdit = useCallback((dishId: string) => {
    window.location.href = `/dishes/${dishId}/edit`;
  }, []);

  const handleAddNew = useCallback(() => {
    openAddDish();
  }, [openAddDish]);

  const reloadDishes = useCallback(() => {
    refetchDishes().catch(() => {
      return;
    });
  }, [refetchDishes]);

  const hasFilters = !!filters.q || filters.tagIds.length > 0;
  const isEmpty = dishes && dishes.data.length === 0;
  const hasNoData = !isLoadingDishes && isEmpty;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Page Title and Filters */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Baza dan</h1>

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
                <CloseIcon />
                Wyczysc filtry
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && <FormMessage status="error" message={error} onClose={() => setError(null)} className="mb-6" />}

        {/* Content */}
        {hasNoData && !hasFilters && (
          <EmptyState
            title="Brak dan"
            description="Zacznij dodawac dania do swojej bazy, aby moc planowac posilki."
            action={{
              label: "Dodaj pierwsze danie",
              onClick: handleAddNew,
            }}
          />
        )}

        {hasNoData && hasFilters && (
          <EmptyState
            title="Brak wynikow"
            description="Nie znaleziono dan pasujacych do wybranych filtrow."
            action={{
              label: "Wyczysc filtry",
              onClick: resetFilters,
            }}
            icon={<MagnifyingGlassIcon />}
          />
        )}

        {!hasNoData && (
          <>
            <DishList
              items={dishes?.data || []}
              onEdit={handleEdit}
              onDeleteSuccess={reloadDishes}
              isLoading={isLoadingDishes}
            />

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

        <DishEditorOverlay mode="create" isOpen={isAddDishOpen} onClose={closeAddDish} onSuccess={reloadDishes} />

        <FAB onClick={handleAddNew} label="Dodaj danie" />
      </div>
    </div>
  );
}
