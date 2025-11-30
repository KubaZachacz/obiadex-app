import type { APIContext } from "astro";

import { tagListQuerySchema, tagPostBodySchema } from "@/lib/validation/tagSchemas";
import {
  respondValidationError,
  respondUnauthorized,
  respondOk,
  respondCreated,
  respondDbError,
  respondInternalError,
} from "@/lib/http/responses";
import { listTags, createTag, upsertMany } from "@/lib/services/tagService";

export const prerender = false;

/**
 * GET /api/tags
 * Lists all tags for the authenticated user
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

    const validationResult = tagListQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const { includeCounts } = validationResult.data;

    // Fetch tags from database
    const tags = await listTags(supabase, user.id, includeCounts);

    return respondOk({ data: tags });
  } catch (error) {
    console.error("Error in GET /api/tags:", error);
    return respondInternalError();
  }
}

/**
 * POST /api/tags
 * Creates a new tag or upserts multiple tags
 * Supports two modes:
 * - Single create: { "name": "tag-name" } -> 201 Created
 * - Bulk upsert: { "names": ["tag1", "tag2"] } -> 200 OK
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
    const validationResult = tagPostBodySchema.safeParse(body);
    if (!validationResult.success) {
      return respondValidationError(validationResult.error);
    }

    const command = validationResult.data;

    // Handle single tag creation
    if ("name" in command) {
      try {
        const tag = await createTag(supabase, command, user.id);
        return respondCreated({ data: tag });
      } catch (error: unknown) {
        return respondDbError(error as { code?: string; message: string });
      }
    }

    // Handle bulk tag upsert
    if ("names" in command) {
      try {
        const tags = await upsertMany(supabase, command.names, user.id);
        return respondOk({ data: tags });
      } catch (error: unknown) {
        return respondDbError(error as { code?: string; message: string });
      }
    }

    // Should never reach here due to Zod validation
    return respondInternalError();
  } catch (error) {
    console.error("Error in POST /api/tags:", error);
    return respondInternalError();
  }
}
