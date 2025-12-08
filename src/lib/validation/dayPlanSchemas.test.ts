import { describe, it, expect } from "vitest";
import { dayPlanRangeQuerySchema, dayPlanDayParamSchema, dayPlanUpsertCommandSchema } from "./dayPlanSchemas";

describe("dayPlanSchemas", () => {
  describe("dayPlanDayParamSchema", () => {
    it("should validate correct ISO date format", () => {
      const result = dayPlanDayParamSchema.safeParse({
        day: "2025-12-25",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid date format", () => {
      const invalidFormats = ["25-12-2025", "2025/12/25", "12-25-2025", "2025-12-25T00:00:00"];

      for (const day of invalidFormats) {
        const result = dayPlanDayParamSchema.safeParse({ day });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("YYYY-MM-DD");
        }
      }
    });

    it("should reject invalid dates", () => {
      const invalidDates = ["2025-02-30", "2025-13-01", "2025-00-01", "2025-12-32"];

      for (const day of invalidDates) {
        const result = dayPlanDayParamSchema.safeParse({ day });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("Invalid date");
        }
      }
    });

    it("should accept leap year dates", () => {
      const result = dayPlanDayParamSchema.safeParse({
        day: "2024-02-29",
      });

      expect(result.success).toBe(true);
    });

    it("should reject non-leap year Feb 29", () => {
      const result = dayPlanDayParamSchema.safeParse({
        day: "2025-02-29",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("dayPlanRangeQuerySchema", () => {
    it("should validate valid date range", () => {
      const result = dayPlanRangeQuerySchema.safeParse({
        start: "2025-12-01",
        end: "2025-12-31",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("asc"); // Default sort
      }
    });

    it("should apply default sort value", () => {
      const result = dayPlanRangeQuerySchema.safeParse({
        start: "2025-12-01",
        end: "2025-12-31",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("asc");
      }
    });

    it("should accept asc and desc sort", () => {
      const resultAsc = dayPlanRangeQuerySchema.safeParse({
        start: "2025-12-01",
        end: "2025-12-31",
        sort: "asc",
      });
      expect(resultAsc.success).toBe(true);

      const resultDesc = dayPlanRangeQuerySchema.safeParse({
        start: "2025-12-01",
        end: "2025-12-31",
        sort: "desc",
      });
      expect(resultDesc.success).toBe(true);
    });

    it("should reject when start is after end", () => {
      const result = dayPlanRangeQuerySchema.safeParse({
        start: "2025-12-31",
        end: "2025-12-01",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Start date must be before or equal");
        expect(result.error.issues[0].path).toContain("start");
      }
    });

    it("should accept same start and end date", () => {
      const result = dayPlanRangeQuerySchema.safeParse({
        start: "2025-12-25",
        end: "2025-12-25",
      });

      expect(result.success).toBe(true);
    });

    it("should reject range exceeding 180 days", () => {
      const result = dayPlanRangeQuerySchema.safeParse({
        start: "2025-01-01",
        end: "2025-07-01", // More than 180 days
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot exceed 180 days");
        expect(result.error.issues[0].path).toContain("end");
      }
    });

    it("should accept range of exactly 180 days", () => {
      const start = new Date("2025-01-01");
      const end = new Date(start);
      end.setDate(end.getDate() + 180);

      const result = dayPlanRangeQuerySchema.safeParse({
        start: "2025-01-01",
        end: end.toISOString().split("T")[0],
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid date formats in range", () => {
      const result = dayPlanRangeQuerySchema.safeParse({
        start: "2025/12/01",
        end: "2025-12-31",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("dayPlanUpsertCommandSchema", () => {
    it("should validate valid UUID dishId", () => {
      const result = dayPlanUpsertCommandSchema.safeParse({
        dishId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID dishId", () => {
      const result = dayPlanUpsertCommandSchema.safeParse({
        dishId: "not-a-uuid",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid dish ID");
      }
    });

    it("should reject missing dishId", () => {
      const result = dayPlanUpsertCommandSchema.safeParse({});

      expect(result.success).toBe(false);
    });
  });
});
