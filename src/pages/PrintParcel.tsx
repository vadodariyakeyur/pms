import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Database } from "@/lib/supabase/types";

// Define types
type Parcel = Database["public"]["Tables"]["parcels"]["Row"] & {
  buses?: { registration_no: string } | null;
  drivers?: { name: string } | null;
  from_city?: { name: string } | null;
  to_city?: { name: string } | null;
  bus_registration?: string;
  driver_name?: string;
};

export default function PrintParcel() {
  const { billNo } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (billNo) {
      fetchParcelData();
    }
  }, [billNo]);

  const fetchParcelData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("parcels")
        .select(
          `
          *,
          buses (registration_no),
          drivers (name),
          from_city:cities!parcels_from_city_id_fkey (name),
          to_city:cities!parcels_to_city_id_fkey (name)
        `
        )
        .eq("bill_no", parseInt(billNo!))
        .single();

      if (error) throw error;

      setParcel({
        ...data,
        bus_registration: data.buses?.registration_no,
        driver_name: data.drivers?.name,
      });
    } catch (err) {
      console.error("Error fetching parcel:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBackToParcelList = () => {
    navigate("/parcels");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading parcel details...</div>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-white mb-4">Parcel not found</div>
        <Button
          onClick={() => navigate("/parcels/add")}
          className="bg-gray-700 hover:bg-gray-600"
        >
          Create New Parcel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Print Preview</h1>
        <div className="space-x-2 print:hidden">
          <Button
            variant="outline"
            onClick={handleBackToParcelList}
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-gray-700 hover:bg-gray-600"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div
        ref={printRef}
        id="print-section"
        className="bg-white text-black p-4 pt-6 rounded-lg"
      >
        {/* Print Header */}
        <div className="border-b-2 border-black pb-2 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold uppercase">
              SHREE PRAMUKHRAJ TRAVELS & CARGO
            </h1>
            <p className="text-sm">Address, Phone Number</p>
          </div>
        </div>

        {/* Receipt Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <table className="table-fixed w-full border-collapse">
            <tbody>
              <tr>
                <td className="border border-gray-400 px-2 py-1">
                  <strong>Bill No:</strong>
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  {parcel.bill_no}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-1">
                  <strong>Date:</strong>
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  {format(new Date(parcel.parcel_date), "dd/MM/yy hh:mm aaa")}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-1">
                  <strong>Bus No:</strong>
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  {parcel.bus_registration}
                </td>
              </tr>
            </tbody>
          </table>
          <table className="table-fixed w-full border-collapse">
            <tbody>
              <tr>
                <td className="border border-gray-400 px-2 py-1">
                  <strong>From:</strong>
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  {parcel.from_city?.name}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-1">
                  <strong>To:</strong>
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  {parcel.to_city?.name}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-1">
                  <strong>Driver:</strong>
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  {parcel.driver_name}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sender and Receiver Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <table className="table-fixed w-full border-collapse">
            <tbody>
              <tr>
                <td colSpan={2} className="border border-gray-400 px-2 py-1">
                  <strong>Sender Details</strong>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-1">
                  <strong>Name:</strong>
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  {parcel.sender_name}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-1">
                  <strong>Mobile:</strong>
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  {parcel.sender_mobile_no}
                </td>
              </tr>
            </tbody>
          </table>
          <table className="table-fixed w-full border-collapse">
            <tbody>
              <tr>
                <td colSpan={2} className="border border-gray-400 px-2 py-1">
                  <strong>Receiver Details</strong>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-1">
                  <strong>Name:</strong>
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  {parcel.receiver_name}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-1">
                  <strong>Mobile:</strong>
                </td>
                <td className="border border-gray-400 px-2 py-1">
                  {parcel.receiver_mobile_no}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Parcel Item Details */}
        <div className="mb-4">
          <h3 className="font-bold mb-2">Parcel Details</h3>
          <table className="table-fixed w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-400 p-2 text-left">
                  Description
                </th>
                <th className="border border-gray-400 p-2 text-left">
                  Quantity
                </th>
                <th className="border border-gray-400 p-2 text-left">Remark</th>
                <th className="border border-gray-400 p-2 text-right">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2">
                  {parcel.description}
                </td>
                <td className="border border-gray-400 p-2">{parcel.qty}</td>
                <td className="border border-gray-400 p-2">{parcel.remark}</td>
                <td className="border border-gray-400 p-2 text-right">
                  {parcel.amount?.toFixed(2)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={3}
                  className="border border-gray-400 p-2 text-right"
                >
                  Amount Paid:
                </td>
                <td className="border border-gray-400 p-2 text-right">
                  - {parcel.amount_given?.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={3}
                  className="border border-gray-400 p-2 text-right font-bold"
                >
                  Amount Due:
                </td>
                <td className="border border-gray-400 p-2 text-right font-bold">
                  {parcel.amount_remaining?.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terms and Conditions */}
        <div className="text-xs mb-4">
          <h4 className="font-bold mb-1">Terms & Conditions:</h4>
          <ol className="list-decimal list-inside">
            <li>
              We are not responsible for any damage during transportation.
            </li>
            <li>Parcels must be claimed within 7 days of arrival.</li>
            <li>Please keep this receipt safe for parcel collection.</li>
            <li>Any disputes must be raised within 24 hours of delivery.</li>
          </ol>
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
              }
            }
          `,
        }}
      />
    </div>
  );
}
