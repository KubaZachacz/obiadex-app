import { describe, it, expect } from "vitest";
import { tagListQuerySchema, tagPostBodySchema, tagDeleteParamsSchema } from "./tagSchemas";

describe("tagSchemas", () => {
  describe("tagListQuerySchema", () => {
    it("should coerce includeCounts to boolean", () => {
      const resultTrue = tagListQuerySchema.safeParse({ includeCounts: true });
      expect(resultTrue.success).toBe(true);
      if (resultTrue.success) {
        expect(resultTrue.data.includeCounts).toBe(true);
      }

      const resultFalse = tagListQuerySchema.safeParse({ includeCounts: false });
      expect(resultFalse.success).toBe(true);
      if (resultFalse.success) {
        expect(resultFalse.data.includeCounts).toBe(false);
      }
    });

    it("should accept empty query", () => {
      const result = tagListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("tagPostBodySchema - single tag create", () => {
    it("should validate valid tag name", () => {
      const result = tagPostBodySchema.safeParse({
        name: "Italian",
      });

      expect(result.success).toBe(true);
      if (result.success && "name" in result.data) {
        // Tag name should be normalized to lowercase
        expect(result.data.name).toBe("italian");
      }
    });

    it("should trim and normalize tag name to lowercase", () => {
      const result = tagPostBodySchema.safeParse({
        name: "  ITALIAN Pasta  ",
      });

      expect(result.success).toBe(true);
      if (result.success && "name" in result.data) {
        expect(result.data.name).toBe("italian pasta");
      }
    });

    it("should reject tag name shorter than 2 characters", () => {
      const result = tagPostBodySchema.safeParse({
        name: "a",
      });

      expect(result.success).toBe(false);
    });

    it("should reject tag name longer than 30 characters", () => {
      const result = tagPostBodySchema.safeParse({
        name: "a".repeat(31),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("tagPostBodySchema - bulk tag upsert", () => {
    it("should validate array of tag names", () => {
      const result = tagPostBodySchema.safeParse({
        names: ["Italian", "Pasta", "Quick"],
      });

      expect(result.success).toBe(true);
      if (result.success && "names" in result.data) {
        // All names should be normalized to lowercase
        expect(result.data.names).toEqual(["italian", "pasta", "quick"]);
      }
    });

    it("should reject empty array", () => {
      const result = tagPostBodySchema.safeParse({
        names: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one tag name");
      }
    });

    it("should reject more than 50 tags", () => {
      const result = tagPostBodySchema.safeParse({
        names: Array(51).fill("tag"),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Maximum 50 tags");
      }
    });

    it("should trim and normalize all tag names", () => {
      const result = tagPostBodySchema.safeParse({
        names: ["  ITALIAN  ", "pasta  ", "  QUICK"],
      });

      expect(result.success).toBe(true);
      if (result.success && "names" in result.data) {
        expect(result.data.names).toEqual(["italian", "pasta", "quick"]);
      }
    });

    it("should reject if any tag name is invalid", () => {
      const result = tagPostBodySchema.safeParse({
        names: ["valid", "a"], // Second tag is too short
      });

      expect(result.success).toBe(false);
    });
  });

  describe("tagDeleteParamsSchema", () => {
    it("should validate valid UUID", () => {
      const result = tagDeleteParamsSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = tagDeleteParamsSchema.safeParse({
        id: "not-a-uuid",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid tag ID");
      }
    });
  });
});
