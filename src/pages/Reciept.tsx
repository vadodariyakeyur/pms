import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { supabase } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";
import { Receipt } from "@/components/custom/Reciept";

// Define types
export type Parcel = Database["public"]["Tables"]["parcels"]["Row"] & {
  buses?: { registration_no: string } | null;
  drivers?: { name: string } | null;
  from_city?: { name: string } | null;
  to_city?: { name: string } | null;
  bus_registration?: string;
  driver_name?: string;
};

export default function ParcelReciept() {
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
    if (!billNo) return;

    const receiver_no = prompt("Please enter receiver's mobile no.");
    if (!receiver_no) return;

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
        .eq("bill_no", parseInt(atob(billNo)!))
        .eq("receiver_mobile_no", receiver_no)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading Reciept...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full pt-10">
      <div className="flex justify-center items-center">
        <h1 className="text-2xl font-bold tracking-tight">Booking Reciept</h1>
      </div>
      {parcel ? (
        <Receipt ref={receiptRef} id="print-section" parcel={parcel} />
      ) : (
        <div className="flex justify-center items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Reciept Not Found
          </h1>
        </div>
      )}
    </div>
  );
}
