import type { APIContext } from "astro";

import { dishDetachTagParamsSchema } from "@/lib/validation/dishSchemas";
import {
  respondValidationError,
  respondUnauthorized,
  respondDbError,
  respondInternalError,
} from "@/lib/http/responses";
import { detachTag } from "@/lib/services/dishService";

export const prerender = false;

/**
 * DELETE /api/dishes/{dishId}/tags/{tagId}
 * Detaches a tag from a dish
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

    // Validate path parameters
    const validationResult = dishDetachTagParamsSchema.safeParse(context.params);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const { dishId, tagId } = validationResult.data;

    // Detach tag
    try {
      await detachTag(supabase, user.id, dishId, tagId);
      return new Response(null, { status: 204 });
    } catch (error: unknown) {
      return respondDbError(error as { code?: string; message: string });
    }
  } catch (error) {
    console.error("Error in DELETE /api/dishes/{dishId}/tags/{tagId}:", error);
    return respondInternalError();
  }
}
