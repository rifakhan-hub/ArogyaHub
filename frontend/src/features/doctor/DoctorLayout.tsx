import { CalendarDays, ClipboardList, Info, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useOutletContext } from "react-router";
import type { AppointmentStatus } from "@/api/types";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import { todayIST } from "@/lib/dates";
import { formatLongDate } from "./calendar";
import { type AvailabilityBlock, type DoctorAppointment, SAMPLE_APPOINTMENTS, SAMPLE_BLOCKS } from "./data";

export interface DoctorData {
  appointments: DoctorAppointment[];
  blocks: AvailabilityBlock[];
  daysOff: string[];
  setStatus: (id: string, status: AppointmentStatus) => void;
  addBlock: (block: Omit<AvailabilityBlock, "id">) => void;
  removeBlock: (id: string) => void;
  toggleDayOff: (date: string) => void;
}

export function useDoctorData() {
  return useOutletContext<DoctorData>();
}

const LINKS = [
  { to: "/doctor", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/doctor/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/doctor/appointments", label: "Appointments", icon: ClipboardList },
  { to: "/doctor/profile", label: "Profile", icon: UserRound },
];

export function DoctorLayout() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState(SAMPLE_APPOINTMENTS);
  const [blocks, setBlocks] = useState(SAMPLE_BLOCKS);
  const [daysOff, setDaysOff] = useState<string[]>([]);

  const data: DoctorData = {
    appointments,
    blocks,
    daysOff,
    setStatus: (id, status) => setAppointments((list) => list.map((a) => (a.id === id ? { ...a, status } : a))),
    addBlock: (block) => setBlocks((list) => [...list, { ...block, id: `b${Date.now()}` }]),
    removeBlock: (id) => setBlocks((list) => list.filter((b) => b.id !== id)),
    toggleDayOff: (date) =>
      setDaysOff((list) => (list.includes(date) ? list.filter((d) => d !== date) : [...list, date])),
  };

  return (
    <div className="grid min-h-dvh grid-cols-[248px_1fr] bg-bg text-text">
      <aside className="sticky top-0 flex h-dvh flex-col border-r border-border bg-surface">
        <Link to="/" aria-label="AarogyaHub home" className="px-5 py-5">
          <Logo onDark={false} subtitle="Doctor portal" />
        </Link>

        <nav aria-label="Doctor portal" className="flex-1 px-3 py-2">
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-small font-medium transition-colors",
                      isActive ? "bg-primary text-on-primary shadow-1" : "text-muted hover:bg-surface-muted hover:text-text",
                    )
                  }
                >
                  <link.icon className="size-4" aria-hidden />
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {user && (
          <div className="flex flex-col gap-3 border-t border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} />
              <div className="min-w-0">
                <p className="truncate text-small font-semibold">{user.name}</p>
                <p className="truncate text-caption text-muted">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <Link to="/logout" className={buttonClass("ghost", "sm")}>
                <LogOut aria-hidden />
                Log out
              </Link>
            </div>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-8">
          <p className="text-small font-medium text-muted">{formatLongDate(todayIST())}</p>
          <p className="flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-caption text-warning">
            <Info className="size-3.5" aria-hidden />
            Sample data, kept until you reload
          </p>
        </header>
        <main className="flex flex-col gap-8 px-8 py-8">
          <Outlet context={data} />
        </main>
      </div>
    </div>
  );
}
