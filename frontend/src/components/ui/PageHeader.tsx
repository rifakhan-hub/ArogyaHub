interface PageHeaderProps {
  title: string;
  description?: string;
  /** Shown next to the title, e.g. a count badge. */
  extra?: React.ReactNode;
  /** Buttons on the right, e.g. "New article". */
  actions?: React.ReactNode;
}

/** The title block at the top of every page. */
export function PageHeader({ title, description, extra, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0 max-w-[65ch]">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h2 text-text max-sm:text-h3">{title}</h1>
          {extra}
        </div>
        {description && <p className="mt-1.5 text-body text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
