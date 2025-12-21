import { useEffect, useState, useId, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/FormMessage";
import { TagCreatableCombobox } from "@/components/TagCreatableCombobox";
import { LoadingSpinnerIcon } from "@/components/icons";
import { useMutation, useQuery } from "@/lib/http/hooks";
import type {
  DishCreateCommand,
  DishDTO,
  DishDetailResponse,
  DishUpdateCommand,
  TagCreateCommand,
  TagDTO,
  TagListResponse,
} from "@/types";

// Validation schema matching PRD requirements
const dishFormSchema = z.object({
  name: z
    .string()
    .min(3, "Nazwa musi miec co najmniej 3 znaki")
    .max(80, "Nazwa moze miec maksymalnie 80 znakow")
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
    .max(2000, "Przepis moze miec maksymalnie 2000 znakow")
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val)),
  url: z
    .string()
    .max(255, "URL moze miec maksymalnie 255 znakow")
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

  const [availableTags, setAvailableTags] = useState<TagDTO[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
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

  const { data: tagsResponse, isLoading: isLoadingTags, refetch: refetchTags } = useQuery<TagListResponse>("/api/tags");

  useEffect(() => {
    if (tagsResponse?.data) {
      setAvailableTags(tagsResponse.data);
    }
  }, [tagsResponse]);

  const { isLoading: isLoadingDish } = useQuery<{ data: DishDetailResponse }>(
    mode === "edit" && dishId ? `/api/dishes/${dishId}` : null,
    {
      enabled: mode === "edit" && !!dishId,
      onSuccess: (response) => {
        setErrorMessage(null);
        reset({
          name: response.data.name,
          tags: response.data.tags,
          recipeText: response.data.recipeText || "",
          url: response.data.url || "",
        });
      },
      onError: (apiError) => {
        if (apiError.status === 404) {
          setErrorMessage("Nie znaleziono dania");
          setTimeout(() => onCancel(), 2000);
          return;
        }
        setErrorMessage(apiError.message);
      },
    }
  );

  const createTagMutation = useMutation<{ data: TagDTO }, TagCreateCommand>("/api/tags", {
    onSuccess: (response) => {
      setAvailableTags((prev) => {
        if (prev.some((tag) => tag.id === response.data.id)) {
          return prev;
        }
        return [...prev, response.data];
      });
    },
  });

  const deleteTagMutation = useMutation<unknown, { tagId: string }>((variables) => `/api/tags/${variables.tagId}`, {
    method: "DELETE",
    onSuccess: (_, variables) => {
      setAvailableTags((prev) => prev.filter((tag) => tag.id !== variables.tagId));
    },
  });

  const createDishMutation = useMutation<{ data: DishDTO }, DishCreateCommand>("/api/dishes", {
    onSuccess: (response) => {
      setErrorMessage(null);
      onSuccess(response.data.id);
    },
    onError: (apiError) => {
      setErrorMessage(apiError.message);
    },
  });

  const updateDishMutation = useMutation<{ data: DishDTO }, DishUpdateCommand>(() => `/api/dishes/${dishId}`, {
    method: "PUT",
    onSuccess: (response) => {
      setErrorMessage(null);
      onSuccess(response.data.id);
    },
    onError: (apiError) => {
      setErrorMessage(apiError.message);
    },
  });

  const handleCreateTag = useCallback(
    async (name: string): Promise<TagDTO> => {
      const command: TagCreateCommand = { name: name.toLowerCase().trim() };

      try {
        const response = await createTagMutation.mutateAsync(command);
        return response.data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          const refreshed = await refetchTags();
          const existingTag = refreshed?.data.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
          if (existingTag) {
            setAvailableTags((prev) => {
              if (prev.some((tag) => tag.id === existingTag.id)) {
                return prev;
              }
              return [...prev, existingTag];
            });
            return existingTag;
          }
        }
        throw err;
      }
    },
    [createTagMutation, refetchTags]
  );

  const handleDeleteTag = useCallback(
    async (tag: TagDTO): Promise<boolean> => {
      try {
        await deleteTagMutation.mutateAsync({ tagId: tag.id });
        return true;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setAvailableTags((prev) => prev.filter((item) => item.id !== tag.id));
          return true;
        }
        return false;
      }
    },
    [deleteTagMutation]
  );

  const onSubmit = async (formValues: DishFormValues) => {
    setErrorMessage(null);

    const tagIds = formValues.tags.map((tag) => tag.id);
    if (tagIds.length === 0) {
      setErrorMessage("Wybierz co najmniej 1 tag");
      return;
    }

    if (mode === "create") {
      const command: DishCreateCommand = {
        name: formValues.name,
        tagIds: tagIds as [string, ...string[]],
        recipeText: formValues.recipeText,
        url: formValues.url,
      };

      try {
        await createDishMutation.mutateAsync(command);
      } catch {
        return;
      }
    } else {
      if (!dishId) {
        setErrorMessage("Brak identyfikatora dania");
        return;
      }

      const command: DishUpdateCommand = {
        name: formValues.name,
        tagIds: tagIds as [string, ...string[]],
        recipeText: formValues.recipeText || null,
        url: formValues.url || null,
      };

      try {
        await updateDishMutation.mutateAsync(command);
      } catch {
        return;
      }
    }
  };

  if (isLoadingDish) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinnerIcon className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSubmitting = createDishMutation.isSubmitting || updateDishMutation.isSubmitting;

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
          <p className="text-xs text-muted-foreground">Nazwa dania (3-80 znakow)</p>
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
          <p className="text-xs text-muted-foreground">Wybierz lub utworz tagi (2-30 znakow)</p>
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
          <p className="text-xs text-muted-foreground">{watch("recipeText")?.length || 0}/2000 znakow</p>
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
          <p className="text-xs text-muted-foreground">URL do przepisu (maks. 255 znakow)</p>
        </div>
      </div>

      {errorMessage && <FormMessage status="error" message={errorMessage} onClose={() => setErrorMessage(null)} />}

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
