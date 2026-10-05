import { LogOut, Menu } from "lucide-react";
import { Suspense, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>

      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-nav-border lg:block">
        <Sidebar />
      </aside>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} label="Main navigation" position="left">
        {menuOpen && <Sidebar onNavigate={() => setMenuOpen(false)} />}
      </Modal>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-bg/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="size-5" aria-hidden />
          </Button>
          <Link to="/admin" className="lg:hidden" aria-label="AarogyaHub admin, overview">
            <LogoMark className="size-7" />
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <span className="flex items-center gap-2 pl-1">
                <Avatar name={user.name} size="sm" />
                <span className="hidden text-small font-medium text-text md:inline">{user.name}</span>
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogOut}>
              <LogOut aria-hidden />
              <span className="max-sm:sr-only">Log out</span>
            </Button>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
