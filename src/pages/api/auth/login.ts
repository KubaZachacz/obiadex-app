import type { APIContext } from "astro";

import { authLoginSchema } from "@/lib/validation/authSchemas";
import { respondValidationError, respondOk, respondUnauthorized, respondInternalError } from "@/lib/http/responses";
import { login } from "@/lib/services/authService";

export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticates a user and returns an access token
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
    const validationResult = authLoginSchema.safeParse(body);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const command = validationResult.data;

    // Log in user
    try {
      const response = await login(supabase, command);
      return respondOk(response);
    } catch (error: unknown) {
      const err = error as Error & { code?: string; status?: number };

      // Handle invalid credentials
      if (err.code === "INVALID_CREDENTIALS" || err.status === 401) {
        return respondUnauthorized("Nieprawidłowy login lub hasło");
      }

      // Handle other errors
      console.error("Error in POST /api/auth/login:", error);
      return respondInternalError();
    }
  } catch (error) {
    console.error("Error in POST /api/auth/login:", error);
    return respondInternalError();
  }
}
