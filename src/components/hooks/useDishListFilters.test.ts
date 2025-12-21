import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDishListFilters } from "./useDishListFilters";

describe("useDishListFilters", () => {
  const setUrl = (url: string) => {
    window.history.pushState({}, "", url);
  };

  let replaceStateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    setUrl("/dishes");
    replaceStateSpy = vi.spyOn(window.history, "replaceState");
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

  it("should strip query params on mount", () => {
    setUrl("/dishes?q=pasta&page=2");

    renderHook(() => useDishListFilters());

    expect(replaceStateSpy).toHaveBeenCalledWith({}, "", "/dishes");
  });

  it("should preserve edit id when stripping query params", () => {
    setUrl("/dishes?id=123&q=pasta");

    renderHook(() => useDishListFilters());

    expect(replaceStateSpy).toHaveBeenCalledWith({}, "", "/dishes?id=123");
  });

  it("should not change url when only edit id exists", () => {
    setUrl("/dishes?id=123");

    renderHook(() => useDishListFilters());

    expect(replaceStateSpy).not.toHaveBeenCalled();
  });

  it("should reset page to 1 when updating search query", () => {
    const { result } = renderHook(() => useDishListFilters());

    act(() => {
      result.current.updateFilters({ page: 3 });
    });

    expect(result.current.filters.page).toBe(3);

    act(() => {
      result.current.updateFilters({ q: "pasta" });
    });

    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.q).toBe("pasta");
  });

  it("should reset page to 1 when updating tagIds", () => {
    const { result } = renderHook(() => useDishListFilters());

    act(() => {
      result.current.updateFilters({ page: 3 });
    });

    expect(result.current.filters.page).toBe(3);

    act(() => {
      result.current.updateFilters({ tagIds: ["550e8400-e29b-41d4-a716-446655440000"] });
    });

    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.tagIds).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
  });

  it("should not reset page when updating sort", () => {
    const { result } = renderHook(() => useDishListFilters());

    act(() => {
      result.current.updateFilters({ page: 3 });
    });

    expect(result.current.filters.page).toBe(3);

    act(() => {
      result.current.updateFilters({ sort: "created_desc" });
    });

    expect(result.current.filters.page).toBe(3);
    expect(result.current.filters.sort).toBe("created_desc");
  });

  it("should reset all filters to defaults", () => {
    const { result } = renderHook(() => useDishListFilters());

    act(() => {
      result.current.updateFilters({
        q: "pasta",
        tagIds: ["550e8400-e29b-41d4-a716-446655440000"],
        page: 2,
        pageSize: 50,
        sort: "created_desc",
      });
    });

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

  it("should preserve existing filters when updating only one", () => {
    const { result } = renderHook(() => useDishListFilters());

    act(() => {
      result.current.updateFilters({
        q: "pasta",
        tagIds: ["550e8400-e29b-41d4-a716-446655440000"],
        sort: "created_desc",
      });
    });

    act(() => {
      result.current.updateFilters({ page: 2 });
    });

    expect(result.current.filters.q).toBe("pasta");
    expect(result.current.filters.tagIds).toContain("550e8400-e29b-41d4-a716-446655440000");
    expect(result.current.filters.sort).toBe("created_desc");

    act(() => {
      result.current.updateFilters({ pageSize: 50 });
    });

    expect(result.current.filters.q).toBe("pasta");
    expect(result.current.filters.page).toBe(2);
    expect(result.current.filters.pageSize).toBe(50);
  });

  it.todo("should handle SSR (window undefined)");
});
