import { ArrowLeft, CircleDot, Database, HeartPulse, Trash2, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router";
import rehypeSanitize from "rehype-sanitize";
import { toast } from "sonner";
import { createArticle, deleteArticle, publishArticle, unpublishArticle, updateArticle } from "@/api/admin";
import type { ApiError } from "@/api/client";
import type { Audience, KbArticle, KbArticleInput, KbCategory } from "@/api/types";
import { ArticleStatusBadge, CATEGORY_LABELS, ROLE_LABELS } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Field } from "@/components/ui/Field";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs } from "@/components/ui/Tabs";
import { useApi } from "@/hooks/useApi";
import { formatDateTime, timeAgo } from "@/lib/dates";
import { plural } from "@/lib/format";
import { type KbErrors, slugify, validateArticle, wordCount } from "@/lib/validators";

const EMPTY_ARTICLE: KbArticleInput = { title: "", slug: "", category: "faq", audience: ["patient"], body_md: "", reviewer: null };
const AUDIENCES: Audience[] = ["visitor", "patient", "doctor"];

function formFields(a: KbArticle): KbArticleInput {
  return { title: a.title, slug: a.slug, category: a.category, audience: a.audience, body_md: a.body_md, reviewer: a.reviewer };
}

export default function KbEditorPage() {
  const { articleId } = useParams();
  const { data, error, reload } = useApi<KbArticle>(articleId ? `/admin/kb/articles/${articleId}` : null);

  if (!articleId) return <ArticleForm />;
  if (error) {
    return (
      <Card>
        <ErrorMessage error={error} onRetry={reload} />
      </Card>
    );
  }
  if (!data) return <Spinner />;
  return <ArticleForm key={data.id} article={data} />;
}

