import type { APIContext } from "astro";

import { dayPlanDayParamSchema, dayPlanUpsertCommandSchema } from "@/lib/validation/dayPlanSchemas";
import {
  respondValidationError,
  respondUnauthorized,
  respondOk,
  respondCreated,
  respondNotFound,
  respondDbError,
  respondInternalError,
  respondNoContent,
} from "@/lib/http/responses";
import { getByDay, upsert, deleteDayPlan } from "@/lib/services/dayPlanService";

export const prerender = false;

/**
 * GET /api/day-plans/{day}
 * Gets a single day plan with full dish details and tags
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
    const validationResult = dayPlanDayParamSchema.safeParse(context.params);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const { day } = validationResult.data;

    // Fetch day plan from database
    const dayPlan = await getByDay(supabase, user.id, day);

    if (!dayPlan) {
      return respondNotFound("Day plan not found");
    }

    return respondOk({ data: dayPlan });
  } catch (error) {
    console.error("Error in GET /api/day-plans/{day}:", error);
    return respondInternalError();
  }
}

/**
 * PUT /api/day-plans/{day}
 * Creates or updates a day plan assignment
 * Returns 201 for create, 200 for update
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
    const paramValidation = dayPlanDayParamSchema.safeParse(context.params);
    if (!paramValidation.success) {
      return respondValidationError(paramValidation.error);
    }

    const { day } = paramValidation.data;

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
    const bodyValidation = dayPlanUpsertCommandSchema.safeParse(body);
    if (!bodyValidation.success) {
      return respondValidationError(bodyValidation.error);
    }

    const { dishId } = bodyValidation.data;

    // Upsert day plan
    try {
      const result = await upsert(supabase, user.id, day, dishId);

      // Return 201 for create, 200 for update
      if (result.isNew) {
        return respondCreated({ data: result.data });
      }

      return respondOk({ data: result.data });
    } catch (error: unknown) {
      const err = error as Error;
      // Check for domain validation errors
      if (err.message?.includes("Dish not found")) {
        return respondNotFound("Dish not found or does not belong to user");
      }
      return respondDbError(error as { code?: string; message: string });
    }
  } catch (error) {
    console.error("Error in PUT /api/day-plans/{day}:", error);
    return respondInternalError();
  }
}

/**
 * DELETE /api/day-plans/{day}
 * Deletes a day plan assignment
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
    const validationResult = dayPlanDayParamSchema.safeParse(context.params);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const { day } = validationResult.data;

    // Delete day plan
    try {
      await deleteDayPlan(supabase, user.id, day);
      return respondNoContent();
    } catch (error: unknown) {
      const err = error as Error;
      if (err.message?.includes("not found")) {
        return respondNotFound("Day plan not found");
      }
      return respondDbError(error as { code?: string; message: string });
    }
  } catch (error) {
    console.error("Error in DELETE /api/day-plans/{day}:", error);
    return respondInternalError();
  }
}
