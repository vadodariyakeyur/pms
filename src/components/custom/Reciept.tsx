import { Parcel } from "@/pages/PrintParcel";
import { format } from "date-fns";
import { ComponentPropsWithRef } from "react";

type ReceiptProps = ComponentPropsWithRef<"div"> & {
  parcel: Parcel;
};

export function Receipt({ parcel, ...rest }: ReceiptProps) {
  return (
    <>
      <div className="mx-auto w-[210mm]">
        <div className="bg-white text-black p-4 rounded mx-auto" {...rest}>
          {/* Print Header */}
          <div className="border-b-2 border-black pb-2 mb-3">
            <div className="relative text-center">
              <h1 className="text-[26px] font-bold uppercase">
                (PRAMUKHRAJ) SHREE NATHJI TRAVELS & CARGO
              </h1>
              <p className="text-sm font-medium">
                રાજકોટ :- 150 ફુટ રિંગ રોડ, ગોવર્ધન ચોક ની પાસે, સ્કાય હેઈટ્સ
                બિલ્ડીંગ ની સામે, મો. - <b className="text-base">84019 39945 / 81550 66443</b>
              </p>
            </div>
          </div>

          {/* Cities */}
          <div className="text-xl font-bold mb-3 text-center">
            {parcel.from_city?.name} to {parcel.to_city?.name}
          </div>

          {/* Receipt Details */}
          <div className="font-bold grid grid-cols-2 gap-2 mb-3 text-sm">
            <table className="table-fixed w-full border-collapse">
              <tbody>
                <tr>
                  <td className="border-2 border-black px-1 py-0.5">
                    <strong>Bill No:</strong>
                  </td>
                  <td className="border-2 border-black px-1 py-0.5 text-xl">
                    R{parcel.bill_no}
                  </td>
                </tr>
                <tr>
                  <td className="border-2 border-black px-1 py-0.5">
                    <strong>Date:</strong>
                  </td>
                  <td className="border-2 border-black px-1 py-0.5">
                    {format(
                      new Date(parcel.created_at || parcel.parcel_date),
                      "dd/MM/yyyy hh:mm aa"
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border-2 border-black px-1 py-0.5">
                    <strong>Bus No:</strong>
                  </td>
                  <td className="border-2 border-black px-1 py-0.5">
                    {parcel.bus_registration}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Sender and Receiver Details */}
            <table className="table-fixed w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left border-2 border-black p-1">
                    Contact
                  </th>
                  <th className="text-left border-2 border-black p-1">Name</th>
                  <th className="text-left border-2 border-black p-1">
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
                  <td className="border-2 border-black px-1 py-0.5">
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
                  <td className="border-2 border-black px-1 py-0.5">
                    {parcel.receiver_mobile_no}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Parcel Item Details */}
          <div className="font-bold text-sm mb-3">
            <table className="table-fixed w-full border-collapse text-center">
              <thead>
                <tr>
                  <th className="border-2 border-black p-1">Description</th>
                  <th className="border-2 border-black p-1">Quantity</th>
                  <th className="border-2 border-black p-1">Remark</th>
                  <th className="border-2 border-black p-1">Jama Rs.</th>
                  <th className="border-2 border-black p-1">Baki Rs.</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-2 border-black p-1">
                    {parcel.description}
                  </td>
                  <td className="border-2 border-black p-1">{parcel.qty}</td>
                  <td className="border-2 border-black p-1">{parcel.remark}</td>
                  <td className="border-2 border-black p-1">
                    {parcel.amount_given}
                  </td>
                  <td className="border-2 border-black p-1">
                    {parcel.amount - parcel.amount_given}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Officies */}
          <div className="font-bold text-sm border-2 border-black p-1 flex gap-4">
            <div className="flex-3/5">
              <p>
                સુરત :- ઉમિયા ધામ મંદિર ની બાજુમાં, વરાછા રોડ, સુરત - 90992
                66443
              </p>
              <p>વાપી :- ગુંજન ચોકડી, વાપી - 94294 25704</p>
              <p>વલસાડ/ધરમપુર :- ઉમા પાન, ધરમપુર ચોકડી, વલસાડ - 96622 67267</p>
              <p>ચીખલી :- બંસી પાન, કોલેજ ચોક, ચીખલી - 70166 17978</p>
            </div>
            <div className="flex-2/5 border-l-2 border-black pl-4">
              <p>ભીલાડ</p>
              <p>મુંબઈ :- બોરીવલી નેશનલ પાર્ક.</p>
              <p>પુના :- પદમાવતી પાર્કિંગ.</p>
              <p>નાથદ્વારા :- ભીલવાડા</p>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="font-bold text-xs border-2 border-black p-1 border-t-0">
            <p>
              <strong className="text-base">નોંધ:</strong> પાર્સલ ગાડીમાં
              અકસ્માત, ભીજાવું, ભાંગ-તૂટ, સળગવું વગેરે માટે કંપની ની કોઈ
              જવાબદારી રહેશે નહિ.
            </p>
            <p>
              પાર્સલ બુક કરવા સમયે લેનાર પાર્ટી ના મોબાઈલ નંબર મોકલનાર પાર્ટી એ
              ફરજીયાત ચેક કરી લેવા.
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
              બીલ વિના પકડાયેલ માલ માટે લેનાર પાર્ટી અને મોકલનાર પાર્ટી જવાબદાર
              રહેશે.
            </p>
            <p>
              ઉપરના નિયમો અનુસાર હું પાર્સલ મારી જવાબદારી ઉપર મોકલું છું. પાર્સલ
              બાબતે કંપની ની કોઈ જવાબદારી નથી.
            </p>
          </div>
        </div>
      </div>

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
              
              #print-section {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background-color: white !important;
                color: black !important;
                max-width: 100% !important;
              }
              
              @page {
                size: A4;
                margin: 0;
              }
              
              html, body {
                width: 210mm;
                height: 297mm;
              }
              
              #print-section {
                height: 148.5mm; /* Half of A4 height */
                padding: 10mm;
                margin: 0;
                page-break-after: always;
                font-size: 9pt;
              }
            }
          `,
        }}
      />
    </>
  );
}
