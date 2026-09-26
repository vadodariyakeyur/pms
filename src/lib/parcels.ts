/**
 * Every parcel read and write goes through here.
 *
 * Before this module, seven pages each built their own PostgREST query. The
 * FK-alias join string was hand-typed in five places (a typo in any one is a
 * runtime-only failure, since it is a string), one parcel could be loaded three
 * different ways returning three different row shapes, and ListParcels wrote
 * its filter block out twice — once for the count, once for the data — with a
 * comment admitting "apply the SAME filters". The two copies had already
 * drifted: ordering and pagination were applied to only one branch.
 *
 * The seam is the exported functions. Callers describe *what* they want
 * (an id, a filter) and never see PostgREST.
 */
import { supabase } from "@/lib/supabase/client";
import type { Parcel } from "@/lib/domain";
import type { Database } from "@/lib/supabase/types";

/**
 * The joined lookups every parcel view needs. Typed once, here, because
 * PostgREST select strings are opaque to the compiler.
 */
const PARCEL_SELECT = `
  *,
  buses (registration_no),
  drivers (name),
  from_city:cities!parcels_from_city_id_fkey (name),
  to_city:cities!parcels_to_city_id_fkey (name)
` as const;

/** As above, plus the office contact and address shown on a printed receipt. */
const PARCEL_SELECT_WITH_OFFICE = `
  *,
  buses (registration_no),
  drivers (name),
  from_city:cities!parcels_from_city_id_fkey (name),
  to_city:cities!parcels_to_city_id_fkey (name),
  offices (mobile_no, address)
` as const;

/** How a caller narrows a parcel list. Every field is optional. */
export type ParcelFilter = {
  officeId: number;
  /** Free text matched against sender/receiver name and mobile. */
  searchTerm?: string;
  fromCityId?: string | number | null;
  toCityId?: string | number | null;
  /** Inclusive `yyyy-MM-dd` bounds. Both must be present to apply. */
  startDate?: string | null;
  endDate?: string | null;
};

/**
 * Strips the display prefix off a bill number.
 *
 * The `R` prefix is presentation, not identity — see `formatBillNo` in
 * `bill.ts`. Accepts the hyphenated `R-123` form too, because that is what
 * the WhatsApp receipt message emits and customers paste it back verbatim.
 */
export function parseBillNo(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/^[Rr]-?/, "");
  if (!/^\d+$/.test(digits)) return null;
  return parseInt(digits, 10);
}

/**
 * Applies a filter to a query builder.
 *
 * Deliberately generic over the builder type so the identical filter chain
 * runs against both the count query and the data query — the drift that caused
 * the pagination bug is now unrepresentable.
 */
function applyFilter<T>(query: T, filter: ParcelFilter): T {
  let q = query as any;
  q = q.eq("office_id", filter.officeId);

  if (filter.searchTerm) {
    const t = filter.searchTerm;
    q = q.or(
      `sender_name.ilike.%${t}%,receiver_name.ilike.%${t}%,sender_mobile_no.ilike.%${t}%,receiver_mobile_no.ilike.%${t}%`
    );
  }
  if (filter.fromCityId) q = q.eq("from_city_id", filter.fromCityId);
  if (filter.toCityId) q = q.eq("to_city_id", filter.toCityId);
  if (filter.startDate && filter.endDate) {
    q = q.gte("parcel_date", filter.startDate).lte("parcel_date", filter.endDate);
  }
  return q as T;
}

/** Flattens the joined lookups that the receipt renders directly. */
function flatten(row: Parcel): Parcel {
  return {
    ...row,
    bus_registration: row.buses?.registration_no,
    driver_name: row.drivers?.name,
    office_mobile_no: row.offices?.mobile_no,
    office_address: row.offices?.address,
  };
}

/**
 * One parcel by id, with joins. Used by the print and edit views.
 *
 * Lookups go by id, not bill number: bill numbers are display-only and can
 * repeat after `reset_bill_no`.
 *
 * The two selects are separate calls rather than a ternary: supabase-js parses
 * the select string at the *type* level, and it can only do that for a literal.
 */
export async function findById(
  id: number,
  opts: { withOffice?: boolean } = {}
): Promise<Parcel> {
  const query = opts.withOffice
    ? supabase.from("parcels").select(PARCEL_SELECT_WITH_OFFICE)
    : supabase.from("parcels").select(PARCEL_SELECT);

  const { data, error } = await query.eq("id", id).single();
  if (error) throw error;

  return flatten(data as Parcel);
}

export type ParcelPage = {
  parcels: Parcel[];
  /** Total matching rows, before pagination. */
  total: number;
};

/**
 * A page of parcels.
 *
 * When `billNo` is given it identifies a single parcel, so the other filters
 * and pagination do not apply — but ordering always does, which is the bug the
 * old two-block version had.
 */
