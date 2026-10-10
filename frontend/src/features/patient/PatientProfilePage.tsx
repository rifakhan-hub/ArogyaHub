import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ApiError } from "@/api/client";
import { updateMyPatientProfile } from "@/api/patients";
import type { BloodGroup, Gender, Patient } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Field } from "@/components/ui/Field";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { DetailList } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/lib/dates";
import { isPhone } from "@/lib/validators";

const GENDERS: { value: Gender | ""; label: string }[] = [
  { value: "", label: "Not set" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

const BLOOD_GROUPS: (BloodGroup | "")[] = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const GENDER_LABELS: Record<Gender, string> = { female: "Female", male: "Male", other: "Other" };

export default function PatientProfilePage() {
  const { data: patient, error, reload } = useApi<Patient>("/patients/me");
  const [editing, setEditing] = useState(false);

  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  if (!patient) return <Spinner />;

  return (
    <>
      <title>My profile · Patient portal</title>
      <PageHeader
        title="My profile"
        description="Your details and health information. Doctors see them when you book."
        actions={
          !editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden />
              Edit profile
            </Button>
          )
        }
      />

      {editing ? (
        <ProfileForm
          patient={patient}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            reload();
          }}
        />
      ) : (
        <Card className="flex flex-col gap-6 p-6">
          <div className="flex items-center gap-4">
            <Avatar name={patient.name} size="lg" />
            <div className="flex flex-col gap-1">
              <p className="text-h4 font-semibold">{patient.name}</p>
              <RoleBadge role={patient.role} />
            </div>
          </div>
          <section className="flex flex-col gap-2">
            <h2 className="text-small font-semibold text-subtle">Account</h2>
            <DetailList
              items={[
                ["Email", patient.email],
                ["Phone", patient.phone ?? "—"],
                ["City", patient.city ?? "—"],
                ["Member since", formatDate(patient.created_at)],
              ]}
            />
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-small font-semibold text-subtle">Health details</h2>
            <DetailList
              items={[
                ["Date of birth", patient.date_of_birth ? formatDate(patient.date_of_birth) : "—"],
                ["Gender", patient.gender ? GENDER_LABELS[patient.gender] : "—"],
                ["Blood group", patient.blood_group ?? "—"],
                ["Allergies", patient.allergies ?? "None recorded"],
              ]}
            />
          </section>
        </Card>
      )}
    </>
  );
}

function ProfileForm({ patient, onCancel, onSaved }: { patient: Patient; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: patient.name,
    phone: patient.phone ?? "",
    city: patient.city ?? "",
    date_of_birth: patient.date_of_birth ?? "",
    gender: patient.gender ?? "",
    blood_group: patient.blood_group ?? "",
    allergies: patient.allergies ?? "",
  });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; date_of_birth?: string }>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = {
      name: form.name.trim().length < 2 ? "Enter your full name" : undefined,
      phone: form.phone.trim() && !isPhone(form.phone) ? "Use 10 to 15 digits, with an optional + at the start" : undefined,
      date_of_birth: form.date_of_birth && new Date(form.date_of_birth) > new Date() ? "This date is in the future" : undefined,
    };
    setErrors(found);
    if (found.name || found.phone || found.date_of_birth) return;

    setSaving(true);
    try {
      await updateMyPatientProfile({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        date_of_birth: form.date_of_birth || null,
        gender: (form.gender || null) as Gender | null,
        blood_group: (form.blood_group || null) as BloodGroup | null,
        allergies: form.allergies.trim() || null,
      });
      toast.success("Profile saved");
      onSaved();
    } catch (err) {
      const error = err as ApiError;
      if (error.code === "PHONE_TAKEN") setErrors({ phone: error.message });
      else toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" id="name" error={errors.name}>
            <Input value={form.name} onChange={(e) => set("name")(e.target.value)} />
          </Field>
          <Field label="Phone" id="phone" optional error={errors.phone}>
            <Input type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
          </Field>
          <Field label="City" id="city" optional>
            <Input value={form.city} onChange={(e) => set("city")(e.target.value)} />
          </Field>
          <Field label="Date of birth" id="date_of_birth" optional error={errors.date_of_birth}>
            <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth")(e.target.value)} />
          </Field>
          <Field label="Gender" id="gender" optional>
            <Select value={form.gender} onChange={set("gender")} options={GENDERS} />
          </Field>
          <Field label="Blood group" id="blood_group" optional>
            <Select
              value={form.blood_group}
              onChange={set("blood_group")}
              options={BLOOD_GROUPS.map((b) => ({ value: b, label: b || "Not set" }))}
            />
          </Field>
        </div>
        <Field label="Allergies" id="allergies" optional hint="Medicines or foods you react to">
          <Textarea rows={3} value={form.allergies} onChange={(e) => set("allergies")(e.target.value)} />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" loading={saving}>
            Save profile
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
