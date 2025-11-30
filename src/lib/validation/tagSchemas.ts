import { z } from "zod";

/**
 * Validation schema for GET /tags query parameters
 */
export const tagListQuerySchema = z.object({
  includeCounts: z.coerce.boolean().optional(),
});

/**
 * Validation schema for single tag name (2-30 characters after trim)
 */
const tagNameSchema = z
  .string()
  .trim()
  .min(2, "Tag name must be at least 2 characters")
  .max(30, "Tag name must be at most 30 characters")
  .transform((val) => val.toLowerCase());

/**
 * Validation schema for POST /tags - single create mode
 */
const tagCreateCommandSchema = z.object({
  name: tagNameSchema,
});

/**
 * Validation schema for POST /tags - bulk upsert mode
 */
const tagUpsertManyCommandSchema = z.object({
  names: z
    .array(tagNameSchema)
    .min(1, "At least one tag name is required")
    .max(50, "Maximum 50 tags can be created at once"),
});

/**
 * Discriminated union for POST /tags body
 * Accepts either { name: string } or { names: string[] }
 */
export const tagPostBodySchema = z.union([tagCreateCommandSchema, tagUpsertManyCommandSchema]);

/**
 * Validation schema for DELETE /tags/{id} path parameter
 */
export const tagDeleteParamsSchema = z.object({
  id: z.string().uuid("Invalid tag ID format"),
});

/**
 * Type exports for use in API routes
 */
export type TagListQuery = z.infer<typeof tagListQuerySchema>;
export type TagCreateCommand = z.infer<typeof tagCreateCommandSchema>;
export type TagUpsertManyCommand = z.infer<typeof tagUpsertManyCommandSchema>;
export type TagPostBody = z.infer<typeof tagPostBodySchema>;
export type TagDeleteParams = z.infer<typeof tagDeleteParamsSchema>;
