import type { Parcel } from "@/pages/PrintParcel";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getWhatsappMessage(parcel: Parcel): string {
  const billNo = `${parcel.bill_no}`;
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const currentHost = `${window.location.protocol}//${window.location.host}`;

  const message = `*(PRAMUKHRAJ) SHREE NATHJI TRAVELS & CARGO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*PARCEL BOOKING CONFIRMATION*

*Bill Number:* R-${billNo}
*Date:* ${currentDate}
*Route:* ${parcel.from_city?.name} to ${parcel.to_city?.name}

*Sender:* ${parcel.sender_name}
*Receiver:* ${parcel.receiver_name}

*View Receipt:*
${currentHost}/#/reciept/${btoa(billNo)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Thank you for choosing our service!_

*Important:* Goods will only be delivered against this bill.
*Contact:* 84019 39945 / 81550 66443`;

  return encodeURIComponent(message);
}
