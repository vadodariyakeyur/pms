import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";

import { format } from "date-fns";
import ParcelForm, {
  type ParcelFormData,
} from "@/components/custom/ParcelForm";
import { Loader2 } from "lucide-react";

export default function AddParcel() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchNextBillNo();
  }, []);

  const fetchNextBillNo = async () => {
    try {
      const { data: nextBillNo, error } = await supabase.rpc(
        "get_next_bill_no"
      );

      if (error) throw error;

      setFormData((prev) => ({ ...prev, nextBillNo }));
    } catch (err: any) {
      console.error("Error fetching next bill number:", err);
    }
  };

  const onSubmit = async () => {
    const {
      nextBillNo,
      parcelDate,
      busDriverAssignment,
      senderName,
      senderMobile,
      receiverName,
      receiverMobile,
      parcelItem,
      amountGiven,
    } = formData;

    const totalAmount = parcelItem.amount;
    const amountRemaining = (parcelItem.amount || 0) - amountGiven;

    setIsProcessing(true);
    try {
      // Insert parcel
      const { data: parcel, error: parcelError } = await supabase
        .from("parcels")
        .insert({
          bill_no: nextBillNo || 1,
          parcel_date: format(parcelDate, "yyyy-MM-dd"),
          driver_id: busDriverAssignment?.driver_id!,
          bus_id: busDriverAssignment?.bus_id!,
          sender_name: senderName,
          sender_mobile_no: senderMobile,
          receiver_name: receiverName,
          receiver_mobile_no: receiverMobile,
          from_city_id: parcelItem.from_city_id,
          to_city_id: parcelItem.to_city_id,
          description: parcelItem.description,
          qty: parcelItem.qty,
          remark: parcelItem.remark,
          amount: totalAmount,
          amount_given: amountGiven,
          amount_remaining: amountRemaining,
        })
        .select()
        .single();

      if (parcelError) throw parcelError;

      // Navigate to print preview with parcel data
      navigate(`/parcel/${parcel.bill_no}/print`);
    } catch (err: any) {
      console.error("Error adding parcel:", err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const [formData, setFormData] = useState<ParcelFormData>({
    nextBillNo: -1,
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
      amount: undefined,
    },
    amountGiven: 0,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Parcel</h1>
        <p className="text-gray-400">
          Create a new parcel entry and generate bill.
        </p>
      </div>

      {formData.nextBillNo === -1 ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ParcelForm
          {...{
            isProcessing,
            formData,
            setFormData,
            onSubmit,
            actionButton: "Save & Preview",
          }}
        />
      )}
    </div>
  );
}
