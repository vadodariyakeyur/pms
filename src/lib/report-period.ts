/**
 * Turning report filter state into a date range.
 *
 * This was a closure inside Reports.tsx that read three state variables, so it
 * could not be called from a test — despite `monthNames.indexOf(month)`
 * returning -1 on a malformed month and silently yielding December of the
 * previous year.
 */
import { endOfMonth, format, setMonth, setYear, startOfMonth } from "date-fns";

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type ReportType = "date" | "daily" | "monthly";

/** A resolved range. `date` for a single day, `startDate`/`endDate` for a span. */
export type ReportPeriod = {
  date?: string;
  startDate?: string;
  endDate?: string;
};

/**
 * Parses the `"March-2025"` month key the monthly report select emits.
 * Returns null on anything malformed, rather than silently resolving to a
 * wrong month.
 */
export function parseMonthKey(
  key: string
): { month: number; year: number } | null {
  const [monthName, yearStr] = key.split("-");
  const month = monthNames.indexOf(monthName as (typeof monthNames)[number]);
  const year = parseInt(yearStr, 10);
  if (month < 0 || !Number.isFinite(year)) return null;
  return { month, year };
}

/** The inclusive `yyyy-MM-dd` bounds of the given month key. */
export function monthRange(
  key: string
): { startDate: string; endDate: string } | null {
  const parsed = parseMonthKey(key);
  if (!parsed) return null;

  const start = startOfMonth(setYear(setMonth(new Date(), parsed.month), parsed.year));
  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(endOfMonth(start), "yyyy-MM-dd"),
  };
}

/**
 * Resolves the period for a report run. Returns null when the inputs needed
 * for that report type are missing.
 */
export function resolvePeriod(args: {
  reportType: ReportType;
  startDate?: Date;
  endDate?: Date;
  dailyDate?: Date;
  monthKey?: string;
}): ReportPeriod | null {
  switch (args.reportType) {
    case "date":
      if (!args.startDate || !args.endDate) return null;
      return {
        startDate: format(args.startDate, "yyyy-MM-dd"),
        endDate: format(args.endDate, "yyyy-MM-dd"),
      };
    case "daily":
      if (!args.dailyDate) return null;
      return { date: format(args.dailyDate, "yyyy-MM-dd") };
    case "monthly":
      return args.monthKey ? monthRange(args.monthKey) : null;
    default:
      return null;
  }
}

/** The month options the monthly report select offers, newest first. */
export function monthOptions(now = new Date(), count = 12): string[] {
  const options: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = setMonth(now, now.getMonth() - i);
    options.push(`${monthNames[d.getMonth()]}-${d.getFullYear()}`);
  }
  return options;
}
