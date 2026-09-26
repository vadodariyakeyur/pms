import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MasterDetailPage, {
  RowActions,
} from "@/components/custom/MasterDetailPage";
import type { Bus } from "@/lib/domain";

type BusForm = { registrationNo: string };

export default function Buses() {
  return (
    <MasterDetailPage<Bus, BusForm>
      table="buses"
      entityName="Bus"
      entityNamePlural="buses"
      title="Buses"
      description="Manage your bus fleet."
      orderBy="registration_no"
      emptyForm={{ registrationNo: "" }}
      toForm={(bus) => ({ registrationNo: bus.registration_no })}
      toPayload={(form) => ({ registration_no: form.registrationNo })}
      isValid={(form) => form.registrationNo.trim().length > 0}
      matches={(bus, query) =>
        bus.registration_no.toLowerCase().includes(query.toLowerCase())
      }
      labelOf={(bus) => bus.registration_no}
      columns={({ openEdit, openDelete }) => [
        { header: "#", cell: (_row, i) => i + 1 },
        { header: "Registration No", cell: (bus) => bus.registration_no },
        {
          header: "Actions",
          className: "w-[100px] text-right",
          cell: (bus) => (
            <RowActions row={bus} onEdit={openEdit} onDelete={openDelete} />
          ),
        },
      ]}
      renderForm={(form, setForm) => (
        <div className="space-y-2">
          <Label htmlFor="registration-no">Registration Number</Label>
          <Input
            id="registration-no"
            value={form.registrationNo}
            onChange={(e) =>
              setForm({ ...form, registrationNo: e.target.value })
            }
            placeholder="Enter bus registration number"
          />
        </div>
      )}
    />
  );
}
