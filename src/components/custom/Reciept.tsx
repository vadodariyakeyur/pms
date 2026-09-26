import { COMPANY_NAME, contactLine, formatBillNo } from "@/lib/bill";
import type { PublicParcel } from "@/lib/domain";
import { amountRemaining } from "@/lib/parcel-money";
import { format } from "date-fns";
import { ComponentPropsWithRef, useEffect, useRef } from "react";

// Takes the narrow public projection, not the full row: the receipt renders
// the same fields whether it came from an authenticated query or the public
// RPC, and a full `Parcel` is assignable to this.
type ReceiptProps = ComponentPropsWithRef<"div"> & {
  parcel: PublicParcel;
};

export function Receipt({ parcel, ...rest }: ReceiptProps) {
  const fitRef = useRef<HTMLDivElement>(null);

  // Feeds the screen-only scale CSS below. Values aren't knowable to CSS:
  // available width depends on the page shell, sheet height is content-driven.
  useEffect(() => {
    const fit = fitRef.current;
    const sheet = fit?.firstElementChild as HTMLElement | null;
    if (!fit || !sheet) return;

    const measure = () => {
      // offsetWidth/Height are pre-transform, which is what we want here.
      const scale = Math.min(1, fit.clientWidth / sheet.offsetWidth);
      fit.style.setProperty("--receipt-scale", `${scale}`);
      fit.style.setProperty("--receipt-h", `${sheet.offsetHeight}px`);
      const slack = fit.clientWidth - sheet.offsetWidth * scale;
      fit.style.setProperty("--receipt-slack", `${slack}px`);
    };

    measure();
    // Sheet only — observing `fit` feeds back, since measure() writes its height.
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <>
      {/* Fixed 210mm because that is what prints. Do not add a second
          responsive layout — the one sheet is scaled down instead, so screen
          always matches paper. */}
      <div ref={fitRef} className="receipt-fit print:!h-auto">
        <div className="receipt-sheet w-[210mm] mx-auto print:w-full">
          <div
            className="bg-white text-black p-4 mx-auto rounded-lg shadow-lg ring-1 ring-black/10 print:rounded-none print:shadow-none print:ring-0"
            {...rest}
          >
            {/* Print Header */}
            <div className="border-b-2 border-black pb-2 mb-3">
              <div className="relative text-center">
                <h1 className="text-[26px] font-bold uppercase leading-[1.1] tracking-[-0.02em]">
                  {COMPANY_NAME}
                </h1>
                <p className="text-sm font-bold leading-snug mt-0.5">
                  {parcel.office_address ||
                    "રાજકોટ :- 150 ફુટ રિંગ રોડ, ગોવર્ધન ચોક ની પાસે, સ્કાય હેઈટ્સ બિલ્ડીંગ ની સામે"}
                  , મો. -{" "}
                  <b className="text-base whitespace-nowrap">
                    {contactLine(parcel.office_mobile_no)}
                  </b>
                </p>
              </div>
            </div>

            {/* Cities */}
            <div className="text-xl font-bold mb-3 text-center tracking-[-0.01em]">
              {parcel.from_city?.name} to {parcel.to_city?.name}
            </div>

            {/* Receipt Details */}
            <div className="font-bold grid grid-cols-2 gap-2 mb-3 text-sm">
              <table className="table-fixed w-full border-collapse">
                <colgroup>
                  <col className="w-[38%]" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="border-2 border-black px-1 py-0.5 align-middle">
                      <strong>Bill No:</strong>
                    </td>
                    <td className="border-2 border-black px-1 py-0.5 text-xl leading-tight tabular-nums tracking-[-0.01em] align-middle">
                      {formatBillNo(parcel.bill_no)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-2 border-black px-1 py-0.5 align-middle">
                      <strong>Date:</strong>
                    </td>
                    <td className="border-2 border-black px-1 py-0.5 tabular-nums align-middle">
                      {format(
                        new Date(parcel.created_at || parcel.parcel_date),
                        "dd/MM/yyyy hh:mm aa",
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-2 border-black px-1 py-0.5 align-middle">
                      <strong>Bus No:</strong>
                    </td>
                    <td className="border-2 border-black px-1 py-0.5 uppercase align-middle">
                      {parcel.bus_registration}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Sender and Receiver Details */}
              <table className="table-fixed w-full border-collapse [&_td]:break-words">
                <colgroup>
                  <col className="w-[26%]" />
                  <col />
                  <col className="w-[32%]" />
                </colgroup>
                <thead>
                  <tr className="bg-black/[0.06] print:bg-transparent">
                    <th className="text-left border-2 border-black p-1 uppercase tracking-[0.04em]">
                      Contact
                    </th>
                    <th className="text-left border-2 border-black p-1 uppercase tracking-[0.04em]">
                      Name
                    </th>
                    <th className="text-left border-2 border-black p-1 uppercase tracking-[0.04em]">
                      Mobile
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-2 border-black px-1 py-0.5">
                      <strong>Mokalnar</strong>
                    </td>
                    <td className="border-2 border-black px-1 py-0.5">
                      {parcel.sender_name}
                    </td>
                    <td className="border-2 border-black px-1 py-0.5 tabular-nums">
                      {parcel.sender_mobile_no}
                    </td>
                  </tr>
                  <tr>
                    <td className="border-2 border-black px-1 py-0.5">
                      <strong>Lenar</strong>
                    </td>
                    <td className="border-2 border-black px-1 py-0.5">
                      {parcel.receiver_name}
                    </td>
                    <td className="border-2 border-black px-1 py-0.5 tabular-nums">
                      {parcel.receiver_mobile_no}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Parcel Item Details */}
            <div className="font-bold text-sm mb-3">
              <table className="table-fixed w-full border-collapse text-center [&_td]:break-words">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[10%]" />
                  <col className="w-[28%]" />
                  <col className="w-[16%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead>
                  <tr className="bg-black/[0.06] print:bg-transparent">
                    <th className="border-2 border-black p-1 uppercase tracking-[0.04em]">
                      Description
                    </th>
                    <th className="border-2 border-black p-1 uppercase tracking-[0.04em]">
                      QTY
                    </th>
                    <th className="border-2 border-black p-1 uppercase tracking-[0.04em]">
                      Remark
                    </th>
                    <th className="border-2 border-black p-1 uppercase tracking-[0.04em]">
                      Jama Rs.
                    </th>
                    <th className="border-2 border-black p-1 uppercase tracking-[0.04em]">
                      Baki Rs.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-2 border-black p-1">
                      <div className="receipt-freetext">
                        {parcel.description}
                      </div>
                    </td>
                    <td className="border-2 border-black p-1 tabular-nums">
                      {parcel.qty}
                    </td>
                    <td className="border-2 border-black p-1">
                      <div className="receipt-freetext">{parcel.remark}</div>
                    </td>
                    <td className="border-2 border-black p-1 text-right tabular-nums">
                      {parcel.amount_given}
                    </td>
                    <td className="border-2 border-black p-1 text-right tabular-nums">
                      {amountRemaining(parcel)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Officies */}
            <div className="receipt-offices font-bold text-sm border-2 border-black p-1 flex gap-4 leading-snug [&_p]:break-words">
              <div className="basis-3/5 grow-0 shrink min-w-0">
                <p>
                  સુરત :- ઉમિયા ધામ મંદિર ની બાજુમાં, વરાછા રોડ - 90992 66443
                </p>
                <p>વાપી :- ગુંજન ચોકડી - 94294 25704</p>
                <p>વલસાડ :- ઉમા પાન, ધરમપુર ચોકડી - 96622 67267</p>
                <p>ચીખલી :- બંસી પાન, કોલેજ ચોક - 70166 17978</p>
                <p>બરોડા :- પંડ્યા બ્રીજ - 99243 22724</p>
              </div>
              <div className="basis-2/5 grow-0 shrink min-w-0 border-l-2 border-black pl-4">
                <p>ભીલાડ</p>
                <p>મુંબઈ :- બોરીવલી નેશનલ પાર્ક.</p>
                <p>પુના :- પદમાવતી પાર્કિંગ.</p>
                <p>નાથદ્વારા :- ભીલવાડા</p>
                <p>અમદાવાદ :- બાપુનગર, પાલડી</p>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="receipt-terms font-bold text-xs border-2 border-black p-1 border-t-0 leading-relaxed space-y-0.5">
              <p>
                <strong className="text-base">નોંધ:</strong> પાર્સલ ગાડીમાં
                અકસ્માત, ભીજાવું, ભાંગ-તૂટ, સળગવું વગેરે માટે કંપની ની કોઈ
                જવાબદારી રહેશે નહિ.
              </p>
              <p>
                પાર્સલ બુક કરવા સમયે લેનાર પાર્ટી ના મોબાઈલ નંબર મોકલનાર પાર્ટી
                એ ફરજીયાત ચેક કરી લેવા.
              </p>
              <p>
                સંજોગોવશાત પાર્સલ ખોવાઈ જાય તો જે પાર્સલ ફી લેવામાં આવી હશે તેજ
                પરત મળશે.
              </p>
              <p>
                તમારી વસ્તુની કિંમત અંગે કોઈ તકરાર કે કોર્ટ-કેસ ચાલશે નહીં. બીલ
                વિના માલ લેવામાં આવશે નહીં.
              </p>
              <p>
                બીલ વિના પકડાયેલ માલ માટે લેનાર પાર્ટી અને મોકલનાર પાર્ટી
                જવાબદાર રહેશે.
              </p>
              <p>
                ઉપરના નિયમો અનુસાર હું પાર્સલ મારી જવાબદારી ઉપર મોકલું છું.
                પાર્સલ બાબતે કંપની ની કોઈ જવાબદારી નથી.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Screen-only: fit the fixed-width sheet to the viewport */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media screen {
              /* Inner sizes are rem (Tailwind), so font-size cannot shrink
                 them — transform is the only thing that scales the sheet. */
              .receipt-fit {
                /* Not "overflow: hidden" — this box is deliberately shorter
                   than the sheet layout box, so that clips the receipt. */
                overflow-x: hidden;
                /* Transforms leave the layout box unscaled; reserve the height
                   or dead space trails the sheet. */
                height: calc(var(--receipt-h, 0px) * var(--receipt-scale, 1));
              }

              .receipt-fit > .receipt-sheet {
                /* Not "top center" — that pivot is off-screen whenever the
                   sheet is wider than the container, throwing it sideways.
                   translateX does the centring instead, since mx-auto cannot
                   centre a box wider than its parent. */
                transform: translateX(calc(var(--receipt-slack, 0px) / 2))
                  scale(var(--receipt-scale, 1));
                transform-origin: top left;
                margin-left: 0;
                margin-right: 0;
              }
            }
          `,
        }}
      />

      {/* Print styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }

              #print-section, #print-section * {
                visibility: visible;
              }

              @page {
                size: A4;
                margin: 0;
              }

              /* No height here: the sheet is position: fixed and sized on its
                 own, and a body forced to a full 297mm can round up into a
                 trailing blank page. */
              html, body {
                width: 210mm;
                margin: 0;
                padding: 0;
              }

              /* position: fixed so the containing block is the page, not the
                 relative SidebarInset layout wrapper (which is narrowed by the
                 visibility-hidden sidebar in print) */
              #print-section {
                position: fixed;
                left: 0;
                top: 0;
                width: 210mm;
                /* Hard cap at half of A4 — these print on pre-cut slips, so the
                   sheet must never grow onto a second page. border-box keeps the
                   10mm padding inside the 148.5mm rather than adding to it, and
                   overflow: hidden clips anything that would still exceed it. */
                box-sizing: border-box;
                height: 148.5mm;
                max-height: 148.5mm;
                overflow: hidden;
                padding: 10mm;
                margin: 0;
                font-size: 9pt;
                background-color: white !important;
                color: black !important;
                /* Keep the rules/borders solid when "background graphics" is off. */
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              /* The cap only holds if descendants inherit border-box too. */
              #print-section * {
                box-sizing: border-box;
              }

              /* Never split a table row across the cut. */
              #print-section tr,
              #print-section table {
                page-break-inside: avoid;
                break-inside: avoid;
              }

              /* Old printer: light weights come out faint and thin strokes drop
                 out entirely. Everything on the sheet prints bold and pure
                 black, and no rule is allowed thinner than 1pt. */
              #print-section,
              #print-section * {
                font-weight: 700 !important;
                color: #000 !important;
                -webkit-text-stroke: 0.01em #000;
              }

              #print-section [class*="border"] {
                border-color: #000 !important;
              }

              /* Screen leading is comfortable; at 9pt on a capped sheet it costs
                 millimetres the terms block needs. Tighten only for print so the
                 content clears the cap instead of being clipped by it. */
              #print-section .receipt-terms {
                line-height: 1.35;
              }
              #print-section .receipt-offices {
                line-height: 1.3;
              }

              /* description and remark are unbounded text columns. Because the
                 sheet is now hard-capped, an over-long entry would push the
                 terms past the cut and get them clipped — so bound the cells
                 themselves and let the overflow ellipsize instead. */
              #print-section .receipt-freetext {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
            }
          `,
        }}
      />
    </>
  );
}
