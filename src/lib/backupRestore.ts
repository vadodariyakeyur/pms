import JSZip from "jszip";
import Papa from "papaparse";
import { supabase } from "@/lib/supabase/client";

const CHUNK = 1000;

const TABLES_IN_ORDER = [
  "offices",
  "buses",
  "drivers",
  "cities",
  "bus_driver_assignments",
  "parcels",
] as const;

type TableName = (typeof TABLES_IN_ORDER)[number];

export type ProgressCallback = (
  table: string,
  done: number,
  total: number
) => void;

export type DateRange = { from: string; to: string };

export async function exportAllTablesToZip(
  onProgress?: ProgressCallback,
  parcelDateRange?: DateRange
): Promise<Blob> {
  const zip = new JSZip();

  for (const table of TABLES_IN_ORDER) {
    const applyRange = (query: any) =>
      table === "parcels" && parcelDateRange
        ? query
            .gte("parcel_date", parcelDateRange.from)
            .lte("parcel_date", parcelDateRange.to)
        : query;

    const { count } = await applyRange(
      supabase.from(table).select("*", { count: "exact", head: true })
    );
    const total = count ?? 0;

    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; offset < total || offset === 0; offset += CHUNK) {
      const { data, error } = await applyRange(
        supabase.from(table).select("*")
      ).range(offset, offset + CHUNK - 1);
      if (error) throw new Error(`Failed to read ${table}: ${error.message}`);
      rows.push(...(data ?? []));
      onProgress?.(table, rows.length, total);
      if (!data || data.length < CHUNK) break;
    }

    zip.file(`${table}.csv`, Papa.unparse(rows, { newline: "\r\n" }));
  }

  return zip.generateAsync({ type: "blob" });
}

export type RestoreRowError = {
  table: string;
  row: Record<string, string>;
  error: string;
};

export type RestoreSummary = {
  table: string;
  restored: number;
  failed: number;
}[];

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ponytail: nullable-column coercion is hardcoded per table rather than
// derived from the schema; add a column to a table's nullable set below if
// a new nullable column is introduced.
const NULLABLE_COLUMNS: Record<TableName, string[]> = {
  offices: ["address", "mobile_no"],
  buses: [],
  drivers: [],
  cities: ["is_default_from", "is_default_to"],
  bus_driver_assignments: [],
  parcels: ["created_at", "description", "remark"],
};

function coerceRow(
  table: TableName,
  raw: Record<string, string>
): Record<string, unknown> {
  const nullable = NULLABLE_COLUMNS[table];
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === "" && nullable.includes(key)) {
      row[key] = null;
    } else if (value === "" ) {
      row[key] = value;
    } else if (/^-?\d+(\.\d+)?$/.test(value)) {
      row[key] = Number(value);
    } else if (value === "true" || value === "false") {
      row[key] = value === "true";
    } else {
      row[key] = value;
    }
  }
  return row;
}

export async function restoreFromZip(
  file: File,
  onProgress?: ProgressCallback
): Promise<{ summary: RestoreSummary; errors: RestoreRowError[] }> {
  const zip = await JSZip.loadAsync(file);
  const summary: RestoreSummary = [];
  const errors: RestoreRowError[] = [];

  for (const table of TABLES_IN_ORDER) {
    const entry = zip.file(`${table}.csv`);
    if (!entry) continue;

    const text = await entry.async("string");
    const { data: rawRows } = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    const chunks = chunkArray(rawRows, CHUNK);

    let restored = 0;
    let failed = 0;

    for (const chunk of chunks) {
      const coerced = chunk.map((r) => coerceRow(table, r));
      const { error } = await supabase
        .from(table)
        .upsert(coerced as never[], { onConflict: "id" });

      if (!error) {
        restored += chunk.length;
      } else {
        // best-effort: fall back to per-row upsert so one bad row doesn't
        // sink the rest of the chunk
        for (let i = 0; i < chunk.length; i++) {
          const { error: rowError } = await supabase
            .from(table)
            .upsert(coerced[i] as never, { onConflict: "id" });
          if (rowError) {
            failed++;
            errors.push({ table, row: chunk[i], error: rowError.message });
          } else {
            restored++;
          }
        }
      }
      onProgress?.(table, restored + failed, rawRows.length);
    }

    summary.push({ table, restored, failed });
  }

  return { summary, errors };
}

export function failedRowsToCsv(errors: RestoreRowError[]): string {
  if (errors.length === 0) return "";
  const rows = errors.map((e) => ({ table: e.table, ...e.row, error: e.error }));
  return Papa.unparse(rows, { newline: "\r\n" });
}
