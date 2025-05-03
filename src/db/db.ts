import { openDB } from "idb";
import type { Customer, PmsDB } from "@/db/db.types";

export const getDb = () =>
  openDB<PmsDB>("pms-db", 1, {
    upgrade(db) {
      db.createObjectStore("customers", { keyPath: "phone" });
    },
  });

// Add or update customer
export async function addOrUpdateCustomer(customer: Customer) {
  const db = await getDb();
  await db.put("customers", customer);
}

// Get customer by phone
export async function getCustomerNameByPhone(phone: string) {
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
  getCustomerNameByPhone,
};
