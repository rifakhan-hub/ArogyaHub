import { Link } from "react-router";
import { buttonClass } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const LINKS = [
  { href: "#doctors", label: "Find a doctor" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Why AarogyaHub" },
  { href: "#for-doctors", label: "For doctors" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-8">
        <a href="#top" aria-label="AarogyaHub home">
          <Logo onDark={false} subtitle="Online doctor consultations" />
        </a>

        <nav aria-label="Main" className="flex-1">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="rounded-md px-3 py-2 text-small font-medium text-muted hover:bg-surface-muted hover:text-text">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className={buttonClass("ghost", "sm")}>
            Log in
          </Link>
          <Link to="/register" className={buttonClass("outline", "sm")}>
            Sign up
          </Link>
          <a href="#doctors" className={buttonClass("primary", "sm")}>
            Book a consultation
          </a>
        </div>
      </div>
    </header>
  );
}
