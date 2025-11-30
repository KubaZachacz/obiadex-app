import type { APIContext } from "astro";

import { analyticsSummaryQuerySchema } from "@/lib/validation/analyticsSchemas";
import { respondValidationError, respondUnauthorized, respondOk, respondInternalError } from "@/lib/http/responses";
import { getSummary } from "@/lib/services/analyticsService";

export const prerender = false;

/**
 * GET /api/analytics/summary
 * Returns aggregated counts of dish_added and day_planned events
 * within the specified date range (max 180 days)
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

    const validationResult = analyticsSummaryQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const { start, end } = validationResult.data;

    // Fetch analytics summary from database
    const summary = await getSummary(supabase, user.id, start, end);

    // Return with Cache-Control: no-store header
    return respondOk({ data: summary }, { "Cache-Control": "no-store" });
  } catch (error) {
    console.error("Error in GET /api/analytics/summary:", error);
    return respondInternalError();
  }
}
