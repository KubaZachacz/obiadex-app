/**
 * Configuration constants for week navigation and date range prefetching.
 * Desktop: shows 3 weeks (21 days) - previous week, current week, next week.
 * Mobile: shows 11 days - 2 days before current week, current week (7 days), 2 days after.
 */
export const WEEK_NAV_OFFSETS = {
  desktop: {
    prevWeeks: 1, // 1 week before current week
    nextWeeks: 1, // 1 week after current week
  },
  mobile: {
    prevDays: 2, // 2 days before current week start
    nextDays: 2,  // 2 days after current week end
  },
} as const;

/**
 * First day of week according to Polish locale (Monday = 1).
 */
export const WEEK_START_DAY = 1; // Monday

/**
 * Maximum date range for API queries (days).
 */
export const MAX_DATE_RANGE_DAYS = 180;
