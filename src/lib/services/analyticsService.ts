import type { SupabaseClient } from "@/db/supabase.client";
import type { AnalyticsSummaryDTO } from "@/types";

/**
 * Gets analytics summary for a user within a date range
 * Aggregates event counts for 'dish_added' and 'day_planned'
 */
export async function getSummary(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string
): Promise<AnalyticsSummaryDTO> {
  // Query events table for dish_added count
  const { count: dishAddedCount, error: dishAddedError } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "dish_added")
    .gte("created_at", start)
    .lte("created_at", end);

  if (dishAddedError) {
    throw dishAddedError;
  }

  // Query events table for day_planned count
  const { count: dayPlannedCount, error: dayPlannedError } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "day_planned")
    .gte("created_at", start)
    .lte("created_at", end);

  if (dayPlannedError) {
    throw dayPlannedError;
  }

  return {
    dishAdded: {
      count: dishAddedCount ?? 0,
    },
    dayPlanned: {
      count: dayPlannedCount ?? 0,
    },
  };
}
