import { Info, LogOut } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";

export interface PortalLink {
  to: string;
  label: string;
  end?: boolean;
}

interface PortalLayoutProps {
  title: string;
  links: PortalLink[];
  context: unknown;
}

export function PortalLayout({ title, links, context }: PortalLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-dvh bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
          <Link to="/" aria-label="AarogyaHub home">
            <Logo onDark={false} subtitle={title} />
          </Link>

          <nav aria-label={title} className="flex-1">
            <ul className="flex items-center gap-1">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn(
                        "rounded-md px-3 py-2 text-small font-medium",
                        isActive ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-muted hover:text-text",
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user && (
              <span className="flex items-center gap-2 text-small font-medium">
                <Avatar name={user.name} size="sm" />
                {user.name}
              </span>
            )}
            <Link to="/logout" className={buttonClass("ghost", "sm")}>
              <LogOut aria-hidden />
              Log out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <p className="flex items-center gap-2 rounded-md bg-accent-soft px-4 py-2.5 text-small text-warning">
          <Info className="size-4 shrink-0" aria-hidden />
          This portal shows sample data. Changes are kept only until you reload the page.
        </p>
        <Outlet context={context} />
      </main>
    </div>
  );
}
