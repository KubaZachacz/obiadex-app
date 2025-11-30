import { z } from "zod";

/**
 * Validates ISO 8601 datetime format
 */
const datetimeSchema = z.string().datetime({ message: "Must be a valid ISO 8601 datetime" });

/**
 * Validation schema for GET /analytics/summary
 */
export const analyticsSummaryQuerySchema = z
  .object({
    start: datetimeSchema,
    end: datetimeSchema,
  })
  .refine(
    (data) => {
      const startDate = new Date(data.start);
      const endDate = new Date(data.end);
      return startDate <= endDate;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["start"],
    }
  )
  .refine(
    (data) => {
      const endDate = new Date(data.end);
      const now = new Date();
      return endDate <= now;
    },
    {
      message: "End date cannot be in the future",
      path: ["end"],
    }
  )
  .refine(
    (data) => {
      const startDate = new Date(data.start);
      const endDate = new Date(data.end);
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 180;
    },
    {
      message: "Date range cannot exceed 180 days",
      path: ["end"],
    }
  );

/**
 * Type exports for use in API routes and services
 */
export type AnalyticsSummaryQuery = z.infer<typeof analyticsSummaryQuerySchema>;
