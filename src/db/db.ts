import { IDBPDatabase, openDB } from "idb";
import type { Customer, PmsDB } from "@/db/db.types";

let dbPromise: Promise<IDBPDatabase<PmsDB>>;

export const getDb = () => {
  if (dbPromise) return dbPromise;

  dbPromise = openDB<PmsDB>("pms-db", 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("customers")) {
        db.createObjectStore("customers", { keyPath: "mobile_no" });
      }
      if (!db.objectStoreNames.contains("descriptions")) {
        db.createObjectStore("descriptions");
      }
      if (!db.objectStoreNames.contains("remarks")) {
        db.createObjectStore("remarks");
      }
    },
  });

  return dbPromise;
};

async function exportDB() {
  const db = await openDB("pms-db");
  const exportData: Record<string, unknown> = {};
  for (const storeName of db.objectStoreNames) {
    exportData[storeName] = [];

    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const allData = await store.getAll();

    exportData[storeName] = allData;

    await tx.done;
  }

  // Download JSON as file
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pms-idb-data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
    .filter((customer) => customer.mobile_no.startsWith(partialMobile))
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

export async function addDescription(description: string) {
  const db = await getDb();
  await db.put("descriptions", description, description);
}

export async function getAllDescriptions() {
  const db = await getDb();
  return db.getAll("descriptions");
}

export async function searchDescriptions(partialDescription: string) {
  const lowerPartialDescription = partialDescription.toLowerCase();
  const description_list = await getAllDescriptions();
  return description_list.filter((desc) =>
    desc.toLowerCase().startsWith(lowerPartialDescription)
  );
}

export async function getAllRemark() {
  const db = await getDb();
  return db.getAll("remarks");
}

export async function addRemark(remark: string) {
  const db = await getDb();
  await db.put("remarks", remark, remark);
}

export async function searchRemarks(partialRemarks: string) {
  const lowerPartialRemark = partialRemarks.toLowerCase();
  const remark_list = await getAllRemark();
  return remark_list.filter((remark) =>
    remark.toLowerCase().startsWith(lowerPartialRemark)
  );
}

export default {
  exportDB,
  addOrUpdateCustomer,
  getAllCustomers,
  getCustomerNameByMobileNo,
  searchMobileNos,
  searchCustomerNames,
  getAllDescriptions,
  addDescription,
  searchDescriptions,
  getAllRemark,
  addRemark,
  searchRemarks,
};
