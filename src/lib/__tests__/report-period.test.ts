import { describe, expect, test } from "vitest";
import { monthOptions, monthRange, parseMonthKey, resolvePeriod } from "@/lib/report-period";

describe("parseMonthKey", () => {
  test("parses the MonthName-YYYY form the select emits", () => {
    expect(parseMonthKey("March-2025")).toEqual({ month: 2, year: 2025 });
    expect(parseMonthKey("January-2024")).toEqual({ month: 0, year: 2024 });
    expect(parseMonthKey("December-2024")).toEqual({ month: 11, year: 2024 });
  });

  test("is null for an unknown month rather than silently wrong", () => {
    // The old code used monthNames.indexOf(month), which returns -1 and
    // resolved to December of the *previous* year with no error.
    expect(parseMonthKey("Smarch-2025")).toBeNull();
    expect(parseMonthKey("march-2025")).toBeNull(); // case-sensitive by design
  });

  test("is null for a malformed year", () => {
    expect(parseMonthKey("March-abcd")).toBeNull();
    expect(parseMonthKey("March")).toBeNull();
    expect(parseMonthKey("")).toBeNull();
  });
});

describe("monthRange", () => {
  test("spans the whole month", () => {
    expect(monthRange("March-2025")).toEqual({
      startDate: "2025-03-01",
      endDate: "2025-03-31",
    });
  });

  test("handles February in a leap year", () => {
    expect(monthRange("February-2024")).toEqual({
      startDate: "2024-02-01",
      endDate: "2024-02-29",
    });
  });

  test("handles February in a non-leap year", () => {
    expect(monthRange("February-2025")).toEqual({
      startDate: "2025-02-01",
      endDate: "2025-02-28",
    });
  });

  test("is null on a bad key instead of returning a wrong range", () => {
    expect(monthRange("Smarch-2025")).toBeNull();
  });
});

describe("resolvePeriod", () => {
  test("date report uses the start/end pair", () => {
    expect(
      resolvePeriod({
        reportType: "date",
        startDate: new Date(2025, 2, 1),
        endDate: new Date(2025, 2, 15),
      })
    ).toEqual({ startDate: "2025-03-01", endDate: "2025-03-15" });
  });

  test("daily report uses a single date", () => {
    expect(
      resolvePeriod({ reportType: "daily", dailyDate: new Date(2025, 2, 9) })
    ).toEqual({ date: "2025-03-09" });
  });

  test("monthly report expands the month key", () => {
    expect(
      resolvePeriod({ reportType: "monthly", monthKey: "March-2025" })
    ).toEqual({ startDate: "2025-03-01", endDate: "2025-03-31" });
  });

  test("is null when the required input is missing", () => {
    expect(resolvePeriod({ reportType: "date" })).toBeNull();
    expect(resolvePeriod({ reportType: "daily" })).toBeNull();
    expect(resolvePeriod({ reportType: "monthly" })).toBeNull();
  });
});

describe("monthOptions", () => {
  test("lists the current month first, going backwards", () => {
    const options = monthOptions(new Date(2025, 2, 15), 3);
    expect(options).toEqual(["March-2025", "February-2025", "January-2025"]);
  });

  test("every option round-trips through parseMonthKey", () => {
    for (const option of monthOptions(new Date(2025, 0, 15), 12)) {
      expect(parseMonthKey(option)).not.toBeNull();
    }
  });
});
