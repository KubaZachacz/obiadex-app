import type { APIContext } from "astro";

import { tagDeleteParamsSchema } from "@/lib/validation/tagSchemas";
import {
  respondValidationError,
  respondUnauthorized,
  respondOk,
  respondDbError,
  respondInternalError,
} from "@/lib/http/responses";
import { deleteTag } from "@/lib/services/tagService";

export const prerender = false;

/**
 * DELETE /api/tags/{id}
 * Deletes a tag and detaches it from all dishes
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
    const validationResult = tagDeleteParamsSchema.safeParse(context.params);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const { id } = validationResult.data;

    // Delete tag from database
    try {
      const result = await deleteTag(supabase, user.id, id);
      return respondOk(result);
    } catch (error: unknown) {
      return respondDbError(error as { code?: string; message: string });
    }
  } catch (error) {
    console.error("Error in DELETE /api/tags/{id}:", error);
    return respondInternalError();
  }
}
