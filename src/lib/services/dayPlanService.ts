import type { SupabaseClient } from "@/db/supabase.client";
import type {
  DayPlanDTO,
  DayPlanListItemDTO,
  DayPlanRangeResponse,
  DayPlanUpsertResponse,
  DishSummaryDTO,
  DishWithTagsDTO,
  TagDTO,
} from "@/types";

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
 * Lists day plans within a date range
 */
export async function listRange(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string,
  sort: "asc" | "desc" = "asc"
): Promise<DayPlanRangeResponse> {
  const { data, error } = await supabase
    .from("day_plans")
    .select(
      `
      id,
      day,
      dish_id,
      dishes (
        id,
        name
      )
    `
    )
    .eq("user_id", userId)
    .gte("day", start)
    .lte("day", end)
    .order("day", { ascending: sort === "asc" });

  if (error) {
    throw error;
  }

  const items: DayPlanListItemDTO[] =
    data?.map((row) => {
      const dish = row.dishes as unknown as { id: string; name: string } | null;

      if (!dish) {
        throw new Error("Day plan has no associated dish");
      }

      return {
        id: row.id,
        day: row.day,
        dish: {
          id: dish.id,
          name: dish.name,
        },
      };
    }) ?? [];

  return {
    data: items,
    range: {
      start,
      end,
    },
  };
}

/**
 * Gets a single day plan with full dish details including tags
 */
export async function getByDay(supabase: SupabaseClient, userId: string, day: string): Promise<DayPlanDTO | null> {
  const { data, error } = await supabase
    .from("day_plans")
    .select(
      `
      id,
      day,
      dish_id,
      dishes (
        id,
        name
      )
    `
    )
    .eq("user_id", userId)
    .eq("day", day)
    .single();

  if (error) {
    if (error.message?.includes("PGRST116") || error.message?.includes("no rows")) {
      return null;
    }
    throw error;
  }

  const dish = data.dishes as unknown as { id: string; name: string } | null;

  if (!dish) {
    throw new Error("Day plan has no associated dish");
  }

  // Get tags for the dish
  const { data: dishTagsData, error: tagsError } = await supabase
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
    .eq("dish_id", dish.id);

  if (tagsError) {
    throw tagsError;
  }

  const tags: TagDTO[] =
    dishTagsData
      ?.map((row) => {
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
      .filter((tag): tag is TagDTO => tag !== null) ?? [];

  const dishWithTags: DishWithTagsDTO = {
    id: dish.id,
    name: dish.name,
    tags,
  };

  return {
    id: data.id,
    day: data.day,
    dish: dishWithTags,
  };
}

/**
 * Upserts a day plan (creates or updates)
 * Returns { isNew: boolean, data: DayPlanUpsertResponse }
 */
export async function upsert(
  supabase: SupabaseClient,
  userId: string,
  day: string,
  dishId: string
): Promise<{ isNew: boolean; data: DayPlanUpsertResponse }> {
  // Check if dish exists and belongs to user
  const { data: dishData, error: dishError } = await supabase
    .from("dishes")
    .select("id, name")
    .eq("user_id", userId)
    .eq("id", dishId)
    .single();

  if (dishError || !dishData) {
    throw new Error("Dish not found or does not belong to user");
  }

  // Check if day plan already exists to determine if this is create or update
  const { data: existing } = await supabase
    .from("day_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("day", day)
    .single();

  const isNew = !existing;

  // Upsert the day plan
  const { data, error } = await supabase
    .from("day_plans")
    .upsert(
      {
        user_id: userId,
        day,
        dish_id: dishId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,day",
      }
    )
    .select("id, day, dish_id")
    .single();

  if (error) {
    throw error;
  }

  // Log event asynchronously
  void logEvent(supabase, userId, "day_planned", {
    dish_id: dishId,
    day,
  });

  const dishSummary: DishSummaryDTO = {
    id: dishData.id,
    name: dishData.name,
  };

  return {
    isNew,
    data: {
      id: data.id,
      day: data.day,
      dish: dishSummary,
    },
  };
}

/**
 * Deletes a day plan
 */
export async function deleteDayPlan(supabase: SupabaseClient, userId: string, day: string): Promise<void> {
  const { error, count } = await supabase
    .from("day_plans")
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .eq("day", day);

  if (error) {
    throw error;
  }

  if (count === 0) {
    throw new Error("Day plan not found");
  }
}
