import { describe, expect, test } from "vitest";
import {
  FALLBACK_CONTACTS,
  contactLine,
  formatBillNo,
  parseReceiptToken,
  receiptUrl,
} from "@/lib/bill";
import { parseBillNo } from "@/lib/parcels";

describe("formatBillNo / parseBillNo round trip", () => {
  test("what we display, we can parse back", () => {
    // This is the invariant that was broken: the WhatsApp message rendered
    // "R-123" while the search box only stripped a bare "r", so a customer
    // pasting their bill number found nothing.
    for (const n of [1, 42, 123, 99999]) {
      expect(parseBillNo(formatBillNo(n))).toBe(n);
    }
  });

  test("formats with the R prefix", () => {
    expect(formatBillNo(123)).toBe("R123");
  });
});

describe("contactLine", () => {
  test("prefers the office's own number", () => {
    expect(contactLine("99999 11111")).toBe("99999 11111");
  });

  test("falls back when the office has none", () => {
    // The printed receipt already did this; the WhatsApp message hardcoded
    // Rajkot's number and ignored the office entirely.
    expect(contactLine(null)).toBe(FALLBACK_CONTACTS.rajkot);
    expect(contactLine(undefined)).toBe(FALLBACK_CONTACTS.rajkot);
    expect(contactLine("")).toBe(FALLBACK_CONTACTS.rajkot);
  });
});

describe("receiptUrl / parseReceiptToken round trip", () => {
  test("a generated link decodes back to its bill number", () => {
    const url = receiptUrl(123, "https://example.com");
    const token = url.split("/").pop()!;
    expect(parseReceiptToken(token)).toBe(123);
  });

  test("builds the hash route the router expects", () => {
    expect(receiptUrl(123, "https://example.com")).toBe(
      `https://example.com/#/reciept/${btoa("123")}`
    );
  });

  test("is null on a malformed token instead of throwing", () => {
    // atob throws on invalid base64 — a truncated or hand-edited link used to
    // surface as a generic "Failed to load receipt".
    expect(parseReceiptToken("!!!not base64!!!")).toBeNull();
    expect(parseReceiptToken(btoa("not-a-number"))).toBeNull();
  });
});
