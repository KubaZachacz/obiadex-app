import { z } from "zod";

/**
 * Tag name validation (reusable across dish schemas)
 */
const tagNameSchema = z
  .string()
  .trim()
  .min(2, "Tag name must be at least 2 characters")
  .max(30, "Tag name must be at most 30 characters")
  .transform((val) => val.toLowerCase());

/**
 * Base tag selection object schema (without refine)
 * This can be extended before applying the refine constraint
 */
const tagSelectionBaseSchema = z.object({
  tagNames: z.array(tagNameSchema).min(1).max(50, "Maximum 50 tags allowed").optional(),
  tagIds: z.array(z.string().uuid("Invalid tag ID format")).min(1).max(50, "Maximum 50 tags allowed").optional(),
});

/**
 * Helper function to apply the tag selection refine constraint
 * Ensures at least one of tagNames or tagIds must be present
 */
const withTagSelectionRefine = <T extends z.ZodTypeAny>(schema: T) =>
  schema.refine((data: { tagNames?: string[]; tagIds?: string[] }) => data.tagNames || data.tagIds, {
    message: "At least one of tagNames or tagIds must be provided",
  });

/**
 * Validation schema for POST /dishes (create)
 */
export const dishCreateCommandSchema = withTagSelectionRefine(
  tagSelectionBaseSchema.extend({
    name: z
      .string()
      .trim()
      .min(3, "Dish name must be at least 3 characters")
      .max(80, "Dish name must be at most 80 characters"),
    recipeText: z.string().max(2000, "Recipe text must be at most 2000 characters").optional(),
    url: z.string().url("Invalid URL format").max(255, "URL must be at most 255 characters").optional(),
  })
);

/**
 * Validation schema for PUT /dishes/{id} (update)
 */
export const dishUpdateCommandSchema = withTagSelectionRefine(
  tagSelectionBaseSchema.extend({
    name: z
      .string()
      .trim()
      .min(3, "Dish name must be at least 3 characters")
      .max(80, "Dish name must be at most 80 characters"),
    recipeText: z.string().max(2000, "Recipe text must be at most 2000 characters").nullable(),
    url: z.string().url("Invalid URL format").max(255, "URL must be at most 255 characters").nullable(),
  })
);

/**
 * Validation schema for GET /dishes (list with pagination and filtering)
 */
export const dishListQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1").optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, "Page size must be at least 1")
    .max(100, "Page size must be at most 100")
    .optional()
    .default(20),
  q: z.string().trim().optional(),
  tagId: z
    .union([z.string().uuid(), z.array(z.string().uuid())])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional(),
  sort: z.enum(["created_desc", "created_asc", "name_asc", "name_desc", "last_used_asc", "last_used_desc"]).optional().default("name_asc"),
});

/**
 * Validation schema for GET /dishes/{id} and DELETE /dishes/{id}
 */
export const dishIdParamSchema = z.object({
  dishId: z.string().uuid("Invalid dish ID format"),
});

/**
 * Validation schema for POST /dishes/{id}/tags (attach tags)
 */
export const dishAttachTagsCommandSchema = withTagSelectionRefine(tagSelectionBaseSchema);

/**
 * Validation schema for DELETE /dishes/{id}/tags/{tagId} (detach tag)
 */
export const dishDetachTagParamsSchema = z.object({
  dishId: z.string().uuid("Invalid dish ID format"),
  tagId: z.string().uuid("Invalid tag ID format"),
});

/**
 * Type exports for use in API routes and services
 */
export type DishCreateCommand = z.infer<typeof dishCreateCommandSchema>;
export type DishUpdateCommand = z.infer<typeof dishUpdateCommandSchema>;
export type DishListQuery = z.infer<typeof dishListQuerySchema>;
export type DishIdParam = z.infer<typeof dishIdParamSchema>;
export type DishAttachTagsCommand = z.infer<typeof dishAttachTagsCommandSchema>;
export type DishDetachTagParams = z.infer<typeof dishDetachTagParamsSchema>;
