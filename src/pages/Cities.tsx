import { ArrowRightLeft } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import MasterDetailPage, {
  RowActions,
} from "@/components/custom/MasterDetailPage";
import type { City } from "@/lib/domain";

type CityForm = { name: string; isDefaultFrom: boolean; isDefaultTo: boolean };

/**
 * Enforces "at most one default origin, at most one default destination".
 *
 * This is a cross-row invariant applied client-side across separate round
 * trips, so a failure between the clear and the write leaves the system with
 * no default city — Reports and ParcelForm then silently fall back to empty
 * selections. A partial unique index would enforce it atomically in the
 * database; until then this at least lives in one place instead of being
 * duplicated across the add and edit handlers.
 */
async function clearOtherDefaults(form: CityForm, editingId: number | null) {
  if (form.isDefaultFrom) {
    let query = supabase
      .from("cities")
      .update({ is_default_from: false })
      .eq("is_default_from", true);
    if (editingId !== null) query = query.neq("id", editingId);
    const { error } = await query;
    if (error) throw error;
  }

  if (form.isDefaultTo) {
    let query = supabase
      .from("cities")
      .update({ is_default_to: false })
      .eq("is_default_to", true);
    if (editingId !== null) query = query.neq("id", editingId);
    const { error } = await query;
    if (error) throw error;
  }
}

export default function Cities() {
  return (
    <MasterDetailPage<City, CityForm>
      table="cities"
      entityName="City"
      entityNamePlural="cities"
      title="Cities"
      description="Manage your cities and default locations."
      orderBy="name"
      emptyForm={{ name: "", isDefaultFrom: false, isDefaultTo: false }}
      toForm={(city) => ({
        name: city.name,
        isDefaultFrom: city.is_default_from || false,
        isDefaultTo: city.is_default_to || false,
      })}
      toPayload={(form) => ({
        name: form.name,
        is_default_from: form.isDefaultFrom,
        is_default_to: form.isDefaultTo,
      })}
      isValid={(form) => form.name.trim().length > 0}
      matches={(city, query) =>
        city.name.toLowerCase().includes(query.toLowerCase())
      }
      labelOf={(city) => city.name}
      beforeSave={clearOtherDefaults}
      columns={({ openEdit, openDelete }) => [
        { header: "#", cell: (_row, i) => i + 1 },
        { header: "Name", cell: (city) => city.name },
        {
          header: "Default From",
          cell: (city) =>
            city.is_default_from ? (
              <span className="inline-flex items-center rounded-full bg-green-900/20 px-2 py-1 text-xs font-medium text-green-400">
                Default
              </span>
            ) : (
              "-"
            ),
        },
        {
          header: "Default To",
          cell: (city) =>
            city.is_default_to ? (
              <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-1 text-xs font-medium text-primary">
                Default
              </span>
            ) : (
              "-"
            ),
        },
        {
          header: "Actions",
          className: "w-[100px] text-right",
          cell: (city) => (
            <RowActions row={city} onEdit={openEdit} onDelete={openDelete} />
          ),
        },
      ]}
      renderForm={(form, setForm) => (
        <>
          <div className="space-y-2">
            <Label htmlFor="city-name">City Name</Label>
            <Input
              id="city-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter city name"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="default-from" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Set as Default FROM City
            </Label>
            <Switch
              id="default-from"
              checked={form.isDefaultFrom}
              onCheckedChange={(checked) =>
                setForm({ ...form, isDefaultFrom: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="default-to" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Set as Default TO City
            </Label>
            <Switch
              id="default-to"
              checked={form.isDefaultTo}
              onCheckedChange={(checked) =>
                setForm({ ...form, isDefaultTo: checked })
              }
            />
          </div>
        </>
      )}
    />
  );
}
