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

export default {
  addOrUpdateCustomer,
  getAllCustomers,
  getCustomerNameByMobileNo,
};
