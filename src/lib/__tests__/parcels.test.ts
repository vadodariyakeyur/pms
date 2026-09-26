import { describe, expect, test } from "vitest";
import { parseBillNo } from "@/lib/parcels";

describe("parseBillNo", () => {
  test("accepts a bare number", () => {
    expect(parseBillNo("123")).toBe(123);
  });

  test("accepts the R prefix in either case", () => {
    expect(parseBillNo("R123")).toBe(123);
    expect(parseBillNo("r123")).toBe(123);
  });

  test("accepts the hyphenated form the WhatsApp receipt emits", () => {
    // getWhatsappMessage renders "Bill Number: R-123". Customers paste that
    // back into the search box verbatim; the old parser only stripped a bare
    // "r", so the search silently found nothing.
    expect(parseBillNo("R-123")).toBe(123);
    expect(parseBillNo("r-123")).toBe(123);
  });

  test("ignores surrounding whitespace", () => {
    expect(parseBillNo("  R123  ")).toBe(123);
  });

  test("is null for empty input, so the filter is skipped", () => {
    expect(parseBillNo("")).toBeNull();
    expect(parseBillNo("   ")).toBeNull();
  });

  test("is null for non-numeric input rather than NaN", () => {
    // parseInt("abc") is NaN, which would have gone into the query as
    // `bill_no=eq.NaN` and errored at the server.
    expect(parseBillNo("abc")).toBeNull();
    expect(parseBillNo("R")).toBeNull();
    expect(parseBillNo("12a")).toBeNull();
  });
});
