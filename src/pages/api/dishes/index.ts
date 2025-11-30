import type { APIContext } from "astro";

import { dishCreateCommandSchema, dishListQuerySchema } from "@/lib/validation/dishSchemas";
import {
  respondValidationError,
  respondUnauthorized,
  respondOk,
  respondCreated,
  respondDbError,
  respondInternalError,
} from "@/lib/http/responses";
import { create, list } from "@/lib/services/dishService";

export const prerender = false;

/**
 * GET /api/dishes
 * Lists dishes with pagination, filtering, and sorting
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

    const validationResult = dishListQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const options = validationResult.data;

    // Fetch dishes from database
    const response = await list(supabase, user.id, options);

    return respondOk(response);
  } catch (error) {
    console.error("Error in GET /api/dishes:", error);
    return respondInternalError();
  }
}

/**
 * POST /api/dishes
 * Creates a new dish with tags
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
    const validationResult = dishCreateCommandSchema.safeParse(body);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const command = validationResult.data;

    // Create dish
    try {
      const dish = await create(supabase, command, user.id);
      return respondCreated({ data: dish });
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
    console.error("Error in POST /api/dishes:", error);
    return respondInternalError();
  }
}
