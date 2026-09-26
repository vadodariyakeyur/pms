/**
 * Report column totals.
 *
 * These reducers used to live *inside* HTML template literals in Reports.tsx —
 * computed as a side effect of building markup, so they could not be inspected,
 * reused, or tested. One of them read
 * `a + (c.amount - c.amount_given || 0)`, which parses as
 * `a + ((c.amount - c.amount_given) || 0)`. That happened to be the intent, but
 * nothing asserted it.
 */
import type { DateWiseAggregation, Parcel } from "@/lib/domain";
import { amountPaid, amountRemaining } from "@/lib/parcel-money";

export type RecordTotals = {
  qty: number;
  amountGiven: number;
  amountRemaining: number;
};

/** Footer totals for the per-parcel record report. */
export function recordTotals(rows: Parcel[]): RecordTotals {
  return rows.reduce<RecordTotals>(
    (acc, row) => ({
      qty: acc.qty + (row.qty || 0),
      amountGiven: acc.amountGiven + amountPaid(row),
      amountRemaining: acc.amountRemaining + amountRemaining(row),
    }),
    { qty: 0, amountGiven: 0, amountRemaining: 0 }
  );
}

export type MonthlyTotals = {
  recordCount: number;
  qty: number;
  amountGiven: number;
  amountRemaining: number;
};

/** Footer totals for the date-wise aggregated monthly report. */
export function monthlyTotals(rows: DateWiseAggregation[]): MonthlyTotals {
  return rows.reduce<MonthlyTotals>(
    (acc, row) => ({
      recordCount: acc.recordCount + (row.record_count || 0),
      qty: acc.qty + (row.total_qty || 0),
      amountGiven: acc.amountGiven + (row.total_amount_given || 0),
      amountRemaining: acc.amountRemaining + (row.total_amount_remaining || 0),
    }),
    { recordCount: 0, qty: 0, amountGiven: 0, amountRemaining: 0 }
  );
}
