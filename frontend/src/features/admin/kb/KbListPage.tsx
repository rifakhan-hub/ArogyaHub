import { BookOpenText, Plus, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import type { KbArticle, Paginated } from "@/api/types";
import { ArticleStatusBadge, CATEGORY_LABELS, ROLE_LABELS } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBox, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { type Column, Table } from "@/components/ui/Table";
import { useApi } from "@/hooks/useApi";
import { useDebounced } from "@/hooks/useDebounced";
import { timeAgo } from "@/lib/dates";

const PAGE_SIZE = 20;

export default function KbListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useApi<Paginated<KbArticle>>("/admin/kb/articles", {
    q: useDebounced(search),
    category,
    status,
    page,
    page_size: PAGE_SIZE,
  });

  function changeFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  const columns: Column<KbArticle>[] = [
    {
      header: "Title",
      cell: (a) => (
        <div className="flex min-w-0 max-w-sm flex-col">
          <Link to={`/admin/kb/${a.id}`} className="truncate font-semibold text-text hover:underline">
            {a.title}
          </Link>
          <span className="truncate font-mono text-caption text-subtle">/{a.slug}</span>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (a) => (
        <span className="inline-flex h-6 items-center rounded-sm border border-border px-2 text-caption font-medium text-muted">
          {CATEGORY_LABELS[a.category]}
        </span>
      ),
    },
    {
      header: "Audience",
      className: "hidden lg:table-cell",
      cell: (a) => <span className="text-muted">{a.audience.map((x) => ROLE_LABELS[x]).join(", ")}</span>,
    },
    {
      header: "Chunks",
      className: "hidden md:table-cell",
      cell: (a) => (a.status === "published" ? a.chunk_count : <span className="text-caption text-subtle">Not indexed</span>),
    },
    {
      header: "Updated",
      className: "hidden sm:table-cell",
      cell: (a) => (
        <div className="flex flex-col">
          <span className="text-muted">{timeAgo(a.updated_at)}</span>
          <span className="text-caption text-subtle">{a.author.name}</span>
        </div>
      ),
    },
    { header: "Status", cell: (a) => <ArticleStatusBadge status={a.status} /> },
  ];

  const filtered = search || category || status;
  const newArticleLink = (
    <Link to="/admin/kb/new" className={buttonClass()}>
      <Plus aria-hidden />
      New article
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Knowledge base"
        description="What the assistant answers from. Only published articles are searched."
        actions={newArticleLink}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={search} onChange={changeFilter(setSearch)} placeholder="Search titles and content" />
        <Select
          aria-label="Category"
          value={category}
          onChange={changeFilter(setCategory)}
          options={[{ value: "", label: "All categories" }, ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))]}
        />
        <Select
          aria-label="Status"
          value={status}
          onChange={changeFilter(setStatus)}
          options={[
            { value: "", label: "Any status" },
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
          ]}
        />
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setCategory("");
              setStatus("");
              setPage(1);
            }}
          >
            <X aria-hidden />
            Clear filters
          </Button>
        )}
      </div>

      <Card>
        <Table
          caption="Knowledge base articles"
          columns={columns}
          rows={data?.items}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(a) => navigate(`/admin/kb/${a.id}`)}
          empty={
            filtered ? (
              <EmptyState icon={BookOpenText} title="No articles match these filters." />
            ) : (
              <EmptyState
                icon={BookOpenText}
                title="No articles yet. Write the first FAQ so the assistant has something to answer from."
                action={newArticleLink}
              />
            )
          }
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
      </Card>
    </div>
  );
}
