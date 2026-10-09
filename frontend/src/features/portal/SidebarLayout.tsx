import { Info, LogOut, type LucideIcon } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { formatLongDate } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { todayIST } from "@/lib/dates";

export interface SidebarLink {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface SidebarLayoutProps {
  title: string;
  links: SidebarLink[];
  context: unknown;
}

export function SidebarLayout({ title, links, context }: SidebarLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="grid min-h-dvh grid-cols-[248px_1fr] bg-bg text-text">
      <aside className="sticky top-0 flex h-dvh flex-col border-r border-border bg-surface">
        <Link to="/" aria-label="AarogyaHub home" className="px-5 py-5">
          <Logo onDark={false} subtitle={title} />
        </Link>

        <nav aria-label={title} className="flex-1 px-3 py-2">
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
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
          <Outlet context={context} />
        </main>
      </div>
    </div>
  );
}
