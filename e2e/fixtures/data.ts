/**
 * The seed dataset every e2e test starts from.
 *
 * Deliberately small and hand-written: each row exists because some assertion
 * depends on it. Keep it that way — a fixture nobody can hold in their head
 * stops being useful as a test oracle.
 */

export type Row = Record<string, any>;

export const OFFICE_A = { id: 1, name: "Rajkot Office", mobile_no: "9876500001", address: null };
export const OFFICE_B = { id: 2, name: "Surat Office", mobile_no: null, address: null };

export const CITY_RAJKOT = {
  id: 1,
  name: "Rajkot",
  is_default_from: true,
  is_default_to: false,
};
export const CITY_SURAT = {
  id: 2,
  name: "Surat",
  is_default_from: false,
  is_default_to: true,
};
export const CITY_BARODA = {
  id: 3,
  name: "Baroda",
  is_default_from: false,
  is_default_to: false,
};

export const BUS_1 = { id: 1, registration_no: "GJ-03-AB-1234" };
export const BUS_2 = { id: 2, registration_no: "GJ-05-CD-5678" };

export const DRIVER_1 = { id: 1, name: "Ramesh Patel" };
export const DRIVER_2 = { id: 2, name: "Suresh Shah" };

export const ASSIGNMENT_1 = {
  id: 1,
  bus_id: 1,
  driver_id: 1,
  assignment_date: today(),
};

/** `yyyy-MM-dd` for today, in local time — matching what the app sends. */
export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * A parcel row shaped exactly as PostgREST returns it for `PARCEL_SELECT`:
 * embedded resources are nested objects, not flattened columns.
 */
export function parcel(over: Partial<Row> = {}): Row {
  const base = {
    id: 1,
    bill_no: 101,
    parcel_date: today(),
    office_id: 1,
    bus_id: 1,
    driver_id: 1,
    from_city_id: 1,
    to_city_id: 2,
    sender_name: "Anil Mehta",
    sender_mobile_no: "9000000001",
    receiver_name: "Bhavna Joshi",
    receiver_mobile_no: "9000000002",
    description: "Documents",
    qty: 1,
    remark: "",
    amount: 500,
    amount_given: 500,
    amount_remaining: 0,
    created_at: `${today()}T09:00:00.000Z`,
  };
  return withEmbeds({ ...base, ...over });
}

/** Attaches the joined lookups the parcel select string asks for. */
export function withEmbeds(row: Row): Row {
  const cities = [CITY_RAJKOT, CITY_SURAT, CITY_BARODA];
  const buses = [BUS_1, BUS_2];
  const drivers = [DRIVER_1, DRIVER_2];
  const offices = [OFFICE_A, OFFICE_B];

  const bus = buses.find((b) => b.id === row.bus_id);
  const driver = drivers.find((d) => d.id === row.driver_id);
  const office = offices.find((o) => o.id === row.office_id);

  return {
    ...row,
    buses: bus ? { registration_no: bus.registration_no } : null,
    drivers: driver ? { name: driver.name } : null,
    offices: office ? { mobile_no: office.mobile_no, address: office.address } : null,
    from_city: cities.find((c) => c.id === row.from_city_id) ?? null,
    to_city: cities.find((c) => c.id === row.to_city_id) ?? null,
  };
}

/** A fresh, mutable copy of the whole dataset. One per test — never shared. */
export function seed() {
  return {
    offices: [{ ...OFFICE_A }, { ...OFFICE_B }],
    cities: [{ ...CITY_RAJKOT }, { ...CITY_SURAT }, { ...CITY_BARODA }],
    buses: [{ ...BUS_1 }, { ...BUS_2 }],
    drivers: [{ ...DRIVER_1 }, { ...DRIVER_2 }],
    bus_driver_assignments: [{ ...ASSIGNMENT_1 }],
    parcels: [
      parcel(),
      parcel({
        id: 2,
        bill_no: 102,
        sender_name: "Chirag Desai",
        sender_mobile_no: "9000000003",
        receiver_name: "Dipika Rana",
        receiver_mobile_no: "9000000004",
        // Partly paid, so the list renders it as unpaid.
        amount: 800,
        amount_given: 300,
        amount_remaining: 500,
        from_city_id: 2,
        to_city_id: 1,
        bus_id: 2,
        driver_id: 2,
      }),
      parcel({
        id: 3,
        bill_no: 103,
        office_id: 2,
        sender_name: "Other Office Sender",
      }),
    ] as Row[],
  };
}

export type Dataset = ReturnType<typeof seed>;
