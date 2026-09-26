import { describe, expect, test } from "vitest";
import type { DateWiseAggregation, Parcel } from "@/lib/domain";
import { monthlyTotals, recordTotals } from "@/lib/report-totals";

/** Only the money/qty fields matter here; the rest of the row is irrelevant. */
const parcel = (amount: number, given: number, qty: number) =>
  ({ amount, amount_given: given, qty }) as Parcel;

describe("recordTotals", () => {
  test("sums quantity, paid, and outstanding across rows", () => {
    const rows = [parcel(500, 200, 2), parcel(300, 300, 1), parcel(100, 0, 3)];
    expect(recordTotals(rows)).toEqual({
      qty: 6,
      amountGiven: 500,
      amountRemaining: 400,
    });
  });

  test("an overpaid row offsets the outstanding total", () => {
    // The old reducer read `a + (c.amount - c.amount_given || 0)`, which keeps
    // the sign — this pins that behaviour down.
    expect(recordTotals([parcel(500, 800, 1)]).amountRemaining).toBe(-300);
  });

  test("is all zeroes for no rows, so an empty report still prints", () => {
    expect(recordTotals([])).toEqual({
      qty: 0,
      amountGiven: 0,
      amountRemaining: 0,
    });
  });

  test("treats a missing quantity as zero rather than NaN", () => {
    const rows = [{ amount: 100, amount_given: 0 } as Parcel];
    expect(recordTotals(rows).qty).toBe(0);
  });
});

describe("monthlyTotals", () => {
  const day = (
    record_count: number,
    total_qty: number,
    total_amount_given: number,
    total_amount_remaining: number
  ): DateWiseAggregation => ({
    parcel_date: "2025-03-01",
    record_count,
    total_qty,
    total_amount_given,
    total_amount_remaining,
  });

  test("sums each aggregated column", () => {
    expect(monthlyTotals([day(2, 5, 400, 100), day(3, 7, 600, 250)])).toEqual({
      recordCount: 5,
      qty: 12,
      amountGiven: 1000,
      amountRemaining: 350,
    });
  });

  test("is all zeroes for no rows", () => {
    expect(monthlyTotals([])).toEqual({
      recordCount: 0,
      qty: 0,
      amountGiven: 0,
      amountRemaining: 0,
    });
  });
});
