import { BookOpenText, CalendarClock, LayoutDashboard, ScrollText, Stethoscope, UsersRound } from "lucide-react";
import { NavLink } from "react-router";
import type { Doctor, Paginated } from "@/api/types";
import { Logo } from "@/components/ui/Logo";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/admin/patients", label: "Patients", icon: UsersRound },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/admin/kb", label: "Knowledge base", icon: BookOpenText },
  { to: "/admin/audit", label: "Audit log", icon: ScrollText },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pending = useApi<Paginated<Doctor>>("/admin/doctors", { status: "pending", page_size: 1 }).data?.total ?? 0;

  return (
    <div className="flex h-full flex-col bg-nav">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/admin"}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-body font-medium transition-colors hover:bg-nav-hover hover:text-nav-text",
                    isActive ? "bg-nav-active text-nav-text" : "text-nav-muted",
                  )
                }
              >
                <Icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="truncate">{label}</span>
                {label === "Doctors" && pending > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-haldi-400 px-1.5 text-caption font-semibold text-stone-900 tabular">
                    {pending}
                    <span className="sr-only"> pending</span>
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

    </div>
  );
}
