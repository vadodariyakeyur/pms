/**
 * Test fixtures: a fake Supabase on the network, and a signed-in page.
 *
 * Nothing in `src/` knows these exist. The seam is HTTP — `page.route` swaps
 * the adapter behind `supabase-js` without the app being built for testing.
 */
import { test as base, expect, type Page } from "@playwright/test";
import { seed, type Dataset, type Row } from "./data";
import { query } from "./postgrest";

/** Matches whatever `VITE_SUPABASE_URL` the dev server was built with. */
const SUPABASE_GLOB = "**/rest/v1/**";
const AUTH_GLOB = "**/auth/v1/**";

const ACCESS_TOKEN = "test-access-token";

/** A Supabase session object shaped as the SDK persists it in localStorage. */
function session() {
  return {
    access_token: ACCESS_TOKEN,
    token_type: "bearer",
    expires_in: 3600,
    // Far future, so the SDK never tries to refresh mid-test.
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24,
    refresh_token: "test-refresh-token",
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      aud: "authenticated",
      role: "authenticated",
      email: "operator@example.com",
      app_metadata: { provider: "email" },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
}

/** Handle the test can use to read, mutate, or break the backing dataset. */
export class SupabaseMock {
  data: Dataset = seed();

  /** Requests seen so far, so a test can assert on what the app actually sent. */
  requests: { method: string; url: string; body: any }[] = [];

  /** Tables forced to fail, so error paths can be exercised. */
  private failures = new Map<string, { status: number; body: any }>();

  /** RPC responses, keyed by function name. */
  rpc: Record<string, (args: any) => any> = {};

  /** Makes every request touching `table` fail. Use to test error handling. */
  failOn(table: string, body: any = { message: "boom", code: "500" }, status = 500) {
    this.failures.set(table, { status, body });
  }

  /** Makes `table` reject writes with a unique-violation, like Postgres would. */
  failWithDuplicate(table: string) {
    this.failures.set(table, {
      status: 409,
      body: {
        code: "23505",
        message: "duplicate key value violates unique constraint",
        details: null,
        hint: null,
      },
    });
  }

  clearFailures() {
    this.failures.clear();
  }

  rows(table: keyof Dataset): Row[] {
    return this.data[table] as Row[];
  }

  failureFor(table: string) {
    return this.failures.get(table);
  }
}

/** Default RPC implementations, derived from the dataset so they stay in step. */
function defaultRpc(mock: SupabaseMock): Record<string, (args: any) => any> {
  return {
    // The public receipt RPC looks parcels up by id; bill_no is display-only.
    get_parcel_details_by_id: ({ p_id }: any) => {
      const row = mock
        .rows("parcels")
        .find((p) => Number(p.id) === Number(p_id));
      if (!row) return [];
      return [
        {
          ...row,
          from_city_name: row.from_city?.name,
          to_city_name: row.to_city?.name,
          bus_registration: row.buses?.registration_no,
          office_mobile_no: row.offices?.mobile_no,
          office_address: row.offices?.address,
        },
      ];
    },

    /** One row per date, matching the monthly report's projection. */
    get_parcels_aggregated_by_date: ({
      p_bus_id,
      p_from_city_id,
      p_to_city_id,
      p_start_date,
      p_end_date,
    }: any) => {
      const matching = mock
        .rows("parcels")
        .filter(
          (p) =>
            Number(p.bus_id) === Number(p_bus_id) &&
            Number(p.from_city_id) === Number(p_from_city_id) &&
            Number(p.to_city_id) === Number(p_to_city_id) &&
            p.parcel_date >= p_start_date &&
            p.parcel_date <= p_end_date
        );

      const byDate = new Map<string, any>();
      for (const p of matching) {
        const acc = byDate.get(p.parcel_date) ?? {
          parcel_date: p.parcel_date,
          total_qty: 0,
          total_amount: 0,
          total_amount_given: 0,
          total_amount_remaining: 0,
        };
        acc.total_qty += p.qty ?? 0;
        acc.total_amount += p.amount ?? 0;
        acc.total_amount_given += p.amount_given ?? 0;
        acc.total_amount_remaining += p.amount_remaining ?? 0;
        byDate.set(p.parcel_date, acc);
      }
      return [...byDate.values()].sort((a, b) =>
        a.parcel_date < b.parcel_date ? -1 : 1
      );
    },

    get_latest_customer_contacts: () =>
      mock.rows("parcels").map((p) => ({
        name: p.sender_name,
        mobile_no: p.sender_mobile_no,
      })),
  };
}

/** Installs the network interception on a page. */
export async function installSupabaseMock(page: Page, mock: SupabaseMock) {
  const rpcImpls = { ...defaultRpc(mock), ...mock.rpc };

  await page.route(AUTH_GLOB, async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname.endsWith("/token")) {
      const body = route.request().postDataJSON?.() ?? {};
      // The one credential pair the fake backend accepts.
      if (body.email === "operator@example.com" && body.password === "correct-horse") {
        return route.fulfill({ json: session() });
      }
      return route.fulfill({
        status: 400,
        json: {
          error: "invalid_grant",
          error_description: "Invalid login credentials",
          message: "Invalid login credentials",
        },
      });
    }

    if (url.pathname.endsWith("/logout")) {
      return route.fulfill({ status: 204, body: "" });
    }

    if (url.pathname.endsWith("/user")) {
      return route.fulfill({ json: session().user });
    }

    return route.fulfill({ json: {} });
  });

  await page.route(SUPABASE_GLOB, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    let payload: any = null;
    try {
      payload = request.postDataJSON();
    } catch {
      payload = null;
    }

    mock.requests.push({ method, url: url.pathname + url.search, body: payload });

    const after = url.pathname.split("/rest/v1/")[1] ?? "";
    const [head, ...rest] = after.split("/");

    // RPC: /rest/v1/rpc/<fn>
    if (head === "rpc") {
      const fn = rest.join("/");
      const failure = mock.failureFor(`rpc:${fn}`);
      if (failure) {
        return route.fulfill({ status: failure.status, json: failure.body });
      }
      const impl = rpcImpls[fn];
      if (!impl) {
        return route.fulfill({
          status: 404,
          json: { code: "PGRST202", message: `function ${fn} does not exist` },
        });
      }

      const value = impl(payload ?? {});

      // `.single()` on an RPC asks PostgREST for a bare object and 406s when
      // the set-returning function did not return exactly one row.
      const accept = request.headers()["accept"] ?? "";
      if (accept.includes("pgrst.object")) {
        const rows = Array.isArray(value) ? value : [value];
        if (rows.length !== 1) {
          return route.fulfill({
            status: 406,
            json: {
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
              details: `Results contain ${rows.length} rows`,
              hint: null,
            },
          });
        }
        return route.fulfill({ json: rows[0] });
      }

      return route.fulfill({ json: value });
    }

    const table = head;
    const failure = mock.failureFor(table);
    if (failure) {
      return route.fulfill({ status: failure.status, json: failure.body });
    }

    let result;
    try {
      result = query(
        mock.data,
        method,
        table,
        url.searchParams,
        payload,
        request.headers()["accept"] ?? ""
      );
    } catch (err: any) {
      // A mock that cannot answer must fail loudly, not return empty rows.
      return route.fulfill({
        status: 500,
        json: { message: `mock error: ${err.message}`, code: "MOCK" },
      });
    }

    await route.fulfill({
      status: result.status,
      headers: {
        ...result.headers,
        // The app is served from localhost and Supabase from another origin,
        // so `content-range` — where supabase-js reads the row count for
        // pagination — is invisible to JS unless it is explicitly exposed.
        "access-control-expose-headers": "content-range, content-type",
      },
      body: result.body === null ? "" : JSON.stringify(result.body),
    });
  });
}

