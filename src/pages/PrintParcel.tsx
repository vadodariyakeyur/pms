import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Printer, ArrowLeft, MessageSquare } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Database } from "@/lib/supabase/types";
import router from "@/app/router";
import { Receipt } from "@/components/custom/Reciept";
import PageHeader from "@/components/custom/PageHeader";
import { getWhatsappMessage } from "@/lib/utils";

// Define types
export type Parcel = Database["public"]["Tables"]["parcels"]["Row"] & {
  buses?: { registration_no: string } | null;
  drivers?: { name: string } | null;
  from_city?: { name: string } | null;
  to_city?: { name: string } | null;
  offices?: { mobile_no: string | null } | null;
  bus_registration?: string;
  driver_name?: string;
  office_mobile_no?: string | null;
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
          to_city:cities!parcels_to_city_id_fkey (name),
          offices (mobile_no)
        `
        )
        .eq("bill_no", parseInt(billNo!))
        .single();

      if (error) throw error;

      setParcel({
        ...data,
        bus_registration: data.buses?.registration_no,
        driver_name: data.drivers?.name,
        office_mobile_no: data.offices?.mobile_no,
      });
    } catch (err) {
      console.error("Error fetching parcel:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSenderMessageSend = async () => {
    if (parcel?.bill_no) {
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${
        parcel.sender_mobile_no
      }&text=${getWhatsappMessage(parcel)}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const handleReceiptMessageSend = async () => {
    if (parcel?.bill_no) {
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${
        parcel.receiver_mobile_no
      }&text=${getWhatsappMessage(parcel)}`;
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
      <div className="flex items-center justify-center py-24">
        <div className="text-muted-foreground">Loading parcel details...</div>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="text-muted-foreground">Parcel not found</div>
        <Button onClick={() => router.navigate("/parcels/add")}>
          Create New Parcel
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="print:hidden">
        <PageHeader
          title="Print Preview"
          description={`Bill R${parcel.bill_no} · ${parcel.from_city?.name} to ${parcel.to_city?.name}`}
        >
          <Button variant="outline" onClick={handleBackToParcelList}>
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
          <Button variant="outline" onClick={handleSenderMessageSend}>
            <MessageSquare className="h-4 w-4" />
            Mokalnar
          </Button>
          <Button variant="outline" onClick={handleReceiptMessageSend}>
            <MessageSquare className="h-4 w-4" />
            Lenar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </PageHeader>
      </div>

      <Receipt ref={receiptRef} id="print-section" parcel={parcel} />
    </div>
  );
}
