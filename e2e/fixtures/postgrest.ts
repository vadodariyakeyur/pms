/**
 * A minimal in-memory PostgREST, good enough for this app's query surface.
 *
 * The app talks to Supabase over plain HTTP, so the network is the seam: the
 * whole data layer can be replaced without the app knowing. Tests then assert
 * on real rendered UI driven by real query strings — if a caller builds a bad
 * filter, this returns the wrong rows and the test fails, which is exactly the
 * class of bug a mocked `supabase` client object would hide.
 *
 * Only the operators this codebase actually issues are implemented (eq, gte,
 * lte, ilike, or, order, limit/offset, count). An unknown operator throws
 * rather than being silently ignored — a silently-ignored filter would make a
 * test pass for the wrong reason.
 */
import type { Dataset, Row } from "./data";
import { withEmbeds } from "./data";

/** Tables whose rows carry embedded lookups when selected with joins. */
const EMBEDS_TABLE = "parcels";

/**
 * Attaches the `buses`/`drivers` embeds an assignment select asks for.
 *
 * Kept here rather than in the seed data because it has to run for rows the
 * app creates mid-test too, not just the ones the fixture starts with.
 */
function embedAssignment(row: Row, data: Dataset): Row {
  const bus = data.buses.find((b) => b.id === row.bus_id);
  const driver = data.drivers.find((d) => d.id === row.driver_id);
  return {
    ...row,
    buses: bus ? { id: bus.id, registration_no: bus.registration_no } : null,
    drivers: driver ? { id: driver.id, name: driver.name } : null,
  };
}

type Op = { column: string; op: string; value: string };

function parseValue(raw: string): any {
  if (raw === "null") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

function ilike(value: any, pattern: string): boolean {
  const re = new RegExp(
    `^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*")}$`,
    "i"
  );
  return re.test(String(value ?? ""));
}

function matchesOp(row: Row, { column, op, value }: Op): boolean {
  const actual = row[column];
  switch (op) {
    case "eq":
      // PostgREST compares as text on the wire; `==` keeps "1" == 1 working.
      // eslint-disable-next-line eqeqeq
      return actual == parseValue(value);
    case "neq":
      // eslint-disable-next-line eqeqeq
      return actual != parseValue(value);
    case "gte":
      return String(actual) >= value;
    case "lte":
      return String(actual) <= value;
    case "gt":
      return String(actual) > value;
    case "lt":
      return String(actual) < value;
    case "ilike":
      return ilike(actual, value);
    case "is":
      return value === "null" ? actual == null : actual === parseValue(value);
    case "in": {
      const items = value.replace(/^\(|\)$/g, "").split(",");
      return items.some((i) => String(actual) === i.replace(/^"|"$/g, ""));
    }
    default:
      throw new Error(`postgrest mock: unsupported operator "${op}"`);
  }
}

/** `or=(a.ilike.%x%,b.ilike.%x%)` — one level deep, which is all the app uses. */
function matchesOr(row: Row, expr: string): boolean {
  const inner = expr.replace(/^\(|\)$/g, "");
  return splitTopLevel(inner).some((clause) => {
    const [column, op, ...rest] = clause.split(".");
    return matchesOp(row, { column, op, value: rest.join(".") });
  });
}

/** Splits on commas that are not inside parentheses. */
function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(buf);
      buf = "";
    } else buf += ch;
  }
  if (buf) out.push(buf);
  return out;
}

function applyOrder(rows: Row[], order: string): Row[] {
  const keys = splitTopLevel(order).map((part) => {
    const [column, ...mods] = part.split(".");
    return { column, desc: mods.includes("desc") };
  });
  return [...rows].sort((a, b) => {
    for (const { column, desc } of keys) {
      const av = a[column];
      const bv = b[column];
      if (av === bv) continue;
      const cmp = av > bv ? 1 : -1;
      return desc ? -cmp : cmp;
    }
    return 0;
  });
}

/**
 * Trims a row to the columns a select string names.
 *
 * Nested embeds (`to_city:cities!fk(name)`) are already attached by the
 * fixture, so this only has to decide which top-level keys survive and rename
 * embedded ones to their alias.
 */
function project(row: Row, select: string): Row {
  if (!select || select.trim() === "*") return row;

  const parts = splitTopLevel(stripNested(select));
  if (parts.some((p) => p.trim() === "*")) return row;

  const out: Row = {};
  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;
    const alias = part.includes(":") ? part.split(":")[0].trim() : null;
    const name = (alias ?? part).replace(/\(.*\)$/, "").trim();
    const source = alias
      ? alias // fixture already stored embeds under their alias
      : name;
    if (source in row) out[source] = row[source];
    else if (name in row) out[name] = row[name];
  }
  return out;
}