function ArticleForm({ article: loaded }: { article?: KbArticle }) {
  const navigate = useNavigate();
  const [article, setArticle] = useState(loaded);
  const [values, setValues] = useState<KbArticleInput>(loaded ? formFields(loaded) : EMPTY_ARTICLE);
  const [slugEdited, setSlugEdited] = useState(!!loaded);
  const [errors, setErrors] = useState<KbErrors>({});
  const [busy, setBusy] = useState<"save" | "publish" | "unpublish" | null>(null);
  const [tab, setTab] = useState("write");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const savedValues = article ? formFields(article) : EMPTY_ARTICLE;
  const unsaved = (Object.keys(EMPTY_ARTICLE) as (keyof KbArticleInput)[]).some(
    (key) => JSON.stringify(values[key]) !== JSON.stringify(savedValues[key]),
  );
  const published = article?.status === "published";

  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  function change<K extends keyof KbArticleInput>(key: K, value: KbArticleInput[K]) {
    const next = { ...values, [key]: value };
    if (key === "title" && !slugEdited) next.slug = slugify(value as string);
    setValues(next);
  }

  function showError(err: unknown) {
    const e = err as ApiError;
    if (e.code === "SLUG_TAKEN") setErrors({ slug: e.message });
    else if (e.code === "REVIEW_REQUIRED") setErrors({ reviewer: e.message });
    else toast.error(e.message);
  }

  async function save(andPublish: boolean) {
    const input = { ...values, reviewer: values.reviewer?.trim() || null };
    const problems = validateArticle(input);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setBusy(andPublish ? "publish" : "save");
    try {
      let saved = article;
      if (!saved) saved = await createArticle(input);
      else if (unsaved) saved = await updateArticle(saved.id, input);
      if (andPublish) saved = await publishArticle(saved.id);

      setArticle(saved);
      setValues(input);
      if (andPublish) toast.success(`Published. The assistant can answer from "${saved.title}" now.`);
      else toast.success(saved.status === "published" ? "Saved. The assistant now uses the new version." : "Saved.");
      if (!article) navigate(`/admin/kb/${saved.id}`, { replace: true });
    } catch (err) {
      showError(err);
    } finally {
      setBusy(null);
    }
  }

  async function unpublish() {
    if (!article) return;
    setBusy("unpublish");
    try {
      setArticle(await unpublishArticle(article.id));
      toast.success("Unpublished. Removed from the assistant's search.");
    } catch (err) {
      showError(err);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!article) return;
    try {
      await deleteArticle(article.id);
      toast.success(`Deleted "${article.title}".`);
      navigate("/admin/kb", { replace: true });
    } catch (err) {
      showError(err);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link to="/admin/kb" className="inline-flex w-fit items-center gap-1.5 text-small font-medium text-muted hover:text-text">
          <ArrowLeft className="size-4" aria-hidden />
          Knowledge base
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h2 max-sm:text-h3">{article ? "Edit article" : "New article"}</h1>
          {article && <ArticleStatusBadge status={article.status} />}
          {unsaved && (
            <span role="status" className="inline-flex items-center gap-1.5 text-small text-warning">
              <CircleDot className="size-3.5" aria-hidden />
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        <Card className="flex flex-col gap-5 p-5">
          <Field label="Title" id="kb-title" error={errors.title}>
            <Input
              placeholder="For example: Joining a video consultation"
              className="h-12 text-body-lg font-semibold"
              value={values.title}
              onChange={(e) => change("title", e.target.value)}
            />
          </Field>
          <Field label="Slug" id="kb-slug" error={errors.slug} hint={`Used in links: /health/${values.slug || "…"}`}>
            <Input
              className="font-mono text-small"
              autoCapitalize="none"
              spellCheck={false}
              value={values.slug}
              onChange={(e) => {
                setSlugEdited(true);
                change("slug", e.target.value);
              }}
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <label htmlFor="kb-body" className="text-small font-semibold text-text">
                Content
              </label>
              <Tabs
                label="Content view"
                value={tab}
                onChange={setTab}
                tabs={[
                  { value: "write", label: "Write" },
                  { value: "preview", label: "Preview" },
                ]}
              />
            </div>
            {tab === "write" ? (
              <Textarea
                id="kb-body"
                rows={18}
                className="min-h-[420px] resize-y leading-7"
                aria-invalid={errors.body_md ? true : undefined}
                value={values.body_md}
                onChange={(e) => change("body_md", e.target.value)}
              />
            ) : (
              <div className="min-h-[420px] rounded-md border border-border bg-bg px-5 py-4">
                {values.body_md.trim() ? (
                  <article className="prose prose-ah max-w-[65ch]">
                    <Markdown rehypePlugins={[rehypeSanitize]}>{values.body_md}</Markdown>
                  </article>
                ) : (
                  <p className="text-small text-subtle">Nothing to preview yet.</p>
                )}
              </div>
            )}
            {errors.body_md ? (
              <p role="alert" className="text-small text-danger">
                {errors.body_md}
              </p>
            ) : (
              <p className="flex justify-between gap-4 text-small text-subtle">
                <span>Markdown. Keep answers short and plain; never give doses or diagnoses.</span>
                <span className="shrink-0 tabular">{plural(wordCount(values.body_md), "word")}</span>
              </p>
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <Card className="flex flex-col gap-5 p-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="kb-category" className="text-small font-semibold text-text">
                Category
              </label>
              <Select
                id="kb-category"
                value={values.category}
                onChange={(value) => change("category", value as KbCategory)}
                options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>

            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-1 text-small font-semibold text-text">Who can the assistant show this to?</legend>
              {AUDIENCES.map((audience) => (
                <label key={audience} className="flex cursor-pointer items-center gap-2.5 text-small text-text">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={values.audience.includes(audience)}
                    onChange={(e) =>
                      change(
                        "audience",
                        e.target.checked ? [...values.audience, audience] : values.audience.filter((x) => x !== audience),
                      )
                    }
                  />
                  {ROLE_LABELS[audience]}
                </label>
              ))}
              {errors.audience && (
                <p role="alert" className="text-small text-danger">
                  {errors.audience}
                </p>
              )}
            </fieldset>

            {values.category === "health" && (
              <p className="flex gap-2 rounded-md bg-info-soft p-3 text-caption text-info">
                <HeartPulse className="size-4 shrink-0" aria-hidden />
                Health content must be reviewed by a named doctor. The assistant adds a disclaimer to these answers.
              </p>
            )}
            <Field
              label="Medical reviewer"
              id="kb-reviewer"
              optional={values.category !== "health"}
              hint="Required for health articles: name and qualification."
              error={errors.reviewer}
            >
              <Input
                placeholder="Dr. Name, MD (Medicine)"
                value={values.reviewer ?? ""}
                onChange={(e) => change("reviewer", e.target.value)}
              />
            </Field>
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-start gap-3 text-small">
              <Database className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
              <div>
                <p className="font-semibold text-text">Search index</p>
                {published && article ? (
                  <p className="text-muted">
                    {plural(article.chunk_count, "chunk")} indexed
                    {article.last_indexed_at && (
                      <span title={formatDateTime(article.last_indexed_at)}> · Indexed {timeAgo(article.last_indexed_at)}</span>
                    )}
                  </p>
                ) : (
                  <p className="text-muted">Not in the assistant's search until published.</p>
                )}
                {article && <p className="mt-1 text-caption text-subtle">Author: {article.author.name}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {published ? (
                <Button type="submit" loading={busy === "save"} disabled={!!busy || !unsaved}>
                  Save and re-index
                </Button>
              ) : (
                <>
                  <Button onClick={() => save(true)} loading={busy === "publish"} disabled={!!busy}>
                    {busy === "publish" ? "Indexing…" : "Publish"}
                  </Button>
                  <Button type="submit" variant="outline" loading={busy === "save"} disabled={!!busy || (!!article && !unsaved)}>
                    Save draft
                  </Button>
                </>
              )}
              {published && (
                <Button variant="ghost" onClick={unpublish} loading={busy === "unpublish"} disabled={!!busy}>
                  <Undo2 aria-hidden />
                  Unpublish
                </Button>
              )}
              {article && (
                <Button variant="danger-ghost" onClick={() => setConfirmDelete(true)} disabled={!!busy}>
                  <Trash2 aria-hidden />
                  Delete article
                </Button>
              )}
            </div>
          </Card>
        </div>
      </form>

      {article && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={`Delete "${article.title}"?`}
          body="It's removed from the assistant's search straight away. This can't be undone."
          confirmLabel="Delete article"
          onConfirm={remove}
        />
      )}
    </div>
  );
}
