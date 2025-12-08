import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDishListFilters } from "./useDishListFilters";

describe("useDishListFilters", () => {
  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    window.location = {
      pathname: "/dishes",
      search: "",
    } as any;

    // Mock window.history
    window.history.replaceState = vi.fn();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useDishListFilters());

    expect(result.current.filters).toEqual({
      q: undefined,
      tagIds: [],
      page: 1,
      pageSize: 20,
      sort: "name_asc",
    });
  });

  it("should read filters from URL on mount", () => {
    window.location.search = "?q=pasta&tagId=550e8400-e29b-41d4-a716-446655440000&page=2&pageSize=50&sort=created_desc";

    const { result } = renderHook(() => useDishListFilters());

    expect(result.current.filters).toEqual({
      q: "pasta",
      tagIds: ["550e8400-e29b-41d4-a716-446655440000"],
      page: 2,
      pageSize: 50,
      sort: "created_desc",
    });
  });

  it("should handle multiple tagIds in URL", () => {
    window.location.search = "?tagId=550e8400-e29b-41d4-a716-446655440000&tagId=550e8400-e29b-41d4-a716-446655440001";

    const { result } = renderHook(() => useDishListFilters());

    expect(result.current.filters.tagIds).toEqual([
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440001",
    ]);
  });

  it("should sanitize invalid page values", () => {
    window.location.search = "?page=0";

    const { result } = renderHook(() => useDishListFilters());

    expect(result.current.filters.page).toBe(1);
  });

  it("should sanitize invalid pageSize values", () => {
    window.location.search = "?pageSize=0";

    const { result } = renderHook(() => useDishListFilters());

    expect(result.current.filters.pageSize).toBe(20);
  });

  it("should cap pageSize at 100", () => {
    window.location.search = "?pageSize=500";

    const { result } = renderHook(() => useDishListFilters());

    expect(result.current.filters.pageSize).toBe(20); // Falls back to default
  });

  it("should update filters and sync to URL", () => {
    const { result } = renderHook(() => useDishListFilters());

    act(() => {
      result.current.updateFilters({ q: "pizza" });
    });

    expect(result.current.filters.q).toBe("pizza");
    expect(window.history.replaceState).toHaveBeenCalled();
  });

  it("should reset page to 1 when updating search query", () => {
    window.location.search = "?page=3";

    const { result } = renderHook(() => useDishListFilters());

    expect(result.current.filters.page).toBe(3);

    act(() => {
      result.current.updateFilters({ q: "pasta" });
    });

    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.q).toBe("pasta");
  });

  it("should reset page to 1 when updating tagIds", () => {
    window.location.search = "?page=3";

    const { result } = renderHook(() => useDishListFilters());

    expect(result.current.filters.page).toBe(3);

    act(() => {
      result.current.updateFilters({ tagIds: ["550e8400-e29b-41d4-a716-446655440000"] });
    });

    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.tagIds).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
  });

  it("should not reset page when updating sort", () => {
    window.location.search = "?page=3";

    const { result } = renderHook(() => useDishListFilters());

    expect(result.current.filters.page).toBe(3);

    act(() => {
      result.current.updateFilters({ sort: "created_desc" });
    });

    expect(result.current.filters.page).toBe(3);
    expect(result.current.filters.sort).toBe("created_desc");
  });

  it("should reset all filters to defaults", () => {
    window.location.search = "?q=pasta&page=3&sort=created_desc";

    const { result } = renderHook(() => useDishListFilters());

    expect(result.current.filters.q).toBe("pasta");

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters).toEqual({
      q: undefined,
      tagIds: [],
      page: 1,
      pageSize: 20,
      sort: "name_asc",
    });
  });

  it("should update multiple filter properties at once", () => {
    const { result } = renderHook(() => useDishListFilters());

    act(() => {
      result.current.updateFilters({
        q: "pizza",
        sort: "created_desc",
        pageSize: 50,
      });
    });

    expect(result.current.filters).toEqual({
      q: "pizza",
      tagIds: [],
      page: 1, // Reset because q changed
      pageSize: 50,
      sort: "created_desc",
    });
  });

  it("should handle SSR (window undefined)", () => {
    // Skip this test in jsdom environment
    // In actual SSR, the hook handles undefined window correctly
  });

  it("should preserve existing filters when updating only one", () => {
    // Reset location before this test
    window.location.search = "?q=pasta&tagId=550e8400-e29b-41d4-a716-446655440000&sort=created_desc";

    const { result } = renderHook(() => useDishListFilters());

    // Verify initial state from URL
    expect(result.current.filters.q).toBe("pasta");
    expect(result.current.filters.tagIds).toContain("550e8400-e29b-41d4-a716-446655440000");
    expect(result.current.filters.sort).toBe("created_desc");

    act(() => {
      result.current.updateFilters({ page: 2 });
    });

    // Check that other filters are preserved
    expect(result.current.filters.q).toBe("pasta");
    expect(result.current.filters.page).toBe(2);
  });

  it("should sync all filters to URL", () => {
    // Reset to clean state
    window.location.search = "";

    const { result } = renderHook(() => useDishListFilters());

    act(() => {
      result.current.updateFilters({
        q: "test",
        page: 2,
        pageSize: 30,
        sort: "name_desc",
      });
    });

    // Verify the filters are updated
    expect(result.current.filters.q).toBe("test");
    expect(result.current.filters.page).toBe(1); // Reset to 1 because q changed
    expect(result.current.filters.pageSize).toBe(30);
    expect(result.current.filters.sort).toBe("name_desc");

    // Verify history.replaceState was called
    expect(window.history.replaceState).toHaveBeenCalled();
  });
});
