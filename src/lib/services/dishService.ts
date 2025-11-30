import type { SupabaseClient } from "@/db/supabase.client";
import type {
  DishDTO,
  DishListItemDTO,
  DishCreateCommand,
  DishUpdateCommand,
  DishAttachTagsCommand,
  PagedResponse,
  TagDTO,
} from "@/types";
import * as tagService from "./tagService";
import * as dishTagService from "./dishTagService";

/**
 * Maps a database dish row to a DishDTO (without tags)
 */
function mapToDishDTO(row: {
  id: string;
  name: string;
  recipe_text: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}): Omit<DishDTO, "tags"> {
  return {
    id: row.id,
    name: row.name,
    recipeText: row.recipe_text,
    url: row.url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}

/**
 * Normalizes tag selection from command (tagNames and/or tagIds)
 * Returns a deduplicated list of tag IDs
 */
async function normalizeTagSelection(
  supabase: SupabaseClient,
  userId: string,
  command: { tagNames?: string[]; tagIds?: string[] }
): Promise<string[]> {
  const tagIds = new Set<string>();

  // Handle tag names - upsert to get IDs
  if (command.tagNames && command.tagNames.length > 0) {
    const tags = await tagService.upsertMany(supabase, command.tagNames, userId);
    tags.forEach((tag) => tagIds.add(tag.id));
  }

  // Handle tag IDs - validate ownership
  if (command.tagIds && command.tagIds.length > 0) {
    await tagService.ensureTagsOwnership(supabase, userId, command.tagIds);
    command.tagIds.forEach((id) => tagIds.add(id));
  }

  return Array.from(tagIds);
}

/**
 * Logs an event to the events table (fire and forget)
 */
async function logEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("events").insert({
      user_id: userId,
      event_type: eventType,
      payload,
    });
  } catch (error) {
    // Log error but don't throw - events are non-critical
    console.error(`Failed to log event ${eventType}:`, error);
  }
}

/**
 * Creates a new dish with tags
 */
export async function create(supabase: SupabaseClient, command: DishCreateCommand, userId: string): Promise<DishDTO> {
  // Normalize tags
  const tagIds = await normalizeTagSelection(supabase, userId, command);

  if (tagIds.length === 0) {
    throw new Error("At least one tag is required");
  }

  // Create dish
  const { data: dish, error: dishError } = await supabase
    .from("dishes")
    .insert({
      user_id: userId,
      name: command.name,
      recipe_text: command.recipeText ?? null,
      url: command.url ?? null,
    })
    .select()
    .single();

  if (dishError) {
    throw dishError;
  }

  // Attach tags
  await dishTagService.attachTags(supabase, userId, dish.id, tagIds);

  // Get tags for response
  const tags = await dishTagService.getTagsForDish(supabase, userId, dish.id);

  // Log event (async, non-blocking)
  void logEvent(supabase, userId, "dish_added", { dishId: dish.id, name: dish.name });

  return {
    ...mapToDishDTO(dish),
    tags,
  };
}

interface ListOptions {
  page: number;
  pageSize: number;
  q?: string;
  tagId?: string[];
  sort: "created_desc" | "name_asc" | "usage_prio";
}

/**
 * Lists dishes with pagination, filtering, and sorting
 */
