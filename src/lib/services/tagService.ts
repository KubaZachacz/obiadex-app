import type { SupabaseClient } from "@/db/supabase.client";
import type { TagDTO, TagListItemDTO, TagCreateCommand, TagDeleteResult } from "@/types";

/**
 * Maps a database tag row to a TagDTO
 */
function mapToTagDTO(row: {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}): TagDTO {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}

/**
 * Lists all tags for a user with optional dish counts
 */
export async function listTags(
  supabase: SupabaseClient,
  userId: string,
  includeCounts = false
): Promise<TagListItemDTO[]> {
  if (includeCounts) {
    // Query with dish counts using a LEFT JOIN and aggregation
    const { data, error } = await supabase
      .from("tags")
      .select(
        `
        id,
        name,
        created_at,
        updated_at,
        user_id,
        dish_tags(count)
      `
      )
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return (
      data?.map((row) => ({
        ...mapToTagDTO(row),
        dishCount: (row.dish_tags as unknown as { count: number }[])?.[0]?.count ?? 0,
      })) ?? []
    );
  }

  // Query without dish counts
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, created_at, updated_at, user_id")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data?.map(mapToTagDTO) ?? [];
}

/**
 * Creates a single tag for a user
 */
export async function createTag(supabase: SupabaseClient, command: TagCreateCommand, userId: string): Promise<TagDTO> {
  const { data, error } = await supabase
    .from("tags")
    .insert({
      name: command.name,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapToTagDTO(data);
}

/**
 * Upserts multiple tags for a user (creates or updates on conflict)
 * Deduplicates names before inserting
 */
export async function upsertMany(supabase: SupabaseClient, names: string[], userId: string): Promise<TagDTO[]> {
  // Deduplicate names (they're already lowercase from validation)
  const uniqueNames = Array.from(new Set(names));

  // Prepare insert records
  const records = uniqueNames.map((name) => ({
    name,
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from("tags")
    .upsert(records, {
      onConflict: "user_id,name",
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    throw error;
  }

  // Return tags in the order of input (after deduplication)
  const tagMap = new Map(data?.map((tag) => [tag.name, mapToTagDTO(tag)]));
  return uniqueNames.map((name) => tagMap.get(name)).filter((tag): tag is TagDTO => tag !== undefined);
}

/**
 * Deletes a tag and returns the number of dishes it was detached from
 * Uses cascade delete configured in the database
 */
export async function deleteTag(supabase: SupabaseClient, userId: string, tagId: string): Promise<TagDeleteResult> {
  // First, count how many dish_tags will be affected
  const { count, error: countError } = await supabase
    .from("dish_tags")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("tag_id", tagId);

  if (countError) {
    throw countError;
  }

  // Delete the tag (cascade will delete dish_tags)
  const { data, error } = await supabase.from("tags").delete().eq("user_id", userId).eq("id", tagId).select().single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Tag not found");
  }

  return {
    deleted: true,
    detachedFrom: count ?? 0,
  };
}

/**
 * Gets tags by their IDs, ensuring they belong to the specified user
 */
export async function getByIds(supabase: SupabaseClient, userId: string, tagIds: string[]): Promise<TagDTO[]> {
  if (tagIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("tags")
    .select("id, name, created_at, updated_at, user_id")
    .eq("user_id", userId)
    .in("id", tagIds);

  if (error) {
    throw error;
  }

  return data?.map(mapToTagDTO) ?? [];
}

/**
 * Ensures all provided tag IDs exist and belong to the user
 * Throws an error if any tag is missing or doesn't belong to the user
 */
export async function ensureTagsOwnership(supabase: SupabaseClient, userId: string, tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) {
    return;
  }

  const tags = await getByIds(supabase, userId, tagIds);

  if (tags.length !== tagIds.length) {
    throw new Error("One or more tags not found or do not belong to the user");
  }
}
