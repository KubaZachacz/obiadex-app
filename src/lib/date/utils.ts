import { WEEK_START_DAY } from "./constants";

/**
 * Formats a Date as YYYY-MM-DD string.
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD string to Date (local timezone).
 */
export function parseDateISO(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Gets the start of the week for a given date (Monday by default).
 */
export function startOfWeek(date: Date, firstDay: number = WEEK_START_DAY): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < firstDay ? 7 : 0) + day - firstDay;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the end of the week for a given date (Sunday by default).
 */
export function endOfWeek(date: Date, firstDay: number = WEEK_START_DAY): Date {
  const start = startOfWeek(date, firstDay);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Adds a number of days to a date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds a number of weeks to a date.
 */
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * Returns the start date of a week based on weekIndex.
 * weekIndex 0 = current week, -1 = previous week, +1 = next week.
 */
export function getWeekStart(weekIndex: number, baseDate: Date = new Date()): Date {
  const currentWeekStart = startOfWeek(baseDate);
  return addWeeks(currentWeekStart, weekIndex);
}

/**
 * Returns the end date of a week based on weekIndex.
 */
export function getWeekEnd(weekIndex: number, baseDate: Date = new Date()): Date {
  const weekStart = getWeekStart(weekIndex, baseDate);
  return endOfWeek(weekStart);
}

/**
 * Checks if a date is today.
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Formats date range for display (e.g., "2–8 XII 2025").
 */
export function formatWeekRange(start: Date, end: Date, locale: string = "pl-PL"): string {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const month = end.toLocaleDateString(locale, { month: "short" }).toUpperCase();
  const year = end.getFullYear();

  return `${startDay}–${endDay} ${month} ${year}`;
}

/**
 * Generates array of dates between start and end (inclusive).
 */
export function generateDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Gets all days in a week as Date array.
 */
export function getWeekDays(weekIndex: number, baseDate: Date = new Date()): Date[] {
  const start = getWeekStart(weekIndex, baseDate);
  const end = getWeekEnd(weekIndex, baseDate);
  return generateDateRange(start, end);
}
