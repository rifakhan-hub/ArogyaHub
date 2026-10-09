import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DetailList } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/dates";

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <title>My profile · AarogyaHub</title>
      <PageHeader title="My profile" description="The details on your AarogyaHub account." />
      <Card className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div className="flex flex-col gap-1">
            <p className="text-h4 font-semibold">{user.name}</p>
            <RoleBadge role={user.role} />
          </div>
        </div>
        <DetailList
          items={[
            ["Email", user.email],
            ["Phone", user.phone ?? "—"],
            ["City", user.city ?? "—"],
            ["Member since", formatDate(user.created_at)],
          ]}
        />
      </Card>
    </>
  );
}
