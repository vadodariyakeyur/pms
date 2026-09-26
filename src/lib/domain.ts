/**
 * Domain row types, derived from the generated Supabase schema.
 *
 * These used to be declared inline in whichever page needed them — 22 aliases
 * for 6 tables, including four incompatible declarations of `Parcel`. Worse,
 * `lib/utils.ts` and `components/Reciept.tsx` imported their `Parcel` from
 * `pages/PrintParcel.tsx`, so a route component was the de facto domain model.
 *
 * Everything now points here instead, and nothing in `lib/` imports from
 * `pages/`.
 */
import type { Database } from "@/lib/supabase/types";

type Tables = Database["public"]["Tables"];

export type City = Tables["cities"]["Row"];
export type Bus = Tables["buses"]["Row"];
export type Driver = Tables["drivers"]["Row"];
export type Office = Tables["offices"]["Row"];
export type ParcelRow = Tables["parcels"]["Row"];

/** An assignment with the bus/driver names resolved by the join. */
export type BusDriverAssignment = Tables["bus_driver_assignments"]["Row"] & {
  buses: { registration_no: string } | null;
  drivers: { name: string } | null;
};

/**
 * A parcel with its joined lookups.
 *
 * Every joined field is optional because the callers legitimately differ in
 * what they select: the reports query omits `drivers`, and the public receipt
 * RPC returns a flattened projection with no join objects at all. Keeping one
 * type with optional members is honest about that, where the old four separate
 * declarations forced an `as Parcel` cast to bridge them.
 *
 * `bus_registration` / `driver_name` / `office_mobile_no` / `office_address`
 * are the flattened convenience fields that PrintParcel and the public receipt
 * RPC populate.
 */
export type Parcel = ParcelRow & {
  buses?: { registration_no: string } | null;
  drivers?: { name: string } | null;
  from_city?: { name: string } | null;
  to_city?: { name: string } | null;
  offices?: { mobile_no: string | null; address: string | null } | null;
  bus_registration?: string;
  driver_name?: string;
  office_mobile_no?: string | null;
  office_address?: string | null;
};

/**
 * The public receipt view: what `get_parcel_details_by_id` can actually
 * return. The RPC projects a subset of columns for an unauthenticated viewer,
 * so this deliberately does NOT claim to be a full `ParcelRow` — the receipt
 * only renders these fields.
 */
export type PublicParcel = Pick<
  ParcelRow,
  | "bill_no"
  | "created_at"
  | "parcel_date"
  | "sender_name"
  | "sender_mobile_no"
  | "receiver_name"
  | "receiver_mobile_no"
  | "description"
  | "qty"
  | "remark"
  | "amount"
  | "amount_given"
> & {
  from_city?: { name: string } | null;
  to_city?: { name: string } | null;
  bus_registration?: string;
  office_mobile_no?: string | null;
  office_address?: string | null;
};

/** One row of the date-wise report aggregation RPC. */
export type DateWiseAggregation = {
  parcel_date: string;
  record_count: number;
  total_amount_given: number;
  total_amount_remaining: number;
  total_qty: number;
};
