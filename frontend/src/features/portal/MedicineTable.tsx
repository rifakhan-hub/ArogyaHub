import type { Medicine } from "@/api/types";

export function MedicineTable({ medicines }: { medicines: Medicine[] }) {
  if (medicines.length === 0) return <p className="text-small text-muted">No medicines.</p>;

  return (
    <div className="border-border overflow-x-auto rounded-md border">
      <table className="text-small w-full text-left">
        <caption className="sr-only">Medicines</caption>
        <thead className="bg-surface-muted text-caption text-subtle font-semibold tracking-wide uppercase">
          <tr>
            <th className="px-3 py-2">Medicine</th>
            <th className="px-3 py-2">Dose</th>
            <th className="px-3 py-2">How often</th>
            <th className="px-3 py-2">Days</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((m, i) => (
            <tr key={i} className="border-border border-t align-top">
              <td className="px-3 py-2 font-semibold">{m.name}</td>
              <td className="px-3 py-2">{m.dose ?? "—"}</td>
              <td className="px-3 py-2">{m.frequency}</td>
              <td className="px-3 py-2">{m.days ?? "—"}</td>
              <td className="text-muted px-3 py-2">{m.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
