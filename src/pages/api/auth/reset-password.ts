import type { APIContext } from "astro";

import { authResetPasswordSchema } from "@/lib/validation/authSchemas";
import { respondValidationError, respondInternalError } from "@/lib/http/responses";
import { resetPassword } from "@/lib/services/authService";

export const prerender = false;

/**
 * POST /api/auth/reset-password
 * Sends a password reset email
 * Always returns 202 to prevent email enumeration
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
            message: "Invalid JSON body",
          },
        ],
      } as unknown as import("zod").ZodError);
    }

    // Validate request body
    const validationResult = authResetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const { email } = validationResult.data;

    // Get redirect URL from environment or construct from origin
    const redirectUrl = import.meta.env.PUBLIC_SITE_URL
      ? `${import.meta.env.PUBLIC_SITE_URL}/auth/callback`
      : `${new URL(context.request.url).origin}/auth/callback`;

    // Send reset password email
    try {
      await resetPassword(supabase, email, redirectUrl);

      // Always return 202 Accepted to prevent email enumeration
      return new Response(null, { status: 202 });
    } catch (error: unknown) {
      console.error("Error in POST /api/auth/reset-password:", error);

      // Still return 202 to prevent enumeration
      return new Response(null, { status: 202 });
    }
  } catch (error) {
    console.error("Error in POST /api/auth/reset-password:", error);
    return respondInternalError();
  }
}
