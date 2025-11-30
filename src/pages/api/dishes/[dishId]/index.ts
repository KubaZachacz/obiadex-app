import type { APIContext } from "astro";

import { dishIdParamSchema, dishUpdateCommandSchema } from "@/lib/validation/dishSchemas";
import {
  respondValidationError,
  respondUnauthorized,
  respondOk,
  respondNotFound,
  respondDbError,
  respondInternalError,
} from "@/lib/http/responses";
import { getById, update, deleteDish } from "@/lib/services/dishService";

export const prerender = false;

/**
 * GET /api/dishes/{dishId}
 * Gets a single dish by ID with all its tags
 */
export async function GET(context: APIContext): Promise<Response> {
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
    const validationResult = dishIdParamSchema.safeParse(context.params);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const { dishId } = validationResult.data;

    // Fetch dish from database
    const dish = await getById(supabase, user.id, dishId);

    if (!dish) {
      return respondNotFound("Dish not found");
    }

    return respondOk(dish);
  } catch (error) {
    console.error("Error in GET /api/dishes/{dishId}:", error);
    return respondInternalError();
  }
}

/**
 * PUT /api/dishes/{dishId}
 * Updates a dish and its tags
 */
export async function PUT(context: APIContext): Promise<Response> {
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
    const bodyValidation = dishUpdateCommandSchema.safeParse(body);
    if (!bodyValidation.success) {
      return respondValidationError(bodyValidation.error);
    }

    const command = bodyValidation.data;

    // Update dish
    try {
      const dish = await update(supabase, user.id, dishId, command);
      return respondOk(dish);
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
    console.error("Error in PUT /api/dishes/{dishId}:", error);
    return respondInternalError();
  }
}

/**
 * DELETE /api/dishes/{dishId}
 * Deletes a dish
 */
export async function DELETE(context: APIContext): Promise<Response> {
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
    const validationResult = dishIdParamSchema.safeParse(context.params);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const { dishId } = validationResult.data;

    // Delete dish
    try {
      await deleteDish(supabase, user.id, dishId);
      return new Response(null, { status: 204 });
    } catch (error: unknown) {
      return respondDbError(error as { code?: string; message: string });
    }
  } catch (error) {
    console.error("Error in DELETE /api/dishes/{dishId}:", error);
    return respondInternalError();
  }
}
