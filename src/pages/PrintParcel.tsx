import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Printer, ArrowLeft, MessageSquare } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Database } from "@/lib/supabase/types";
import router from "@/app/router";
import { Receipt } from "@/components/custom/Reciept";
import { getWhatsappMessage } from "@/lib/utils";

// Define types
export type Parcel = Database["public"]["Tables"]["parcels"]["Row"] & {
  buses?: { registration_no: string } | null;
  drivers?: { name: string } | null;
  from_city?: { name: string } | null;
  to_city?: { name: string } | null;
  bus_registration?: string;
  driver_name?: string;
};

export default function PrintParcel() {
  const { billNo } = useParams();

  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);

  const receiptRef = useRef<HTMLDivElement>(null);

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

  const handleReceiptMessageSend = async () => {
    if (parcel?.bill_no) {
      const whatsappUrl = `https://wa.me/${
        parcel.receiver_mobile_no
      }?text=${getWhatsappMessage(parcel)}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBackToParcelList = () => {
    router.navigate("/parcels");
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
          onClick={() => router.navigate("/parcels/add")}
          className="bg-gray-700 hover:bg-gray-600"
        >
          Create New Parcel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Print Preview</h1>

        <div className="space-x-2 print:hidden">
          <Button
            variant="outline"
            onClick={handleBackToParcelList}
            className="bg-gray-800 border-gray-700 hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
          <Button
            onClick={handleReceiptMessageSend}
            className="bg-gray-700 hover:bg-gray-600"
          >
            <MessageSquare className="h-4 w-4" />
            Send Message
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-gray-700 hover:bg-gray-600"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <Receipt ref={receiptRef} id="print-section" parcel={parcel} />
    </div>
  );
}
