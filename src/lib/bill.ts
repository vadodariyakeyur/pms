/**
 * Bill identity and company branding.
 *
 * The `R` prefix was applied by hand at six sites and parsed at a seventh, and
 * the two disagreed: `getWhatsappMessage` emitted `R-123` (hyphenated, the only
 * one) while the search box only stripped a bare leading `r`. A bill number
 * copied out of a WhatsApp message would not find its parcel.
 *
 * Format and parse now sit next to each other so they cannot drift —
 * see `parseBillNo` in `parcels.ts` and the round-trip test.
 */

/** The company name, as printed on receipts and reports. */
export const COMPANY_NAME = "(PRAMUKHRAJ) SHREE NATHJI TRAVELS & CARGO";

/** The shorter form used in report page headers. */
export const COMPANY_SHORT_NAME = "Pramukhraj Travels & Cargo";

/** Fallback contact numbers, used when an office has no number of its own. */
export const FALLBACK_CONTACTS = {
  rajkot: "84019 39945 / 81550 66443",
  surat: "90992 66443",
} as const;

/** A bill number as shown to a customer. */
export function formatBillNo(billNo: number | string): string {
  return `R${billNo}`;
}

/**
 * Resolves the contact number to print, preferring the office's own.
 *
 * The printed receipt already did this; the WhatsApp message hardcoded
 * Rajkot's number and ignored the office entirely.
 */
export function contactLine(officeMobileNo?: string | null): string {
  return officeMobileNo || FALLBACK_CONTACTS.rajkot;
}

/**
 * The public receipt URL for a parcel, keyed by its id (bill numbers are
 * display-only and can repeat after a reset).
 *
 * The id is base64-encoded purely to keep it non-obvious in a shared
 * link — it is not a security measure, and the route must not treat it as one.
 */
export function receiptUrl(id: number | string, origin: string): string {
  return `${origin}/#/reciept/${btoa(String(id))}`;
}

/** Decodes a public receipt token back to a parcel id, or null if malformed. */
export function parseReceiptToken(token: string): number | null {
  try {
    const decoded = atob(token);
    if (!/^\d+$/.test(decoded)) return null;
    return parseInt(decoded, 10);
  } catch {
    // atob throws on malformed base64 — a truncated or hand-edited link.
    return null;
  }
}
