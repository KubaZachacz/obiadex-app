import type { APIContext } from "astro";

import { respondUnauthorized, respondInternalError, respondNoContent } from "@/lib/http/responses";
import { logout } from "@/lib/services/authService";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Logs out the current user
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

    // Log out user
    try {
      await logout(supabase);
      return respondNoContent();
    } catch (error: unknown) {
      console.error("Error in POST /api/auth/logout:", error);
      return respondInternalError();
    }
  } catch (error) {
    console.error("Error in POST /api/auth/logout:", error);
    return respondInternalError();
  }
}
