import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("initial", 500));

    expect(result.current).toBe("initial");
  });

  it("should debounce value changes", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
      initialProps: { value: "initial" },
    });

    expect(result.current).toBe("initial");

    // Change value
    rerender({ value: "changed" });

    // Value should not change immediately
    expect(result.current).toBe("initial");

    // Fast-forward time by 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Value should now be updated
    expect(result.current).toBe("changed");
  });

  it("should reset timer on rapid value changes", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
      initialProps: { value: "initial" },
    });

    // First change
    rerender({ value: "change1" });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Second change before debounce completes
    rerender({ value: "change2" });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Third change before debounce completes
    rerender({ value: "change3" });

    // Still showing initial value
    expect(result.current).toBe("initial");

    // Fast-forward full delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should show only the last value
    expect(result.current).toBe("change3");
  });

  it("should use custom delay", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 1000), {
      initialProps: { value: "initial" },
    });

    rerender({ value: "changed" });

    // Not changed after 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe("initial");

    // Changed after 1000ms
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe("changed");
  });

  it("should handle different types", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
      initialProps: { value: 42 },
    });

    expect(result.current).toBe(42);

    rerender({ value: 100 });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(100);
  });

  it("should cleanup timer on unmount", () => {
    const { unmount } = renderHook(() => useDebouncedValue("test", 500));

    // Unmount should not throw
    expect(() => unmount()).not.toThrow();
  });

  it("should handle object values", () => {
    const initialObj = { name: "initial" };
    const changedObj = { name: "changed" };

    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
      initialProps: { value: initialObj },
    });

    expect(result.current).toBe(initialObj);

    rerender({ value: changedObj });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(changedObj);
  });
});
