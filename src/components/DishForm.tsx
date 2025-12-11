import { useEffect, useState, useId, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/FormMessage";
import { TagCreatableCombobox } from "@/components/TagCreatableCombobox";
import type { TagDTO, DishDetailResponse, TagCreateCommand } from "@/types";

// Validation schema matching PRD requirements
const dishFormSchema = z.object({
  name: z
    .string()
    .min(3, "Nazwa musi mieć co najmniej 3 znaki")
    .max(80, "Nazwa może mieć maksymalnie 80 znaków")
    .trim(),
  tags: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
        userId: z.string(),
      })
    )
    .min(1, "Wybierz co najmniej 1 tag"),
  recipeText: z
    .string()
    .max(2000, "Przepis może mieć maksymalnie 2000 znaków")
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val)),
  url: z
    .string()
    .max(255, "URL może mieć maksymalnie 255 znaków")
    .url("Podaj poprawny URL")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
});

type DishFormValues = z.infer<typeof dishFormSchema>;

interface DishFormProps {
  mode: "create" | "edit";
  dishId?: string;
  onSuccess: (dishId: string) => void;
  onCancel: () => void;
}

export function DishForm({ mode, dishId, onSuccess, onCancel }: DishFormProps) {
  const nameId = useId();
  const recipeId = useId();
  const urlId = useId();

  const [isLoadingDish, setIsLoadingDish] = useState(mode === "edit");
  const [availableTags, setAvailableTags] = useState<TagDTO[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<DishFormValues>({
    resolver: zodResolver(dishFormSchema),
    defaultValues: {
      name: "",
      tags: [],
      recipeText: "",
      url: "",
    },
  });

  const selectedTags = watch("tags");

  // Fetch available tags
  useEffect(() => {
    const controller = new AbortController();

    const fetchTags = async () => {
      try {
        const response = await fetch("/api/tags", {
          signal: controller.signal,
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error("Nie udało się wczytać tagów");
        }

        const data = await response.json();
        setAvailableTags(data.data);
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

  // Fetch dish data if editing
  useEffect(() => {
    if (mode !== "edit" || !dishId) return;

    const controller = new AbortController();

    const fetchDish = async () => {
      try {
        const response = await fetch(`/api/dishes/${dishId}`, {
          signal: controller.signal,
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 404) {
          setError("Nie znaleziono dania");
          setTimeout(() => onCancel(), 2000);
          return;
        }

        if (!response.ok) {
          throw new Error("Nie udało się wczytać dania");
        }

        const { data: dishData }: { data: DishDetailResponse } = await response.json();
        reset({
          name: dishData.name,
          tags: dishData.tags,
          recipeText: dishData.recipeText || "",
          url: dishData.url || "",
        });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Error fetching dish:", err);
          setError("Wystąpił błąd podczas wczytywania dania");
        }
      } finally {
        setIsLoadingDish(false);
      }
    };

    fetchDish();

    return () => {
      controller.abort();
    };
  }, [mode, dishId, reset, onCancel]);

  const handleCreateTag = useCallback(async (name: string): Promise<TagDTO> => {
    const command: TagCreateCommand = { name: name.toLowerCase().trim() };

    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });

    if (response.status === 409) {
      // Tag already exists, fetch all tags to find it
      const tagsResponse = await fetch("/api/tags");
      const tagsData = await tagsResponse.json();
      const existingTag = tagsData.data.find((tag: TagDTO) => tag.name.toLowerCase() === name.toLowerCase());
      if (existingTag) {
        setAvailableTags((prev) => {
          if (prev.some((t) => t.id === existingTag.id)) return prev;
          return [...prev, existingTag];
        });
        return existingTag;
      }
    }

    if (!response.ok) {
      throw new Error("Nie udało się utworzyć tagu");
    }

    const { data }: { data: TagDTO } = await response.json();
    const newTag = data;
    setAvailableTags((prev) => [...prev, newTag]);
    return newTag;
  }, []);

  const handleDeleteTag = useCallback(async (tag: TagDTO): Promise<boolean> => {
    const response = await fetch(`/api/tags/${tag.id}`, {
      method: "DELETE",
    });

    if (response.status === 404) {
      // Tag already deleted
      setAvailableTags((prev) => prev.filter((t) => t.id !== tag.id));
      return true;
    }

    if (!response.ok) {
      throw new Error("Nie udało się usunąć tagu");
    }

    setAvailableTags((prev) => prev.filter((t) => t.id !== tag.id));
    return true;
  }, []);

  const onSubmit = async (formValues: DishFormValues) => {
    setError(null);

    try {
      const tagIds = formValues.tags.map((tag) => tag.id);
      if (tagIds.length === 0) {
        setError("Wybierz co najmniej 1 tag");
        return;
      }

      if (mode === "create") {
        const command = {
          name: formValues.name,
          tagIds: tagIds as [string, ...string[]],
          recipeText: formValues.recipeText,
          url: formValues.url,
        };

        const response = await fetch("/api/dishes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 422) {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.message || "Sprawdź poprawność danych");
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
          throw new Error("Nie udało się utworzyć dania");
        }

        const { data: createdDish } = await response.json();
        onSuccess(createdDish.id);
      } else {
        const command = {
          name: formValues.name,
          tagIds: tagIds as [string, ...string[]],
          recipeText: formValues.recipeText || null,
          url: formValues.url || null,
        };

        const response = await fetch(`/api/dishes/${dishId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 404) {
          setError("Nie znaleziono dania");
          return;
        }

        if (response.status === 422) {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.message || "Sprawdź poprawność danych");
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
          throw new Error("Nie udało się zaktualizować dania");
        }

        const { data: updatedDish } = await response.json();
        onSuccess(updatedDish.id);
      }
    } catch (err) {
      console.error("Error submitting dish:", err);
      setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
    }
  };

  if (isLoadingDish) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="size-8 animate-spin text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate data-testid="dish-form">
      <div className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor={nameId}>
            Nazwa dania <span className="text-destructive">*</span>
          </Label>
          <Input
            id={nameId}
            {...register("name")}
            placeholder="np. Spaghetti Carbonara"
            maxLength={80}
            disabled={isSubmitting}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          <p className="text-xs text-muted-foreground">Nazwa dania (3-80 znaków)</p>
        </div>

        {/* Tags Field */}
        <div className="space-y-2">
          <Label>
            Tagi <span className="text-destructive">*</span>
          </Label>
          <TagCreatableCombobox
            value={selectedTags}
            onChange={(tags) => setValue("tags", tags, { shouldValidate: true })}
            onCreate={handleCreateTag}
            onDelete={handleDeleteTag}
            options={availableTags}
            isLoading={isLoadingTags}
          />
          {errors.tags && <p className="text-sm text-destructive">{errors.tags.message}</p>}
          <p className="text-xs text-muted-foreground">Wybierz lub utwórz tagi (2-30 znaków)</p>
        </div>

        {/* Recipe Text Field */}
        <div className="space-y-2">
          <Label htmlFor={recipeId}>Przepis</Label>
          <Textarea
            id={recipeId}
            {...register("recipeText")}
            placeholder="Opisz przepis..."
            rows={6}
            maxLength={2000}
            disabled={isSubmitting}
            aria-invalid={errors.recipeText ? "true" : "false"}
          />
          {errors.recipeText && <p className="text-sm text-destructive">{errors.recipeText.message}</p>}
          <p className="text-xs text-muted-foreground">{watch("recipeText")?.length || 0}/2000 znaków</p>
        </div>

        {/* URL Field */}
        <div className="space-y-2">
          <Label htmlFor={urlId}>Link do przepisu</Label>
          <Input
            id={urlId}
            type="url"
            {...register("url")}
            placeholder="https://example.com/recipe"
            maxLength={255}
            disabled={isSubmitting}
            aria-invalid={errors.url ? "true" : "false"}
          />
          {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
          <p className="text-xs text-muted-foreground">URL do przepisu (maks. 255 znaków)</p>
        </div>
      </div>

      {error && <FormMessage status="error" message={error} onClose={() => setError(null)} />}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Zapisywanie..." : mode === "create" ? "Dodaj danie" : "Zapisz zmiany"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Anuluj
        </Button>
      </div>
    </form>
  );
}
