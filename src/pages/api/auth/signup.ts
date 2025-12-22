import type { APIContext } from "astro";

import { authSignupSchema } from "@/lib/validation/authSchemas";
import { respondValidationError, respondCreated, respondConflict, respondInternalError } from "@/lib/http/responses";
import { signup } from "@/lib/services/authService";

export const prerender = false;

/**
 * POST /api/auth/signup
 * Creates a new user account
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    const supabase = context.locals.supabase;

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
            message: "Nieprawidłowy format danych JSON",
          },
        ],
      } as unknown as import("zod").ZodError);
    }

    // Validate request body
    const validationResult = authSignupSchema.safeParse(body);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const command = validationResult.data;

    // Sign up user
    try {
      const response = await signup(supabase, command);
      return respondCreated(response);
    } catch (error: unknown) {
      const err = error as Error & { code?: string; status?: number };

      // Handle duplicate email
      if (err.code === "DUPLICATE_EMAIL" || err.status === 409) {
        return respondConflict("Email już istnieje");
      }

      // Handle other errors
      console.error("Error in POST /api/auth/signup:", error);
      return respondInternalError();
    }
  } catch (error) {
    console.error("Error in POST /api/auth/signup:", error);
    return respondInternalError();
  }
}
