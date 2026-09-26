import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Printer, ArrowLeft, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Parcel } from "@/lib/domain";
import { findById } from "@/lib/parcels";
import { formatBillNo } from "@/lib/bill";
import router from "@/app/router";
import { Receipt } from "@/components/custom/Reciept";
import PageHeader from "@/components/custom/PageHeader";
import { getWhatsappMessage } from "@/lib/utils";

export default function PrintParcel() {
  const { id } = useParams();

  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchParcelData();
    }
  }, [id]);

  const fetchParcelData = async () => {
    setLoading(true);
    try {
      setParcel(await findById(parseInt(id!), { withOffice: true }));
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
          description={`Bill ${formatBillNo(parcel.bill_no)} · ${parcel.from_city?.name} to ${parcel.to_city?.name}`}
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
