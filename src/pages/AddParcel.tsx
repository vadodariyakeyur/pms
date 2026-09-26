import { useState } from "react";
import { format } from "date-fns";

import { supabase } from "@/lib/supabase/client";
import ParcelForm, {
  type ParcelFormData,
} from "@/components/custom/ParcelForm";
import router from "@/app/router";
import { useOffice } from "@/hooks/use-office";

export default function AddParcel() {
  const [isProcessing, setIsProcessing] = useState(false);
  const office = useOffice();

  const [formData, setFormData] = useState<ParcelFormData>({
    parcelDate: new Date(),
    busDriverAssignment: null,
    senderName: "",
    senderMobile: "",
    receiverName: "",
    receiverMobile: "",
    parcelItem: {
      from_city_id: null,
      to_city_id: null,
      description: "",
      qty: 1,
      remark: "",
      amount: null,
    },
    amountGiven: null,
  });

  const onSubmit = async () => {
    const {
      parcelDate,
      busDriverAssignment,
      senderName,
      senderMobile,
      receiverName,
      receiverMobile,
      parcelItem,
      amountGiven,
    } = formData;

    const totalAmount = parcelItem.amount || 0;
    const amountRemaining = (parcelItem.amount || 0) - (amountGiven || 0);

    setIsProcessing(true);
    try {
      const { data: parcel, error: parcelError } = await supabase
        .from("parcels")
        .insert({
          parcel_date: format(parcelDate, "yyyy-MM-dd"),
          driver_id: busDriverAssignment?.driver_id!,
          bus_id: busDriverAssignment?.bus_id!,
          sender_name: senderName,
          sender_mobile_no: senderMobile,
          receiver_name: receiverName,
          receiver_mobile_no: receiverMobile,
          from_city_id: parcelItem.from_city_id!,
          to_city_id: parcelItem.to_city_id!,
          description: parcelItem.description,
          qty: parcelItem.qty || 1,
          remark: parcelItem.remark,
          amount: totalAmount,
          amount_given: amountGiven || 0,
          amount_remaining: amountRemaining,
          office_id: office.id
        })
        .select()
        .single();

      if (parcelError) throw parcelError;

      router.navigate(`/parcel/${parcel.id}/print`);
    } catch (err: any) {
      console.error("Error adding parcel:", err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Parcel</h1>
        <p className="text-muted-foreground">
          Create a new parcel entry and generate bill.
        </p>
      </div>

      <ParcelForm
        {...{
          isProcessing,
          formData,
          setFormData,
          onSubmit,
          actionButton: "Save & Preview",
        }}
      />
    </div>
  );
}
