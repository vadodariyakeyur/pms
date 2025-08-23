import { useEffect, useMemo, useRef, useState } from "react";
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

// Security: Watermark overlay style
const watermarkStyle = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none" as const,
  zIndex: 1000,
  opacity: 0.1,
  fontSize: "12px",
  color: "#000",
  background: `repeating-linear-gradient(
      45deg,
      transparent 0px,
      transparent 50px,
      rgba(0,0,0,0.02) 50px,
      rgba(0,0,0,0.02) 100px
    )`,
  overflow: "hidden",
};

export default function ViewReciept() {
  const { billNo } = useParams();

  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);

  const watermarkText = useMemo(() => {
    const timestamp = new Date().toISOString();
    const userAgent = navigator.userAgent.substring(0, 50);
    return `Secure Receipt [PRAMUKHRAJ TRAVELS & CARGO] - ${timestamp} - ${userAgent}`;
  }, []);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Security: Content Protection Hook
  useEffect(() => {
    // Disable right-click, keyboard shortcuts, text selection, and drag
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      console.log("Security Alert: Right-click attempt detected");
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block developer tools and common shortcuts
      if (
        e.key === "F12" || // Developer Tools
        e.key === "PrintScreen" || // Screenshot
        (e.ctrlKey &&
          e.shiftKey &&
          ["I", "J", "C"].includes(e.key.toUpperCase())) || // Dev tools
        (e.ctrlKey &&
          ["U", "S", "A", "C", "V", "X", "P"].includes(e.key.toUpperCase())) || // View source, save, select all, copy, paste, cut, print
        (e.metaKey &&
          ["U", "S", "A", "C", "V", "X", "P"].includes(e.key.toUpperCase())) // Mac equivalents
      ) {
        e.preventDefault();
        e.stopPropagation();
        console.log(`Security Alert: Blocked key combination: ${e.key}`);
        return false;
      }
    };

    const handleSelectStart = (e: Event) => e.preventDefault();
    const handleDragStart = (e: DragEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handlePaste = (e: ClipboardEvent) => e.preventDefault();
    const handleCut = (e: ClipboardEvent) => e.preventDefault();

    // Add all event listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
    };
  }, []);

  // Security: Prevent Screenshots on Mobile
  useEffect(() => {
    // Add viewport meta tag to prevent zooming (which can help with screenshots)
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      );
    }

    // Disable long press on mobile
    document.body.style.setProperty("-webkit-touch-callout", "none");
    document.body.style.setProperty("-khtml-user-select", "none");
    document.body.style.setProperty("-moz-user-select", "none");
    document.body.style.setProperty("-ms-user-select", "none");
    document.body.style.setProperty("user-select", "none");
  }, []);

  useEffect(() => {
    if (billNo) {
      fetchParcelData();
    }
  }, [billNo]);

  const fetchParcelData = async () => {
    if (!billNo) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_parcel_details_by_bill_no", {
          bill_number: parseInt(atob(billNo)!),
        })
        .single();

      if (error) {
        console.error("Access denied:", error);
        alert("Receipt not found or access denied.");
        return;
      }

      setParcel({
        from_city: {
          name: data.from_city_name,
        },
        to_city: {
          name: data.to_city_name,
        },
        bill_no: data.bill_no,
        created_at: data.created_at.toString(),
        parcel_date: data.parcel_date.toString(),
        bus_registration: data.bus_registration,
        sender_name: data.sender_name,
        sender_mobile_no: data.sender_mobile_no,
        receiver_name: data.receiver_name,
        receiver_mobile_no: data.receiver_mobile_no,
        description: data.description,
        qty: data.qty,
        remark: data.remark,
        amount: data.amount,
        amount_given: data.amount_given,
      } as Parcel);
    } catch (err) {
      console.error("Error fetching parcel:", err);
      alert("Failed to load receipt. Please try again.");
      window.close();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading Receipt...</div>
      </div>
    );
  }

  return (
    <>
      {/* Security: Watermark Overlay */}
      <div style={watermarkStyle}>
        <div
          style={{
            position: "absolute",
            top: "25%",
            left: "25%",
            transform: "rotate(-45deg)",
            whiteSpace: "nowrap",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {watermarkText}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "20%",
            transform: "rotate(-45deg)",
            whiteSpace: "nowrap",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          SECURE DOCUMENT
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6 h-full pt-10">
        <div className="flex justify-center items-center">
          <h1 className="text-2xl font-bold tracking-tight">Booking Receipt</h1>
        </div>
        {parcel ? (
          <Receipt ref={receiptRef} id="print-section" parcel={parcel} />
        ) : (
          <div className="flex justify-center items-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Receipt Not Found
            </h1>
          </div>
        )}
      </div>

      {/* Security: CSS Styles */}
      <style>{`
        @media print {
          body,
          * {
            display: none !important;
          }
          body::after {
            content: "Printing is not allowed for this secure document.";
            display: block !important;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            color: red;
            text-align: center;
          }
        }

        /* Disable text selection on all elements */
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }

        /* Hide scrollbars to prevent screenshot indicators */
        ::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
      `}</style>
    </>
  );
}
