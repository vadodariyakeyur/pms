import { DBSchema } from "idb";

export interface Customer {
  mobile_no: string; // Unique key
  customer_name: string;
}

export interface PmsDB extends DBSchema {
  customers: {
    key: string; // phone
    value: Customer;
  };
  descriptions: {
    key: string;
    value: string;
  };
  remarks: {
    key: string;
    value: string;
  };
}
