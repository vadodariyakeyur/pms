import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";

import { format } from "date-fns";
import ParcelForm, {
  type ParcelFormData,
} from "@/components/custom/ParcelForm";
import type { BusDriverAssignment } from "@/lib/domain";
import { findById, updateById } from "@/lib/parcels";
import { Loader2 } from "lucide-react";
import router from "@/app/router";
import { amountColumns } from "@/lib/parcel-money";

export default function EditParcel() {
  const { id } = useParams();

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
      qty: null,
      remark: "",
      amount: null,
    },
    amountGiven: null,
  });

  useEffect(() => {
    if (id) {
      fetchParcelData();
    }
  }, [id]);

  const fetchParcelData = async () => {
    setLoading(true);
    try {
      const data = await findById(parseInt(id!));

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
      parcelDate,
      busDriverAssignment,
      senderName,
      senderMobile,
      receiverName,
      receiverMobile,
      parcelItem,
      amountGiven,
    } = formData;

    setIsProcessing(true);
    try {
      await updateById(parseInt(id!), {
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
          ...amountColumns({
            amount: parcelItem.amount,
            amount_given: amountGiven,
          }),
      });

      // Navigate to print preview with parcel data
      router.navigate(`/parcel/${id}/print`);
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
        <p className="text-muted-foreground">Edit parcel entry and generate bill.</p>
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
