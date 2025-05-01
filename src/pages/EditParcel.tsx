import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";

import { format } from "date-fns";
import ParcelForm, {
  type BusDriverAssignment,
  type ParcelFormData,
} from "@/components/custom/ParcelForm";
import { Loader2 } from "lucide-react";

export default function EditParcel() {
  const { billNo } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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
        .select("*")
        .eq("bill_no", parseInt(billNo!))
        .single();

      if (error) throw error;

      let busDriverAssignment;
      if (data.bus_id && data.driver_id) {
        const result = await supabase
          .from("bus_driver_assignments")
          .select("*")
          .eq("bus_id", data.bus_id!)
          .eq("driver_id", data.driver_id!)
          .maybeSingle();
        busDriverAssignment = result.data;
      }

      setFormData({
        nextBillNo: data.bill_no,
        parcelDate: new Date(data.parcel_date),
        busDriverAssignment: busDriverAssignment as BusDriverAssignment,
        senderName: data.sender_name,
        senderMobile: data.sender_mobile_no,
        receiverName: data.receiver_name,
        receiverMobile: data.receiver_mobile_no,
        parcelItem: {
          from_city_id: data.from_city_id,
          to_city_id: data.to_city_id,
          description: data.description || "",
          qty: data.qty || 0,
          remark: data.remark || "",
          amount: data.amount || 0,
        },
        amountGiven: data.amount_given || 0,
      });
    } catch (err) {
      console.error("Error fetching parcel:", err);
    } finally {
      setLoading(false);
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
      const { error: parcelError } = await supabase
        .from("parcels")
        .update({
          bill_no: nextBillNo,
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
        .eq("bill_no", nextBillNo);

      if (parcelError) throw parcelError;

      // Navigate to print preview with parcel data
      navigate(`/parcel/${nextBillNo}/print`);
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
        <h1 className="text-2xl font-bold tracking-tight">Edit Parcel</h1>
        <p className="text-gray-400">Edit parcel entry and generate bill.</p>
      </div>

      {loading ? (
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
