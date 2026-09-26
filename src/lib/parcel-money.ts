/**
 * Every rupee figure derived from a parcel lives here.
 *
 * Before this module the `amount - amount_given` formula was written out at six
 * call sites with four different null-guards, alongside an `amount_remaining`
 * column that Add/Edit wrote and nothing ever read. The column and the six
 * expressions could disagree with nothing to detect it.
 *
 * Now: one derivation, and `amount_remaining` is this module's output rather
 * than a seventh independent opinion.
 */

/** A parcel's money fields, as held in a draft form (nullable while typing). */
export type ParcelAmounts = {
  amount: number | null | undefined;
  amount_given: number | null | undefined;
};

/** Total billed for the parcel. */
export function totalAmount(p: ParcelAmounts): number {
  return p.amount || 0;
}

/** Amount the customer has already paid. */
export function amountPaid(p: ParcelAmounts): number {
  return p.amount_given || 0;
}

/**
 * Balance still owed. Null/undefined/NaN on either side counts as zero, so a
 * half-filled form shows a sane number instead of NaN.
 */
export function amountRemaining(p: ParcelAmounts): number {
  return totalAmount(p) - amountPaid(p);
}

/** True when the parcel still has an outstanding balance. */
export function isUnpaid(p: ParcelAmounts): boolean {
  return amountRemaining(p) > 0;
}

/**
 * The three money columns as persisted on a parcel row. Add and Edit both
 * build their insert/update payload from this, so the stored
 * `amount_remaining` is by construction consistent with what the UI displays.
 */
export function amountColumns(p: ParcelAmounts) {
  return {
    amount: totalAmount(p),
    amount_given: amountPaid(p),
    amount_remaining: amountRemaining(p),
  };
}

/** Rupees for display, with Indian digit grouping. */
export function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}
