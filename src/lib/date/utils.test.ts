import { describe, it, expect } from "vitest";
import {
  formatDateISO,
  parseDateISO,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  getWeekStart,
  getWeekEnd,
  isToday,
  formatWeekRange,
  generateDateRange,
  getWeekDays,
} from "./utils";

describe("date utils", () => {
  describe("formatDateISO", () => {
    it("should format date as YYYY-MM-DD", () => {
      const date = new Date(2025, 11, 25); // December 25, 2025
      expect(formatDateISO(date)).toBe("2025-12-25");
    });

    it("should pad single digit months and days", () => {
      const date = new Date(2025, 0, 5); // January 5, 2025
      expect(formatDateISO(date)).toBe("2025-01-05");
    });

    it("should handle leap year", () => {
      const date = new Date(2024, 1, 29); // February 29, 2024
      expect(formatDateISO(date)).toBe("2024-02-29");
    });
  });

  describe("parseDateISO", () => {
    it("should parse YYYY-MM-DD to Date", () => {
      const date = parseDateISO("2025-12-25");
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11); // December (0-indexed)
      expect(date.getDate()).toBe(25);
    });

    it("should parse date with leading zeros", () => {
      const date = parseDateISO("2025-01-05");
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(5);
    });

    it("should be inverse of formatDateISO", () => {
      const original = new Date(2025, 5, 15);
      const formatted = formatDateISO(original);
      const parsed = parseDateISO(formatted);

      expect(parsed.getFullYear()).toBe(original.getFullYear());
      expect(parsed.getMonth()).toBe(original.getMonth());
      expect(parsed.getDate()).toBe(original.getDate());
    });
  });

  describe("startOfWeek", () => {
    it("should return Monday for a date in the middle of week (default firstDay=1)", () => {
      const wednesday = new Date(2025, 11, 24); // Wednesday, December 24, 2025
      const monday = startOfWeek(wednesday);

      expect(monday.getDay()).toBe(1); // Monday
      expect(formatDateISO(monday)).toBe("2025-12-22");
    });

    it("should return same date if already Monday", () => {
      const monday = new Date(2025, 11, 22); // Monday, December 22, 2025
      const weekStart = startOfWeek(monday);

      expect(formatDateISO(weekStart)).toBe("2025-12-22");
    });

    it("should handle Sunday (wraps to previous Monday)", () => {
      const sunday = new Date(2025, 11, 28); // Sunday, December 28, 2025
      const monday = startOfWeek(sunday);

      expect(monday.getDay()).toBe(1);
      expect(formatDateISO(monday)).toBe("2025-12-22");
    });

    it("should reset time to midnight", () => {
      const date = new Date(2025, 11, 24, 15, 30, 45);
      const weekStart = startOfWeek(date);

      expect(weekStart.getHours()).toBe(0);
      expect(weekStart.getMinutes()).toBe(0);
      expect(weekStart.getSeconds()).toBe(0);
      expect(weekStart.getMilliseconds()).toBe(0);
    });
  });

  describe("endOfWeek", () => {
    it("should return Sunday for a date in the middle of week", () => {
      const wednesday = new Date(2025, 11, 24); // Wednesday, December 24, 2025
      const sunday = endOfWeek(wednesday);

      expect(sunday.getDay()).toBe(0); // Sunday
      expect(formatDateISO(sunday)).toBe("2025-12-28");
    });

    it("should return same date if already Sunday", () => {
      const sunday = new Date(2025, 11, 28); // Sunday, December 28, 2025
      const weekEnd = endOfWeek(sunday);

      expect(formatDateISO(weekEnd)).toBe("2025-12-28");
    });

    it("should set time to end of day", () => {
      const date = new Date(2025, 11, 24);
      const weekEnd = endOfWeek(date);

      expect(weekEnd.getHours()).toBe(23);
      expect(weekEnd.getMinutes()).toBe(59);
      expect(weekEnd.getSeconds()).toBe(59);
      expect(weekEnd.getMilliseconds()).toBe(999);
    });
  });

  describe("addDays", () => {
    it("should add positive days", () => {
      const date = new Date(2025, 11, 25);
      const result = addDays(date, 5);

      expect(formatDateISO(result)).toBe("2025-12-30");
    });

    it("should subtract days with negative number", () => {
      const date = new Date(2025, 11, 25);
      const result = addDays(date, -5);

      expect(formatDateISO(result)).toBe("2025-12-20");
    });

    it("should handle month boundaries", () => {
      const date = new Date(2025, 11, 30);
      const result = addDays(date, 2);

      expect(formatDateISO(result)).toBe("2026-01-01");
    });

    it("should not mutate original date", () => {
      const original = new Date(2025, 11, 25);
      const originalTime = original.getTime();
      addDays(original, 5);

      expect(original.getTime()).toBe(originalTime);
    });
  });

  describe("addWeeks", () => {
    it("should add positive weeks", () => {
      const date = new Date(2025, 11, 25);
      const result = addWeeks(date, 2);

      expect(formatDateISO(result)).toBe("2026-01-08");
    });

    it("should subtract weeks with negative number", () => {
      const date = new Date(2025, 11, 25);
      const result = addWeeks(date, -1);

      expect(formatDateISO(result)).toBe("2025-12-18");
    });
  });

  describe("getWeekStart and getWeekEnd", () => {
    it("should get current week start with weekIndex 0", () => {
      const baseDate = new Date(2025, 11, 24); // Wednesday
      const weekStart = getWeekStart(0, baseDate);

      expect(formatDateISO(weekStart)).toBe("2025-12-22"); // Monday
    });

    it("should get previous week start with weekIndex -1", () => {
      const baseDate = new Date(2025, 11, 24); // Wednesday
      const weekStart = getWeekStart(-1, baseDate);

      expect(formatDateISO(weekStart)).toBe("2025-12-15"); // Monday of previous week
    });

    it("should get next week start with weekIndex 1", () => {
      const baseDate = new Date(2025, 11, 24); // Wednesday
      const weekStart = getWeekStart(1, baseDate);

      expect(formatDateISO(weekStart)).toBe("2025-12-29"); // Monday of next week
    });

    it("should get week end correctly", () => {
      const baseDate = new Date(2025, 11, 24); // Wednesday
      const weekEnd = getWeekEnd(0, baseDate);

      expect(formatDateISO(weekEnd)).toBe("2025-12-28"); // Sunday
    });
  });

  describe("isToday", () => {
    it("should return true for today's date", () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it("should return false for yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it("should return false for tomorrow", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });

    it("should ignore time component", () => {
      const todayMorning = new Date();
      todayMorning.setHours(8, 0, 0, 0);
      const todayEvening = new Date();
      todayEvening.setHours(20, 0, 0, 0);

      expect(isToday(todayMorning)).toBe(true);
      expect(isToday(todayEvening)).toBe(true);
    });
  });

  describe("formatWeekRange", () => {
    it("should format week range in Polish locale", () => {
      const start = new Date(2025, 11, 22); // Monday
      const end = new Date(2025, 11, 28); // Sunday

      const formatted = formatWeekRange(start, end);

      expect(formatted).toContain("22");
      expect(formatted).toContain("28");
      expect(formatted).toContain("2025");
      // Month format may vary by locale, so just check it's there
      expect(formatted.length).toBeGreaterThan(10);
    });

    it("should handle custom locale", () => {
      const start = new Date(2025, 11, 22);
      const end = new Date(2025, 11, 28);

      const formatted = formatWeekRange(start, end, "en-US");

      expect(formatted).toContain("22");
      expect(formatted).toContain("28");
    });
  });

  describe("generateDateRange", () => {
    it("should generate array of dates between start and end inclusive", () => {
      const start = new Date(2025, 11, 22);
      const end = new Date(2025, 11, 25);

      const dates = generateDateRange(start, end);

      expect(dates).toHaveLength(4); // 22, 23, 24, 25
      expect(formatDateISO(dates[0])).toBe("2025-12-22");
      expect(formatDateISO(dates[3])).toBe("2025-12-25");
    });

    it("should return single date when start equals end", () => {
      const date = new Date(2025, 11, 25);

      const dates = generateDateRange(date, date);

      expect(dates).toHaveLength(1);
      expect(formatDateISO(dates[0])).toBe("2025-12-25");
    });

    it("should handle month boundaries", () => {
      const start = new Date(2025, 11, 30);
      const end = new Date(2026, 0, 2);

      const dates = generateDateRange(start, end);

      expect(dates).toHaveLength(4); // Dec 30, 31, Jan 1, 2
      expect(formatDateISO(dates[0])).toBe("2025-12-30");
      expect(formatDateISO(dates[3])).toBe("2026-01-02");
    });

    it("should not mutate input dates", () => {
      const start = new Date(2025, 11, 22);
      const end = new Date(2025, 11, 25);
      const startTime = start.getTime();
      const endTime = end.getTime();

      generateDateRange(start, end);

      expect(start.getTime()).toBe(startTime);
      expect(end.getTime()).toBe(endTime);
    });
  });

  describe("getWeekDays", () => {
    it("should return 7 days for current week", () => {
      const baseDate = new Date(2025, 11, 24); // Wednesday
      const days = getWeekDays(0, baseDate);

      expect(days).toHaveLength(7);
      expect(formatDateISO(days[0])).toBe("2025-12-22"); // Monday
      expect(formatDateISO(days[6])).toBe("2025-12-28"); // Sunday
    });

    it("should return 7 days for previous week", () => {
      const baseDate = new Date(2025, 11, 24);
      const days = getWeekDays(-1, baseDate);

      expect(days).toHaveLength(7);
      expect(formatDateISO(days[0])).toBe("2025-12-15"); // Monday
      expect(formatDateISO(days[6])).toBe("2025-12-21"); // Sunday
    });

    it("should return 7 days for next week", () => {
      const baseDate = new Date(2025, 11, 24);
      const days = getWeekDays(1, baseDate);

      expect(days).toHaveLength(7);
      expect(formatDateISO(days[0])).toBe("2025-12-29"); // Monday
      expect(formatDateISO(days[6])).toBe("2026-01-04"); // Sunday
    });
  });
});
