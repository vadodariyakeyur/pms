import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import {
  COMPANY_NAME,
  FALLBACK_CONTACTS,
  contactLine,
  formatBillNo,
  receiptUrl,
} from "@/lib/bill";
import type { Parcel } from "@/lib/domain";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getWhatsappMessage(parcel: Parcel): string {
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const currentHost = `${window.location.protocol}//${window.location.host}`;

  // Bill number goes through formatBillNo so it matches what the search box
  // parses — this used to render "R-123", which the parser rejected.
  const message = `*${COMPANY_NAME}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*PARCEL BOOKING CONFIRMATION*

*Bill Number:* ${formatBillNo(parcel.bill_no)}
*Date:* ${currentDate}
*Route:* ${parcel.from_city?.name} to ${parcel.to_city?.name}

*Sender:* ${parcel.sender_name}
*Receiver:* ${parcel.receiver_name}

*View Receipt:*
${receiptUrl(parcel.id, currentHost)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Thank you for choosing *PRAMUKHRAJ TRAVELS & CARGO* service!_

*Important:* Goods will only be delivered against this bill.
*Contact(Rajkot):* ${contactLine(parcel.office_mobile_no)}
*Contact(Surat):* ${FALLBACK_CONTACTS.surat}
`;

  return encodeURIComponent(message);
}
