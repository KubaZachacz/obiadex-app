import type { APIContext } from "astro";

import { dishIdParamSchema, dishAttachTagsCommandSchema } from "@/lib/validation/dishSchemas";
import {
  respondValidationError,
  respondUnauthorized,
  respondOk,
  respondDbError,
  respondInternalError,
} from "@/lib/http/responses";
import { attachTags } from "@/lib/services/dishService";

export const prerender = false;

/**
 * POST /api/dishes/{dishId}/tags
 * Attaches tags to an existing dish
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    const supabase = context.locals.supabase;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return respondUnauthorized();
    }

    // Validate path parameter
    const paramValidation = dishIdParamSchema.safeParse(context.params);
    if (!paramValidation.success) {
      return respondValidationError(paramValidation.error);
    }

    const { dishId } = paramValidation.data;

    // Parse request body
    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
      return respondValidationError({
        issues: [
          {
            code: "invalid_type",
            expected: "object",
            received: "undefined",
            path: [],
            message: "Invalid JSON body",
          },
        ],
      } as unknown as import("zod").ZodError);
    }

    // Validate request body
    const bodyValidation = dishAttachTagsCommandSchema.safeParse(body);
    if (!bodyValidation.success) {
      return respondValidationError(bodyValidation.error);
    }

    const command = bodyValidation.data;

    // Attach tags
    try {
      const tags = await attachTags(supabase, user.id, dishId, command);
      return respondOk({ tags });
    } catch (error: unknown) {
      const err = error as Error;
      // Check for domain validation errors
      if (err.message?.includes("At least one tag is required")) {
        return respondValidationError({
          issues: [
            {
              code: "custom",
              path: ["tagNames", "tagIds"],
              message: err.message,
            },
          ],
        } as unknown as import("zod").ZodError);
      }
      return respondDbError(error as { code?: string; message: string });
    }
  } catch (error) {
    console.error("Error in POST /api/dishes/{dishId}/tags:", error);
    return respondInternalError();
  }
}
