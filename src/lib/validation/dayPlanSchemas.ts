import { z } from "zod";

/**
 * Validates ISO date format (YYYY-MM-DD)
 */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine(
    (dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) && dateStr === date.toISOString().split("T")[0];
    },
    {
      message: "Invalid date",
    }
  );

/**
 * Validation schema for GET /day-plans (range query)
 */
export const dayPlanRangeQuerySchema = z
  .object({
    start: isoDateSchema,
    end: isoDateSchema,
    sort: z.enum(["asc", "desc"]).optional().default("asc"),
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
 * Validation schema for GET /day-plans/{day}
 */
export const dayPlanDayParamSchema = z.object({
  day: isoDateSchema,
});

/**
 * Validation schema for PUT /day-plans/{day} body
 */
export const dayPlanUpsertCommandSchema = z.object({
  dishId: z.string().uuid("Invalid dish ID format"),
});

/**
 * Type exports for use in API routes and services
 */
export type DayPlanRangeQuery = z.infer<typeof dayPlanRangeQuerySchema>;
export type DayPlanDayParam = z.infer<typeof dayPlanDayParamSchema>;
export type DayPlanUpsertCommand = z.infer<typeof dayPlanUpsertCommandSchema>;