export async function list(
  supabase: SupabaseClient,
  userId: string,
  options: ListOptions
): Promise<PagedResponse<DishListItemDTO>> {
  const { page, pageSize, q, tagId, sort } = options;
  const offset = (page - 1) * pageSize;

  // Build base query
  let query = supabase.from("dishes").select("*", { count: "exact" }).eq("user_id", userId);

  // Apply text search filter
  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  // Apply tag filter (conjunction - dish must have ALL specified tags)
  if (tagId && tagId.length > 0) {
    // Use subquery to find dishes with all specified tags
    const { data: dishIdsWithTags, error: tagFilterError } = await supabase
      .from("dish_tags")
      .select("dish_id")
      .eq("user_id", userId)
      .in("tag_id", tagId);

    if (tagFilterError) {
      throw tagFilterError;
    }

    // Group by dish_id and count - only dishes with count === tagId.length have all tags
    const dishIdCounts = new Map<string, number>();
    dishIdsWithTags?.forEach((row) => {
      const count = dishIdCounts.get(row.dish_id) ?? 0;
      dishIdCounts.set(row.dish_id, count + 1);
    });

    const matchingDishIds = Array.from(dishIdCounts.entries())
      .filter(([, count]) => count === tagId.length)
      .map(([dishId]) => dishId);

    if (matchingDishIds.length === 0) {
      return {
        data: [],
        page,
        pageSize,
        total: 0,
        totalPages: 0,
      };
    }

    query = query.in("id", matchingDishIds);
  }

  // Apply sorting
  if (sort === "created_desc") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "name_asc") {
    query = query.order("name", { ascending: true });
  }
  // usage_prio will be handled separately below

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1);

  // Execute query
  const { data: dishes, error, count } = await query;

  if (error) {
    throw error;
  }

  if (!dishes || dishes.length === 0) {
    return {
      data: [],
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  }

  // Get tags for all dishes
  const dishIds = dishes.map((dish) => dish.id);
  const tagsByDish = await dishTagService.getTagsForDishes(supabase, userId, dishIds);

  // Get last used day for usage_prio sorting
  let lastUsedByDish: Map<string, string | null> | undefined;
  if (sort === "usage_prio") {
    const { data: dayPlans, error: dayPlanError } = await supabase
      .from("day_plans")
      .select("dish_id, day")
      .eq("user_id", userId)
      .in("dish_id", dishIds)
      .order("day", { ascending: false });

    if (dayPlanError) {
      throw dayPlanError;
    }

    const usageMap = new Map<string, string | null>();
    dayPlans?.forEach((plan) => {
      if (!usageMap.has(plan.dish_id)) {
        usageMap.set(plan.dish_id, plan.day);
      }
    });

    // Mark dishes never used
    dishIds.forEach((id) => {
      if (!usageMap.has(id)) {
        usageMap.set(id, null);
      }
    });

    lastUsedByDish = usageMap;
  }

  // Map to DTOs
  let items: DishListItemDTO[] = dishes.map((dish) => {
    const base: DishDTO = {
      ...mapToDishDTO(dish),
      tags: tagsByDish.get(dish.id) ?? [],
    };

    if (sort === "usage_prio") {
      return {
        ...base,
        lastUsedDay: lastUsedByDish?.get(dish.id) ?? null,
      };
    }

    return base;
  });

  // Sort by usage priority if needed (client-side after DB query)
  if (sort === "usage_prio" && lastUsedByDish) {
    items = items.sort((a, b) => {
      const aDay = a.lastUsedDay;
      const bDay = b.lastUsedDay;

      // Nulls (never used) come last
      if (aDay === null && bDay === null) return 0;
      if (aDay === null) return 1;
      if (bDay === null) return -1;

      // Oldest usage first
      return aDay.localeCompare(bDay);
    });
  }

  return {
    data: items,
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

/**
 * Gets a single dish by ID
 */
export async function getById(supabase: SupabaseClient, userId: string, dishId: string): Promise<DishDTO | null> {
  const { data: dish, error } = await supabase
    .from("dishes")
    .select("*")
    .eq("user_id", userId)
    .eq("id", dishId)
    .single();

  if (error) {
    if (error.message?.includes("PGRST116") || error.message?.includes("no rows")) {
      return null;
    }
    throw error;
  }

  const tags = await dishTagService.getTagsForDish(supabase, userId, dishId);

  return {
    ...mapToDishDTO(dish),
    tags,
  };
}

/**
 * Updates a dish and its tags
 */
export async function update(
  supabase: SupabaseClient,
  userId: string,
  dishId: string,
  command: DishUpdateCommand
): Promise<DishDTO> {
  // Normalize tags
  const tagIds = await normalizeTagSelection(supabase, userId, command);

  if (tagIds.length === 0) {
    throw new Error("At least one tag is required");
  }

  // Update dish
  const { data: dish, error: dishError } = await supabase
    .from("dishes")
    .update({
      name: command.name,
      recipe_text: command.recipeText,
      url: command.url,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", dishId)
    .select()
    .single();

  if (dishError) {
    throw dishError;
  }

  // Replace tags
  await dishTagService.replaceTags(supabase, userId, dishId, tagIds);

  // Get tags for response
  const tags = await dishTagService.getTagsForDish(supabase, userId, dishId);

  return {
    ...mapToDishDTO(dish),
    tags,
  };
}

/**
 * Deletes a dish
 */
export async function deleteDish(supabase: SupabaseClient, userId: string, dishId: string): Promise<void> {
  const { error } = await supabase.from("dishes").delete().eq("user_id", userId).eq("id", dishId);

  if (error) {
    throw error;
  }
}

/**
 * Attaches tags to an existing dish
 */
export async function attachTags(
  supabase: SupabaseClient,
  userId: string,
  dishId: string,
  command: DishAttachTagsCommand
): Promise<TagDTO[]> {
  // Normalize tags
  const tagIds = await normalizeTagSelection(supabase, userId, command);

  if (tagIds.length === 0) {
    throw new Error("At least one tag is required");
  }

  // Attach tags
  await dishTagService.attachTags(supabase, userId, dishId, tagIds);

  // Return updated tag list
  return await dishTagService.getTagsForDish(supabase, userId, dishId);
}

/**
 * Detaches a tag from a dish
 */
export async function detachTag(
  supabase: SupabaseClient,
  userId: string,
  dishId: string,
  tagId: string
): Promise<void> {
  await dishTagService.detachTag(supabase, userId, dishId, tagId);
}
