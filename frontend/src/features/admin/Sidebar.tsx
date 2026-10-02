import { BookOpenText, CalendarClock, FlaskConical, LayoutDashboard, ScrollText, ShieldCheck, UsersRound } from "lucide-react";
import { NavLink } from "react-router";
import type { DoctorList } from "@/api/types";
import { Logo } from "@/components/ui/Logo";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/cn";
import { env } from "@/lib/env";

/** The admin sections, in menu order (design doc 8.1). */
const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { to: "/admin/users", label: "Users", icon: UsersRound },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/admin/kb", label: "Knowledge base", icon: BookOpenText },
  { to: "/admin/audit", label: "Audit log", icon: ScrollText },
];

/**
 * The dark menu on the left (design doc 2.3: stone-800 for the admin console).
 * Shown fixed on large screens, and inside a slide-out panel on phones.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  // only the counts are needed here, for the badge on "Verifications"
  const pending = useApi<DoctorList>("/admin/doctors", { status: "pending", page_size: 1 }).data?.counts.pending ?? 0;

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
                {label === "Verifications" && pending > 0 && (
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

      {env.USE_MOCKS && (
        <p className="m-3 flex items-start gap-2 rounded-md bg-nav-hover px-3 py-2 text-caption text-nav-muted">
          <FlaskConical className="mt-px size-4 shrink-0 text-haldi-300" strokeWidth={1.75} aria-hidden />
          Demo data. Changes reset when you reload.
        </p>
      )}
    </div>
  );
}
