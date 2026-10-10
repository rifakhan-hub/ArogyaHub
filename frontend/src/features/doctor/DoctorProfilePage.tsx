import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DetailList } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { DocumentsSection } from "./DocumentsSection";
import { useDoctorData } from "./DoctorLayout";

export default function DoctorProfilePage() {
  const { profile } = useDoctorData();

  return (
    <>
      <title>My profile · Doctor portal</title>
      <PageHeader title="My profile" description="What patients see when they book you." />
      <Card className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} size="lg" />
          <div className="flex flex-col gap-1">
            <p className="text-h4 font-semibold">{profile.name}</p>
            <VerificationBadge status={profile.verification_status} />
          </div>
        </div>
        <DetailList
          items={[
            ["Speciality", profile.specialization],
            ["Qualifications", profile.qualifications],
            ["Licence number", profile.license_number],
            ["Medical council", profile.council],
            ["Experience", `${profile.experience_years} years`],
            ["Consultation fee", formatINR(profile.consultation_fee)],
            ["Email", profile.email],
            ["Phone", profile.phone ?? "—"],
            ["City", profile.city ?? "—"],
            ["Approved on", profile.reviewed_at ? formatDate(profile.reviewed_at) : "—"],
          ]}
        />
        {profile.bio && <p className="text-body text-muted">{profile.bio}</p>}
      </Card>
      <DocumentsSection canDelete={false} />
    </>
  );
}
