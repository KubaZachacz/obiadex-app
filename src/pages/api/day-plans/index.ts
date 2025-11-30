import type { APIContext } from "astro";

import { dayPlanRangeQuerySchema } from "@/lib/validation/dayPlanSchemas";
import { respondValidationError, respondUnauthorized, respondOk, respondInternalError } from "@/lib/http/responses";
import { listRange } from "@/lib/services/dayPlanService";

export const prerender = false;

/**
 * GET /api/day-plans
 * Lists day plans within a date range (max 180 days)
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

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validationResult = dayPlanRangeQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const { start, end, sort } = validationResult.data;

    // Fetch day plans from database
    const response = await listRange(supabase, user.id, start, end, sort);

    return respondOk(response);
  } catch (error) {
    console.error("Error in GET /api/day-plans:", error);
    return respondInternalError();
  }
}