/** Replaces `x(...)` bodies with `x()` so splitting sees flat parts. */
function stripNested(select: string): string {
  let out = "";
  let depth = 0;
  for (const ch of select) {
    if (ch === "(") {
      depth++;
      if (depth === 1) out += "(";
      continue;
    }
    if (ch === ")") {
      depth--;
      if (depth === 0) out += ")";
      continue;
    }
    if (depth === 0) out += ch;
  }
  return out.replace(/\s+/g, "");
}

/** Applies whatever embeds a table's rows need. */
function embed(row: Row, table: string, data: Dataset): Row {
  if (table === EMBEDS_TABLE) return withEmbeds(row);
  if (table === "bus_driver_assignments") return embedAssignment(row, data);
  return row;
}

export type QueryResult = {
  status: number;
  body: any;
  headers: Record<string, string>;
};

/** Runs one PostgREST request against the dataset and returns the response. */
export function query(
  data: Dataset,
  method: string,
  table: string,
  params: URLSearchParams,
  payload: any,
  accept: string
): QueryResult {
  const store = (data as any)[table] as Row[] | undefined;
  if (!store) {
    return {
      status: 404,
      body: { message: `relation "${table}" does not exist`, code: "42P01" },
      headers: {},
    };
  }

  const select = params.get("select") ?? "*";
  const filters: Op[] = [];
  let order: string | null = null;

  for (const [key, value] of params.entries()) {
    if (key === "select" || key === "limit" || key === "offset") continue;
    if (key === "order") {
      order = value;
      continue;
    }
    if (key === "or") {
      filters.push({ column: "__or", op: "or", value });
      continue;
    }
    const [op, ...rest] = value.split(".");
    filters.push({ column: key, op, value: rest.join(".") });
  }

  const matches = (row: Row) =>
    filters.every((f) =>
      f.op === "or" ? matchesOr(row, f.value) : matchesOp(row, f)
    );

  if (method === "POST") {
    const incoming: Row[] = Array.isArray(payload) ? payload : [payload];
    const created = incoming.map((values) => {
      const nextId = Math.max(0, ...store.map((r) => Number(r.id) || 0)) + 1;
      const row: Row = { id: nextId, ...values };
      // Emulates the `bill_no_seq` column default on parcels.
      if (table === "parcels" && row.bill_no == null) {
        row.bill_no =
          Math.max(0, ...store.map((r) => Number(r.bill_no) || 0)) + 1;
      }
      const full = embed(row, table, data);
      store.push(full);
      return full;
    });
    return respond(created, select, created.length, accept);
  }

  if (method === "PATCH") {
    const updated: Row[] = [];
    for (let i = 0; i < store.length; i++) {
      if (!matches(store[i])) continue;
      const merged = { ...store[i], ...payload };
      store[i] = embed(merged, table, data);
      updated.push(store[i]);
    }
    return respond(updated, select, updated.length, accept);
  }

  if (method === "DELETE") {
    const removed = store.filter(matches);
    for (const row of removed) store.splice(store.indexOf(row), 1);
    return respond(removed, select, removed.length, accept);
  }

  // GET / HEAD. `total` is counted before paging — it is what the
  // `content-range` header reports, and what `.select(…, {count})` reads back.
  let rows = store.filter(matches);
  const total = rows.length;

  // `head: true` is a count-only query: supabase-js issues a real HEAD and
  // takes the count from `content-range`, ignoring any body.
  if (method === "HEAD") {
    return {
      status: 200,
      body: null,
      headers: { "content-range": `*/${total}` },
    };
  }

  if (order) rows = applyOrder(rows, order);
  rows = rows.map((r) => embed(r, table, data));

  const offset = Number(params.get("offset") ?? 0);
  const limit = params.get("limit");
  if (limit !== null) rows = rows.slice(offset, offset + Number(limit));
  else if (offset) rows = rows.slice(offset);

  return respond(rows, select, total, accept);
}

/**
 * Builds the response. `accept` carries the `.single()` signal: supabase-js
 * sets `Accept: application/vnd.pgrst.object+json` for it, and PostgREST then
 * returns a bare object — or 406 when the match isn't exactly one row, which
 * is what the app's `if (error) throw` paths are written against.
 */
function respond(
  rows: Row[],
  select: string,
  total: number,
  accept: string
): QueryResult {
  const headers: Record<string, string> = {
    "content-range": `0-${Math.max(0, rows.length - 1)}/${total}`,
    "content-type": "application/json",
  };

  const projected = rows.map((r) => project(r, select));

  if (accept.includes("pgrst.object")) {
    if (projected.length !== 1) {
      return {
        status: 406,
        body: {
          code: "PGRST116",
          message: `JSON object requested, multiple (or no) rows returned`,
          details: `Results contain ${projected.length} rows`,
          hint: null,
        },
        headers,
      };
    }
    return { status: 200, body: projected[0], headers };
  }

  return { status: 200, body: projected, headers };
}
