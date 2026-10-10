import { Clock, FilePen, LogOut, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { ApiError } from "@/api/client";
import { updateMyProfile } from "@/api/doctors";
import type { Doctor } from "@/api/types";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { DetailList } from "@/components/ui/Modal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { formatDate } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { DocumentsSection } from "./DocumentsSection";
import {
  AboutFields,
  EMPTY_PROFILE,
  ProfessionalFields,
  type ProfileErrors,
  profileFromDoctor,
  toProfileInput,
  validateAbout,
  validateProfessional,
} from "./profileForm";

export function DoctorStatusScreen({ doctor, onUpdated }: { doctor: Doctor | null; onUpdated: () => void }) {
  const rejected = doctor?.verification_status === "rejected";

  return (
    <div className="min-h-dvh bg-bg text-text">
      <title>Profile under review · AarogyaHub</title>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-8">
          <Link to="/" aria-label="AarogyaHub home">
            <Logo onDark={false} subtitle="Doctor portal" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/logout" className={buttonClass("ghost", "sm")}>
              <LogOut aria-hidden />
              Log out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
        {doctor === null ? (
          <>
            <Card className="flex flex-col gap-4 p-8">
              <span className="flex size-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <FilePen className="size-6" aria-hidden />
              </span>
              <h1 className="text-h2">Finish your doctor profile</h1>
              <p className="text-body text-muted">
                Add your licence and practice details. An admin checks them before patients can book you.
              </p>
            </Card>
            <ProfileForm doctor={null} onUpdated={onUpdated} />
          </>
        ) : (
          <>
            <Card className="flex flex-col gap-4 p-8">
              <span
                className={
                  rejected
                    ? "flex size-12 items-center justify-center rounded-lg bg-danger-soft text-danger"
                    : "flex size-12 items-center justify-center rounded-lg bg-warning-soft text-warning"
                }
              >
                {rejected ? <XCircle className="size-6" aria-hidden /> : <Clock className="size-6" aria-hidden />}
              </span>
              <h1 className="text-h2">{rejected ? "We couldn't approve your profile" : "Your profile is under review"}</h1>
              {rejected ? (
                <>
                  <p className="text-body text-muted">Our team left this note:</p>
                  <p className="rounded-md bg-danger-soft p-4 text-body">{doctor.rejection_reason}</p>
                  <p className="text-body text-muted">Fix your details below and send them again.</p>
                </>
              ) : (
                <p className="text-body text-muted">
                  You sent it on {formatDate(doctor.submitted_at)}. We're checking your licence with {doctor.council}.
                  Patients can book you once it's approved.
                </p>
              )}
            </Card>

            {rejected ? (
              <ProfileForm doctor={doctor} onUpdated={onUpdated} />
            ) : (
              <Card className="p-6">
                <h2 className="text-h4 font-semibold">What you sent</h2>
                <div className="mt-4">
                  <DetailList
                    items={[
                      ["Speciality", doctor.specialization],
                      ["Licence number", doctor.license_number],
                      ["Medical council", doctor.council],
                      ["Experience", `${doctor.experience_years} years`],
                      ["Fee", formatINR(doctor.consultation_fee)],
                      ["Qualifications", doctor.qualifications],
                    ]}
                  />
                </div>
              </Card>
            )}
            <DocumentsSection canDelete />
          </>
        )}
      </main>
    </div>
  );
}

function ProfileForm({ doctor, onUpdated }: { doctor: Doctor | null; onUpdated: () => void }) {
  const [form, setForm] = useState(() => (doctor ? profileFromDoctor(doctor) : EMPTY_PROFILE));
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = { ...validateProfessional(form), ...validateAbout(form) };
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await updateMyProfile(toProfileInput(form));
      toast.success(doctor ? "Sent for review again" : "Sent for review");
      onUpdated();
    } catch (err) {
      const error = err as ApiError;
      if (error.code === "LICENSE_TAKEN") setErrors({ license_number: error.message });
      else toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  const onChange = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <h2 className="text-h4 font-semibold">Your details</h2>
        <ProfessionalFields form={form} errors={errors} onChange={onChange} />
        <AboutFields form={form} errors={errors} onChange={onChange} />
        <Button type="submit" className="self-start" loading={saving}>
          {doctor ? "Send for review again" : "Send for review"}
        </Button>
      </form>
    </Card>
  );
}
