import { DBSchema } from "idb";

export interface Customer {
  phone: string; // Unique key
  name: string;
}

export interface PmsDB extends DBSchema {
  customers: {
    key: string; // phone
    value: Customer;
  };
}
