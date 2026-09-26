import { describe, expect, test } from "vitest";
import {
  amountColumns,
  amountPaid,
  amountRemaining,
  inr,
  isUnpaid,
  totalAmount,
} from "@/lib/parcel-money";

describe("amountRemaining", () => {
  test("subtracts what was paid from the total", () => {
    expect(amountRemaining({ amount: 500, amount_given: 200 })).toBe(300);
  });

  test("is zero on a fully paid parcel", () => {
    expect(amountRemaining({ amount: 500, amount_given: 500 })).toBe(0);
  });

  test("treats a null total as zero rather than NaN", () => {
    // A half-filled form: the customer has paid nothing and no amount is typed.
    expect(amountRemaining({ amount: null, amount_given: null })).toBe(0);
    expect(amountRemaining({ amount: undefined, amount_given: undefined })).toBe(0);
  });

  test("treats a null payment as unpaid, not as free", () => {
    expect(amountRemaining({ amount: 500, amount_given: null })).toBe(500);
  });

  test("goes negative when overpaid, rather than clamping", () => {
    // Reports totalled these raw, so an overpayment must stay signed for the
    // column total to come out right.
    expect(amountRemaining({ amount: 500, amount_given: 800 })).toBe(-300);
  });
});

describe("isUnpaid", () => {
  test("is true only with a positive balance", () => {
    expect(isUnpaid({ amount: 500, amount_given: 200 })).toBe(true);
    expect(isUnpaid({ amount: 500, amount_given: 500 })).toBe(false);
    expect(isUnpaid({ amount: 500, amount_given: 800 })).toBe(false);
  });
});

describe("totalAmount / amountPaid", () => {
  test("default to zero when absent", () => {
    expect(totalAmount({ amount: null, amount_given: null })).toBe(0);
    expect(amountPaid({ amount: null, amount_given: null })).toBe(0);
  });
});

describe("amountColumns", () => {
  test("the persisted remainder agrees with the displayed one", () => {
    // This is the invariant the old code could violate: the stored column and
    // the recomputed display value came from separate expressions.
    const draft = { amount: 750, amount_given: 250 };
    expect(amountColumns(draft)).toEqual({
      amount: 750,
      amount_given: 250,
      amount_remaining: 500,
    });
    expect(amountColumns(draft).amount_remaining).toBe(amountRemaining(draft));
  });

  test("normalises nulls so the row never stores null money", () => {
    expect(amountColumns({ amount: null, amount_given: null })).toEqual({
      amount: 0,
      amount_given: 0,
      amount_remaining: 0,
    });
  });
});

describe("inr", () => {
  test("groups with Indian lakh/crore separators", () => {
    expect(inr(100000)).toBe("₹1,00,000");
    expect(inr(0)).toBe("₹0");
  });
});
