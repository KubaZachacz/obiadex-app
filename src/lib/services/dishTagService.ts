import type { SupabaseClient } from "@/db/supabase.client";
import type { TagDTO } from "@/types";

/**
 * Attaches tags to a dish (M:N relationship)
 * Inserts into dish_tags junction table, ignoring duplicates
 */
export async function attachTags(
  supabase: SupabaseClient,
  userId: string,
  dishId: string,
  tagIds: string[]
): Promise<void> {
  if (tagIds.length === 0) {
    return;
  }

  const records = tagIds.map((tagId) => ({
    user_id: userId,
    dish_id: dishId,
    tag_id: tagId,
  }));

  const { error } = await supabase.from("dish_tags").upsert(records, {
    onConflict: "user_id,dish_id,tag_id",
    ignoreDuplicates: true,
  });

  if (error) {
    throw error;
  }
}

/**
 * Detaches a specific tag from a dish
 */
export async function detachTag(
  supabase: SupabaseClient,
  userId: string,
  dishId: string,
  tagId: string
): Promise<void> {
  const { error } = await supabase
    .from("dish_tags")
    .delete()
    .eq("user_id", userId)
    .eq("dish_id", dishId)
    .eq("tag_id", tagId);

  if (error) {
    throw error;
  }
}

/**
 * Replaces all tags for a dish with a new set
 * Deletes existing associations and creates new ones in a transaction-like manner
 */
export async function replaceTags(
  supabase: SupabaseClient,
  userId: string,
  dishId: string,
  newTagIds: string[]
): Promise<void> {
  // Delete existing tags for this dish
  const { error: deleteError } = await supabase.from("dish_tags").delete().eq("user_id", userId).eq("dish_id", dishId);

  if (deleteError) {
    throw deleteError;
  }

  // Attach new tags
  await attachTags(supabase, userId, dishId, newTagIds);
}

/**
 * Gets all tags associated with a dish
 */
export async function getTagsForDish(supabase: SupabaseClient, userId: string, dishId: string): Promise<TagDTO[]> {
  const { data, error } = await supabase
    .from("dish_tags")
    .select(
      `
      tags (
        id,
        name,
        created_at,
        updated_at,
        user_id
      )
    `
    )
    .eq("user_id", userId)
    .eq("dish_id", dishId);

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  return data
    .map((row) => {
      const tag = row.tags as unknown as {
        id: string;
        name: string;
        created_at: string;
        updated_at: string;
        user_id: string;
      } | null;

      if (!tag) return null;

      return {
        id: tag.id,
        name: tag.name,
        createdAt: tag.created_at,
        updatedAt: tag.updated_at,
        userId: tag.user_id,
      };
    })
    .filter((tag): tag is TagDTO => tag !== null);
}

/**
 * Gets all tags for multiple dishes in a single query
 * Returns a Map of dishId -> TagDTO[]
 */
export async function getTagsForDishes(
  supabase: SupabaseClient,
  userId: string,
  dishIds: string[]
): Promise<Map<string, TagDTO[]>> {
  if (dishIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("dish_tags")
    .select(
      `
      dish_id,
      tags (
        id,
        name,
        created_at,
        updated_at,
        user_id
      )
    `
    )
    .eq("user_id", userId)
    .in("dish_id", dishIds);

  if (error) {
    throw error;
  }

  const tagsByDish = new Map<string, TagDTO[]>();

  data?.forEach((row) => {
    const tag = row.tags as unknown as {
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
      user_id: string;
    } | null;

    if (!tag) return;

    const dishId = row.dish_id;
    const existing = tagsByDish.get(dishId) ?? [];

    existing.push({
      id: tag.id,
      name: tag.name,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at,
      userId: tag.user_id,
    });

    tagsByDish.set(dishId, existing);
  });

  return tagsByDish;
}
