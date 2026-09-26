import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MasterDetailPage, {
  RowActions,
} from "@/components/custom/MasterDetailPage";
import type { Driver } from "@/lib/domain";

type DriverForm = { name: string };

export default function Drivers() {
  return (
    <MasterDetailPage<Driver, DriverForm>
      table="drivers"
      entityName="Driver"
      entityNamePlural="drivers"
      title="Drivers"
      description="Manage your bus drivers."
      orderBy="name"
      emptyForm={{ name: "" }}
      toForm={(driver) => ({ name: driver.name })}
      toPayload={(form) => ({ name: form.name })}
      isValid={(form) => form.name.trim().length > 0}
      matches={(driver, query) =>
        driver.name.toLowerCase().includes(query.toLowerCase())
      }
      labelOf={(driver) => driver.name}
      columns={({ openEdit, openDelete }) => [
        { header: "#", cell: (_row, i) => i + 1 },
        { header: "Name", cell: (driver) => driver.name },
        {
          header: "Actions",
          className: "w-[100px] text-right",
          cell: (driver) => (
            <RowActions row={driver} onEdit={openEdit} onDelete={openDelete} />
          ),
        },
      ]}
      renderForm={(form, setForm) => (
        <div className="space-y-2">
          <Label htmlFor="name">Driver Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter driver name"
          />
        </div>
      )}
    />
  );
}
