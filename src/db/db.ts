import { openDB } from "idb";
import type { Customer, PmsDB } from "@/db/db.types";

export const getDb = () =>
  openDB<PmsDB>("pms-db", 1, {
    upgrade(db) {
      db.createObjectStore("customers", { keyPath: "mobile_no" });
    },
  });

// Add or update customer
export async function addOrUpdateCustomer(
  customer_name: Customer["customer_name"],
  mobile_no: Customer["mobile_no"]
) {
  const db = await getDb();
  await db.put("customers", {
    customer_name,
    mobile_no,
  });
}

// Get customer by phone
export async function getCustomerNameByMobileNo(phone: string) {
  const db = await getDb();
  return db.get("customers", phone);
}

// Get customer by phone
export async function getAllCustomers() {
  const db = await getDb();
  return db.getAll("customers");
}

export async function searchMobileNos(partialMobile: string) {
  const allCustomers = await getAllCustomers();
  return allCustomers
    .filter((customer) => customer.mobile_no.includes(partialMobile))
    .map((cus) => cus.mobile_no);
}

export async function searchCustomerNames(partialName: string) {
  const allCustomers = await getAllCustomers();
  const lowerPartial = partialName.toLowerCase();
  return allCustomers
    .filter((customer) =>
      customer.customer_name.toLowerCase().includes(lowerPartial)
    )
    .map((cus) => cus.customer_name);
}

export default {
  addOrUpdateCustomer,
  getAllCustomers,
  getCustomerNameByMobileNo,
  searchMobileNos,
  searchCustomerNames,
};
