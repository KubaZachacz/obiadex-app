import { describe, it, expect } from "vitest";
import {
  dishCreateCommandSchema,
  dishUpdateCommandSchema,
  dishListQuerySchema,
  dishIdParamSchema,
  dishAttachTagsCommandSchema,
  dishDetachTagParamsSchema,
} from "./dishSchemas";

describe("dishSchemas", () => {
  describe("dishCreateCommandSchema", () => {
    it("should validate valid dish with tagNames", () => {
      const input = {
        name: "Spaghetti Carbonara",
        tagNames: ["Italian", "Pasta"],
        recipeText: "Cook pasta...",
        url: "https://example.com/recipe",
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        // Tags should be normalized to lowercase
        expect(result.data.tagNames).toEqual(["italian", "pasta"]);
      }
    });

    it("should validate valid dish with tagIds", () => {
      const input = {
        name: "Spaghetti Carbonara",
        tagIds: ["550e8400-e29b-41d4-a716-446655440000"],
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject dish name shorter than 3 characters", () => {
      const input = {
        name: "AB",
        tagNames: ["test"],
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 3 characters");
      }
    });

    it("should reject dish name longer than 80 characters", () => {
      const input = {
        name: "A".repeat(81),
        tagNames: ["test"],
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at most 80 characters");
      }
    });

    it("should reject recipeText longer than 2000 characters", () => {
      const input = {
        name: "Valid Name",
        tagNames: ["test"],
        recipeText: "A".repeat(2001),
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at most 2000 characters");
      }
    });

    it("should reject url longer than 255 characters", () => {
      const input = {
        name: "Valid Name",
        tagNames: ["test"],
        url: `https://example.com/${"a".repeat(250)}`,
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at most 255 characters");
      }
    });

    it("should reject invalid url format", () => {
      const input = {
        name: "Valid Name",
        tagNames: ["test"],
        url: "not-a-valid-url",
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid URL");
      }
    });

    it("should reject when neither tagNames nor tagIds provided", () => {
      const input = {
        name: "Valid Name",
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one of tagNames or tagIds");
      }
    });

    it("should reject tag name shorter than 2 characters", () => {
      const input = {
        name: "Valid Name",
        tagNames: ["a"],
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2 characters");
      }
    });

    it("should reject tag name longer than 30 characters", () => {
      const input = {
        name: "Valid Name",
        tagNames: ["a".repeat(31)],
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at most 30 characters");
      }
    });

    it("should reject more than 50 tags", () => {
      const input = {
        name: "Valid Name",
        tagNames: Array(51).fill("tag"),
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Maximum 50 tags");
      }
    });

    it("should trim and normalize tag names", () => {
      const input = {
        name: "Valid Name",
        tagNames: ["  Italian  ", "PASTA  "],
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tagNames).toEqual(["italian", "pasta"]);
      }
    });

    it("should trim dish name", () => {
      const input = {
        name: "  Valid Name  ",
        tagNames: ["test"],
      };

      const result = dishCreateCommandSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Valid Name");
      }
    });
  });

  describe("dishUpdateCommandSchema", () => {
    it("should accept null for recipeText and url", () => {
      const input = {
        name: "Updated Dish",
        tagNames: ["test"],
        recipeText: null,
        url: null,
      };

      const result = dishUpdateCommandSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should validate same constraints as create", () => {
      const input = {
        name: "AB", // Too short
        tagNames: ["test"],
      };

      const result = dishUpdateCommandSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("dishListQuerySchema", () => {
    it("should apply default values", () => {
      const result = dishListQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
        expect(result.data.sort).toBe("name_asc");
      }
    });

    it("should coerce string numbers to integers", () => {
      const result = dishListQuerySchema.safeParse({
        page: "2",
        pageSize: "50",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(50);
      }
    });

    it("should reject page less than 1", () => {
      const result = dishListQuerySchema.safeParse({ page: 0 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 1");
      }
    });

    it("should reject pageSize greater than 100", () => {
      const result = dishListQuerySchema.safeParse({ pageSize: 101 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at most 100");
      }
    });

    it("should transform single tagId to array", () => {
      const result = dishListQuerySchema.safeParse({
        tagId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tagId).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
      }
    });

    it("should accept array of tagIds", () => {
      const result = dishListQuerySchema.safeParse({
        tagId: ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tagId).toHaveLength(2);
      }
    });

    it("should validate sort enum", () => {
      const validSorts = ["created_desc", "created_asc", "name_asc", "name_desc", "last_used_asc", "last_used_desc"];

      for (const sort of validSorts) {
        const result = dishListQuerySchema.safeParse({ sort });
        expect(result.success).toBe(true);
      }

      const invalidResult = dishListQuerySchema.safeParse({ sort: "invalid_sort" });
      expect(invalidResult.success).toBe(false);
    });

    it("should trim search query", () => {
      const result = dishListQuerySchema.safeParse({ q: "  search  " });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("search");
      }
    });
  });

  describe("dishIdParamSchema", () => {
    it("should validate valid UUID", () => {
      const result = dishIdParamSchema.safeParse({
        dishId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = dishIdParamSchema.safeParse({
        dishId: "not-a-uuid",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid dish ID");
      }
    });
  });

  describe("dishAttachTagsCommandSchema", () => {
    it("should require at least one of tagNames or tagIds", () => {
      const validWithNames = dishAttachTagsCommandSchema.safeParse({
        tagNames: ["test"],
      });
      expect(validWithNames.success).toBe(true);

      const validWithIds = dishAttachTagsCommandSchema.safeParse({
        tagIds: ["550e8400-e29b-41d4-a716-446655440000"],
      });
      expect(validWithIds.success).toBe(true);

      const invalid = dishAttachTagsCommandSchema.safeParse({});
      expect(invalid.success).toBe(false);
    });
  });

  describe("dishDetachTagParamsSchema", () => {
    it("should validate both dishId and tagId as UUIDs", () => {
      const result = dishDetachTagParamsSchema.safeParse({
        dishId: "550e8400-e29b-41d4-a716-446655440000",
        tagId: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid UUIDs", () => {
      const result = dishDetachTagParamsSchema.safeParse({
        dishId: "invalid",
        tagId: "invalid",
      });

      expect(result.success).toBe(false);
    });
  });
});
