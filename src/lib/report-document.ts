/**
 * Builds the printable HTML for a report.
 *
 * The two print functions in Reports.tsx shared ~40 lines of identical CSS,
 * header markup, and print button, differing only in their column set. They
 * also wrote straight to a popup, so neither the markup nor the totals inside
 * it could be inspected without a browser.
 *
 * These functions return a string. Driving the print window is the caller's
 * job — see `openPrintDialog` in Reports.tsx.
 */
import { format } from "date-fns";

import { COMPANY_SHORT_NAME, formatBillNo } from "@/lib/bill";
import type { DateWiseAggregation, Parcel } from "@/lib/domain";
import { amountPaid, amountRemaining } from "@/lib/parcel-money";
import { monthlyTotals, recordTotals } from "@/lib/report-totals";

/** Escapes user data before interpolating it into print HTML. */
export const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"]/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]!)
  );

const STYLES = `
  body { font-family: Arial, sans-serif; margin: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th, td { border: 1px solid #000; padding: 4px; text-align: center; }
  th { background-color: #f2f2f2; }
  .header { position: relative; text-align: center; margin-bottom: 20px; }
  .city { position: absolute; top: -34px; left: 4px }
  .date { position: absolute; top: -34px; right: 4px }
  @media print {
    button { display: none; }
  }
`;

const PRINT_BUTTON = `<button onclick="window.print();" style="float: right; padding: 8px 16px; background: #4a5568; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 20px;">Print Report</button>`;

type Heading = {
  fromCity: string;
  toCity: string;
  date: string;
  /** How many columns the title row spans. */
  colSpan: number;
};

/** The shared page shell: doctype, styles, print button, and title row. */
function page(heading: Heading, columns: string[], body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Parcel Report</title>
      <style>${STYLES}</style>
    </head>
    <body>
      ${PRINT_BUTTON}
      <table>
        <thead>
          <tr>
            <th colspan="${heading.colSpan}">
              <div class="header">
                <h2>${COMPANY_SHORT_NAME}</h2>
                <p class="city">
                  From ${esc(heading.fromCity)} to ${esc(heading.toCity)}
                </p>
                <p class="date">Date: ${esc(heading.date)}</p>
              </div>
            </th>
          </tr>
          <tr>${columns.map((c) => `<th>${c}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${body}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

/** The date-wise aggregated monthly report. */
export function monthlyReportHtml(
  rows: DateWiseAggregation[],
  heading: Omit<Heading, "colSpan">
): string {
  const totals = monthlyTotals(rows);

  const body = `
    ${rows
      .map(
        (row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${format(row.parcel_date, "dd/MM/yyyy") || ""}</td>
        <td>${row.record_count || "0"}</td>
        <td>${row.total_qty || "0"}</td>
        <td>${row.total_amount_given || "0"}</td>
        <td>${row.total_amount_remaining || "0"}</td>
      </tr>
    `
      )
      .join("")}
    <tr>
      <td colspan="2" style="text-align: right;"><strong>Total</strong></td>
      <td><strong>${totals.recordCount}</strong></td>
      <td><strong>${totals.qty}</strong></td>
      <td><strong>${totals.amountGiven}</strong></td>
      <td><strong>${totals.amountRemaining}</strong></td>
    </tr>
  `;

  return page(
    { ...heading, colSpan: 6 },
    ["ક્રમ", "તારીખ", "ટોટલ બીલ", "જથ્થો", "જમા", "બાકી"],
    body
  );
}

/** The per-parcel record report, with a signature column. */
export function recordReportHtml(
  rows: Parcel[],
  heading: Omit<Heading, "colSpan">
): string {
  const totals = recordTotals(rows);

  const body = `
    ${rows
      .map(
        (parcel, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${esc(parcel.sender_name)}</td>
        <td>${esc(parcel.sender_mobile_no)}</td>
        <td>${esc(parcel.receiver_name)}</td>
        <td>${esc(parcel.receiver_mobile_no)}</td>
        <td>${esc(formatBillNo(parcel.bill_no))}</td>
        <td>${parcel.qty || ""}</td>
        <td>${esc(parcel.description)}</td>
        <td>${esc(parcel.remark)}</td>
        <td>${amountPaid(parcel)}</td>
        <td>${amountRemaining(parcel)}</td>
        <td class="signature-cell"></td>
      </tr>
    `
      )
      .join("")}
    <tr>
      <td colspan="6" style="text-align: right;"><strong>Total</strong></td>
      <td><strong>${totals.qty}</strong></td>
      <td></td>
      <td></td>
      <td><strong>${totals.amountGiven}</strong></td>
      <td><strong>${totals.amountRemaining}</strong></td>
      <td></td>
    </tr>
  `;

  return page(
    { ...heading, colSpan: 12 },
    [
      "ક્રમ",
      "મોકલનાર",
      "મોકલનાર<br/>મોબાઈલ",
      "લેનાર",
      "લેનાર<br/>મોબાઈલ",
      "બિલ નં",
      "જથ્થો",
      "વર્ણન",
      "રિમાર્ક",
      "જમા",
      "બાકી",
      "સહી",
    ],
    body
  );
}
