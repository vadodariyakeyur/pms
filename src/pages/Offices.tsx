import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MasterDetailPage, {
  RowActions,
} from "@/components/custom/MasterDetailPage";
import type { Office } from "@/lib/domain";

type OfficeForm = { name: string; mobile: string; address: string };

export default function Offices() {
  return (
    <MasterDetailPage<Office, OfficeForm>
      table="offices"
      entityName="Office"
      entityNamePlural="offices"
      title="Offices"
      description="Manage office locations in your system."
      orderBy="name"
      emptyForm={{ name: "", mobile: "", address: "" }}
      toForm={(office) => ({
        name: office.name,
        mobile: office.mobile_no ?? "",
       address: office.address ?? "",
      })}
      toPayload={(form) => ({
        name: form.name.trim(),
        // Empty string would be a distinct value from "no number", and the
        // receipt's contact fallback keys off null.
        mobile_no: form.mobile.trim() || null,
       address: form.address.trim() || null,
      })}
      isValid={(form) => form.name.trim().length > 0}
      matches={(office, query) =>
        office.name.toLowerCase().includes(query.toLowerCase())
      }
      labelOf={(office) => office.name}
      // Office names are unique in the schema; surface that as a real message
      // rather than a raw Postgres error.
      mapError={(err) =>
        err.code === "23505"
          ? "Office name already exists. Please choose a different name."
          : null
      }
      columns={({ openEdit, openDelete }) => [
        { header: "#", cell: (_row, i) => i + 1 },
        { header: "Name", cell: (office) => office.name },
        {
          header: "Mobile",
          cell: (office) =>
            office.mobile_no || (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          header: "Address",
          cell: (office) =>
            office.address || (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          header: "Actions",
          className: "w-[100px] text-right",
          cell: (office) => (
            <RowActions row={office} onEdit={openEdit} onDelete={openDelete} />
          ),
        },
      ]}
      renderForm={(form, setForm) => (
        <>
          <div className="space-y-2">
            <Label htmlFor="office-name">Office Name</Label>
            <Input
              id="office-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter office name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="office-mobile">Mobile Number (optional)</Label>
            <Input
              id="office-mobile"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              placeholder="Enter mobile number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="office-address">Address (optional)</Label>
            <Input
              id="office-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Enter address"
            />
          </div>
        </>
      )}
    />
  );
}
