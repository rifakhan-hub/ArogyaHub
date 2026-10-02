import { Link } from "react-router";
import { Logo } from "@/components/ui/Logo";

const LINKS = [
  { href: "#doctors", label: "Find a doctor" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-doctors", label: "For doctors" },
  { href: "#faq", label: "Questions" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-8 py-10">
        <Logo onDark={false} subtitle="Online doctor consultations" />
        <nav aria-label="Footer">
          <ul className="flex gap-6 text-small text-muted">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-text">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl justify-between px-8 py-4 text-caption text-subtle">
          <p>© {new Date().getFullYear()} AarogyaHub. Made in India.</p>
          <Link to="/login" className="hover:text-text">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