/** Writes the auth session the SDK looks for, so the app boots signed in. */
export async function signIn(page: Page) {
  await page.addInitScript((s) => {
    // supabase-js v2 key format: sb-<project-ref>-auth-token
    const ref = "test-project";
    window.localStorage.setItem(
      `sb-${ref}-auth-token`,
      JSON.stringify({ ...s, expires_at: s.expires_at })
    );
  }, session());
}

/**
 * Seeds the offline customer cache in IndexedDB.
 *
 * Not decoration: blurring a mobile field looks the number up here and writes
 * the result into the matching name field. On an empty cache that write is
 * `undefined`, which blanks the name — so a browser with no cache cannot get
 * through the form at all. A real operator's browser is always populated.
 */
export async function seedLocalCache(
  page: Page,
  customers: { mobile_no: string; customer_name: string }[]
) {
  await page.addInitScript((rows) => {
    const open = indexedDB.open("pms-db", 2);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains("customers"))
        db.createObjectStore("customers", { keyPath: "mobile_no" });
      if (!db.objectStoreNames.contains("descriptions"))
        db.createObjectStore("descriptions");
      if (!db.objectStoreNames.contains("remarks"))
        db.createObjectStore("remarks");
    };
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction("customers", "readwrite");
      for (const row of rows) tx.objectStore("customers").put(row);
    };
  }, customers);
}

type Fixtures = {
  supabase: SupabaseMock;
  /** A page with the mock installed and an authenticated session present. */
  app: Page;
};

export const test = base.extend<Fixtures>({
  supabase: async ({}, use) => {
    await use(new SupabaseMock());
  },

  app: async ({ page, supabase }, use) => {
    await installSupabaseMock(page, supabase);
    await signIn(page);
    // Every contact in the seed parcels, so editing an existing parcel behaves
    // the way it does on a machine that has already booked those parcels.
    await seedLocalCache(
      page,
      supabase.rows("parcels").flatMap((p) => [
        { mobile_no: p.sender_mobile_no, customer_name: p.sender_name },
        { mobile_no: p.receiver_mobile_no, customer_name: p.receiver_name },
      ])
    );
    await use(page);
  },
});

export { expect };
export type { Page };
