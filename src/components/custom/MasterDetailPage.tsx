/**
 * The list + add/edit/delete dialog page, written once.
 *
 * Cities, Drivers, Buses, Offices and BusDriverAssignments were five copies of
 * the same ~400 lines — five identical 22-line delete handlers whose only
 * difference was a table name and a noun in a log string. The copies had
 * already drifted: `colSpan` was wrong in three of the four.
 *
 * Only two real variations existed, and both are hooks here:
 *   - `beforeSave`  — Cities' single-default-city invariant
 *   - `mapError`    — Offices' 23505 unique-violation message
 */
import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** The minimum a row must have to be listed, edited, and deleted. */
type Entity = { id: number };

/** Table names the generated schema knows about. */
type TableName = keyof Database["public"]["Tables"];

export type Column<T> = {
  header: string;
  /** Cell contents for a row. */
  cell: (row: T, index: number) => ReactNode;
  className?: string;
};

export type MasterDetailProps<T extends Entity, F> = {
  /** Supabase table name. */
  table: TableName;
  /** Singular noun, used in dialog titles and buttons ("City"). */
  entityName: string;
  /** Plural noun, used in the heading and empty state ("cities"). */
  entityNamePlural: string;
  title: string;
  description: string;
  /** Column to sort the list by. */
  orderBy: string;
  /**
   * Column definitions. Receives the dialog openers so a column can render
   * row actions — `colSpan` is derived from this list's length, so the drift
   * that put the wrong span in three of four pages cannot recur.
   */
  columns: (actions: {
    openEdit: (row: T) => void;
    openDelete: (row: T) => void;
  }) => Column<T>[];
  /** Populates the form when opening the edit dialog. */
  toForm: (row: T) => F;
  /** Blank form state, used for "add" and after a successful save. */
  emptyForm: F;
  /** Turns form state into the row payload to insert/update. */
  toPayload: (form: F) => Record<string, unknown>;
  /** Renders the dialog body. */
  renderForm: (form: F, setForm: (form: F) => void) => ReactNode;
  /** Whether the save button is enabled. */
  isValid: (form: F) => boolean;
  /** Free-text search predicate. */
  matches: (row: T, query: string) => boolean;
  /** Label for a row in the delete confirmation. */
  labelOf: (row: T) => string;
  /**
   * Runs before an insert or update — for invariants that span rows, like
   * "only one city may be the default origin". `editingId` is null on add.
   */
  beforeSave?: (form: F, editingId: number | null) => Promise<void>;
  /** Maps a Postgres error to a friendlier message. Return null to fall back. */
  mapError?: (err: { code?: string; message: string }) => string | null;
};

export default function MasterDetailPage<T extends Entity, F>({
  table,
  entityName,
  entityNamePlural,
  title,
  description,
  orderBy,
  columns,
  toForm,
  emptyForm,
  toPayload,
  renderForm,
  isValid,
  matches,
  labelOf,
  beforeSave,
  mapError,
}: MasterDetailProps<T, F>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [current, setCurrent] = useState<T | null>(null);
  const [form, setForm] = useState<F>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRows();
  }, []);

  const describe = (err: any): string => {
    const mapped = mapError?.(err);
    return mapped ?? err.message;
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(orderBy);

      if (error) throw error;
      setRows((data as unknown as T[]) || []);
    } catch (err: any) {
      console.error(`Error fetching ${entityNamePlural}:`, err);
      setError(describe(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await beforeSave?.(form, null);

      const { error } = await supabase.from(table).insert([toPayload(form)] as never);
      if (error) throw error;

      await fetchRows();
      setIsAddOpen(false);
      setForm(emptyForm);
    } catch (err: any) {
      console.error(`Error adding ${entityName}:`, err);
      setError(describe(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!current) return;

    setSubmitting(true);
    setError(null);
    try {
      await beforeSave?.(form, current.id);

      const { error } = await supabase
        .from(table)
        .update(toPayload(form) as never)
        .eq("id", current.id);
      if (error) throw error;

      await fetchRows();
      setIsEditOpen(false);
      setCurrent(null);
      setForm(emptyForm);
    } catch (err: any) {
      console.error(`Error updating ${entityName}:`, err);
      setError(describe(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!current) return;

    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", current.id);
      if (error) throw error;

      await fetchRows();
      setIsDeleteOpen(false);
      setCurrent(null);
    } catch (err: any) {
      console.error(`Error deleting ${entityName}:`, err);
      setError(describe(err));
      setIsDeleteOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (row: T) => {
    setCurrent(row);
    setForm(toForm(row));
    setIsEditOpen(true);
  };

  const openDelete = (row: T) => {
    setCurrent(row);
    setIsDeleteOpen(true);
  };

  const resolvedColumns = columns({ openEdit, openDelete });
  const filtered = rows.filter((row) => matches(row, searchQuery));
  // Derived from the column list, so it can never drift out of step again.
  const colSpan = resolvedColumns.length;

  const dialogFooter = (
    onCancel: () => void,
    onConfirm: () => void,
    busyLabel: string,
    label: string,
    enabled: boolean,
    destructive = false
  ) => (
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        variant={destructive ? "destructive" : "default"}
        onClick={onConfirm}
        disabled={!enabled || submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {busyLabel}
          </>
        ) : (
          label
        )}
      </Button>
    </DialogFooter>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button
          onClick={() => {
            setForm(emptyForm);
            setCurrent(null);
            setIsAddOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {entityName}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${entityNamePlural}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {resolvedColumns.map((col) => (
                <TableHead key={col.header} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-3">
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-9 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-center py-10 text-muted-foreground"
                >
                  {searchQuery
                    ? `No ${entityNamePlural} match your search.`
                    : `No ${entityNamePlural} found. Add one to get started.`}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row, idx) => (
                <TableRow key={row.id}>
                  {resolvedColumns.map((col) => (
                    <TableCell key={col.header} className={col.className}>
                      {col.cell(row, idx)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {entityName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">{renderForm(form, setForm)}</div>
          {dialogFooter(
            () => setIsAddOpen(false),
            handleAdd,
            "Adding...",
            `Add ${entityName}`,
            isValid(form)
          )}
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {entityName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">{renderForm(form, setForm)}</div>
          {dialogFooter(
            () => setIsEditOpen(false),
            handleEdit,
            "Updating...",
            `Update ${entityName}`,
            isValid(form)
          )}
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {entityName}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the {entityName.toLowerCase()} "
              {current ? labelOf(current) : ""}"?
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              This action cannot be undone.
            </p>
          </div>
          {dialogFooter(
            () => setIsDeleteOpen(false),
            handleDelete,
            "Deleting...",
            `Delete ${entityName}`,
            true,
            true
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Row action buttons, shared by every master-detail column set. */
export function RowActions<T>({
  row,
  onEdit,
  onDelete,
}: {
  row: T;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}) {
  return (
    <div className="flex justify-end space-x-2">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onEdit(row)}
        className="h-8 w-8 text-muted-foreground"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onDelete(row)}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