export async function findPage(args: {
  filter: ParcelFilter;
  billNo?: number | null;
  page: number;
  pageSize: number;
}): Promise<ParcelPage> {
  const { filter, billNo, page, pageSize } = args;

  const countBase = supabase
    .from("parcels")
    .select("*", { count: "exact", head: true });
  const dataBase = supabase.from("parcels").select(PARCEL_SELECT);

  // Both queries get the identical narrowing — one code path, applied twice.
  const countQuery = billNo
    ? countBase.eq("office_id", filter.officeId).eq("bill_no", billNo)
    : applyFilter(countBase, filter);

  let dataQuery = billNo
    ? dataBase.eq("office_id", filter.officeId).eq("bill_no", billNo)
    : applyFilter(dataBase, filter);

  dataQuery = dataQuery
    .order("parcel_date", { ascending: false })
    .order("bill_no", { ascending: false });

  // A bill-number lookup returns at most one row, so paging it is meaningless.
  if (!billNo) {
    dataQuery = dataQuery.range((page - 1) * pageSize, page * pageSize - 1);
  }

  const [{ count, error: countError }, { data, error: dataError }] =
    await Promise.all([countQuery, dataQuery]);

  if (countError) throw countError;
  if (dataError) throw dataError;

  return { parcels: (data as Parcel[]) || [], total: count ?? 0 };
}

/** Parcels for a report, ordered oldest-first the way the print layout expects. */
export async function findForReport(args: {
  officeId: number;
  busId: number;
  fromCityId: number;
  toCityId: number;
  /** A single day, or a start/end pair. */
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Parcel[]> {
  let query = supabase
    .from("parcels")
    .select(PARCEL_SELECT)
    .eq("office_id", args.officeId)
    .eq("bus_id", args.busId)
    .eq("from_city_id", args.fromCityId)
    .eq("to_city_id", args.toCityId)
    .order("created_at", { ascending: true });

  if (args.date) {
    query = query.eq("parcel_date", args.date);
  } else if (args.startDate && args.endDate) {
    query = query.gte("parcel_date", args.startDate).lte("parcel_date", args.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Parcel[]) || [];
}

/** Deletes a parcel by primary key. */
export async function remove(id: number): Promise<void> {
  const { error } = await supabase.from("parcels").delete().eq("id", id);
  if (error) throw error;
}

/** The fields required to create a parcel row. */
export type ParcelWrite = Database["public"]["Tables"]["parcels"]["Insert"];

/**
 * Creates a parcel and returns the created row. `bill_no` is left to the
 * database default (`bill_no_seq`), so it is allocated server-side.
 */
export async function create(values: ParcelWrite): Promise<Parcel> {
  const { data, error } = await supabase
    .from("parcels")
    .insert(values)
    .select()
    .single();

  if (error) throw error;
  return data as Parcel;
}

/** Updates the parcel identified by `id`. */
export async function updateById(
  id: number,
  values: Database["public"]["Tables"]["parcels"]["Update"]
): Promise<void> {
  const { error } = await supabase
    .from("parcels")
    .update(values)
    .eq("id", id);

  if (error) throw error;
}

/** One row of the dashboard's per-office analytics projection. */
export type DashboardRow = {
  parcel_date: string;
  amount: number;
  amount_given: number;
  qty: number;
  to_city?: { name: string } | null;
};

/** One row of the cross-office revenue projection. */
export type OfficeRevenueRow = {
  parcel_date: string;
  amount: number;
  offices?: { name: string } | null;
  to_city?: { name: string } | null;
};

/**
 * The two projections the dashboard charts need, in one round trip.
 *
 * These select narrow column lists rather than the full joined row — the
 * dashboard aggregates thousands of rows and does not need the rest.
 */
export async function findForDashboard(args: {
  officeId: number;
  startDate: string;
  endDate: string;
}): Promise<{ officeRows: DashboardRow[]; allOfficeRows: OfficeRevenueRow[] }> {
  const [{ data, error }, { data: allOfficeRows, error: officeError }] =
    await Promise.all([
      supabase
        .from("parcels")
        .select(
          "parcel_date, amount, amount_given, qty, to_city:cities!parcels_to_city_id_fkey(name)"
        )
        .eq("office_id", args.officeId)
        .gte("parcel_date", args.startDate)
        .lte("parcel_date", args.endDate),
      // Every office, so revenue can be compared day by day and split by
      // destination city.
      supabase
        .from("parcels")
        .select(
          "parcel_date, amount, offices(name), to_city:cities!parcels_to_city_id_fkey(name)"
        )
        .gte("parcel_date", args.startDate)
        .lte("parcel_date", args.endDate),
    ]);

  if (error) throw error;
  if (officeError) throw officeError;

  return {
    officeRows: (data as DashboardRow[]) || [],
    allOfficeRows: (allOfficeRows as OfficeRevenueRow[]) || [],
  };
}
