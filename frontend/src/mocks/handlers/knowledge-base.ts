import { delay, http, HttpResponse } from "msw";
import type { KbArticle, KbArticleInput } from "@/api/types";
import { db, writeAudit } from "../db";
import { chunkCount, oid } from "../seed";
import { API, fail, latency, matches, paginate, requireAdmin, sortItems } from "./helpers";

export const knowledgeBaseHandlers = [
  http.get(`${API}/admin/kb/articles`, async ({ request }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status");
    const filtered = db.kb.filter(
      (a) => matches(q, a.title, a.slug, a.body_md) && (!category || a.category === category) && (!status || a.status === status),
    );
    const sorted = sortItems(filtered, url.searchParams.get("sort") ?? "-updated_at", {
      title: (a) => a.title,
      updated_at: (a) => a.updated_at,
      category: (a) => a.category,
    });
    return HttpResponse.json(paginate(sorted, url));
  }),

  http.get(`${API}/admin/kb/articles/:id`, async ({ request, params }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const a = db.kb.find((x) => x.id === params.id);
    if (!a) return fail(404, "NOT_FOUND", "We couldn't find that article.");
    return HttpResponse.json(a);
  }),

  http.post(`${API}/admin/kb/articles`, async ({ request }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const body = (await request.json()) as KbArticleInput;
    if (db.kb.some((a) => a.slug === body.slug))
      return fail(409, "SLUG_TAKEN", "Another article already uses this slug. Change it to something unique.", { field: "slug" });
    const now = new Date().toISOString();
    const article: KbArticle = {
      id: oid(),
      ...body,
      status: "draft",
      author: { id: g.user.id, name: g.user.name },
      chunk_count: 0,
      created_at: now,
      updated_at: now,
      published_at: null,
      last_indexed_at: null,
    };
    db.kb.unshift(article);
    writeAudit(g.user, { action: "kb.create", entity_type: "kb_article", entity_id: article.id, metadata: { title: article.title } });
    return HttpResponse.json(article, { status: 201 });
  }),

  http.put(`${API}/admin/kb/articles/:id`, async ({ request, params }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const a = db.kb.find((x) => x.id === params.id);
    if (!a) return fail(404, "NOT_FOUND", "We couldn't find that article.");
    const body = (await request.json()) as KbArticleInput;
    if (db.kb.some((x) => x.slug === body.slug && x.id !== a.id))
      return fail(409, "SLUG_TAKEN", "Another article already uses this slug. Change it to something unique.", { field: "slug" });
    Object.assign(a, body, { updated_at: new Date().toISOString() });
    if (a.status === "published") {
      a.chunk_count = chunkCount(a.body_md);
      a.last_indexed_at = new Date().toISOString();
    }
    writeAudit(g.user, {
      action: "kb.update",
      entity_type: "kb_article",
      entity_id: a.id,
      metadata: { title: a.title, reindexed: a.status === "published" },
    });
    return HttpResponse.json(a);
  }),

  http.post(`${API}/admin/kb/articles/:id/publish`, async ({ request, params }) => {
    await delay(import.meta.env.MODE === "test" ? 0 : 1200);
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const a = db.kb.find((x) => x.id === params.id);
    if (!a) return fail(404, "NOT_FOUND", "We couldn't find that article.");
    if (a.category === "health" && !a.reviewer?.trim())
      return fail(422, "REVIEW_REQUIRED", "Health articles need a named medical reviewer before publishing.", { field: "reviewer" });
    const now = new Date().toISOString();
    Object.assign(a, { status: "published", published_at: now, last_indexed_at: now, chunk_count: chunkCount(a.body_md) });
    writeAudit(g.user, { action: "kb.publish", entity_type: "kb_article", entity_id: a.id, metadata: { title: a.title, chunks: a.chunk_count } });
    return HttpResponse.json(a);
  }),

  http.post(`${API}/admin/kb/articles/:id/unpublish`, async ({ request, params }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const a = db.kb.find((x) => x.id === params.id);
    if (!a) return fail(404, "NOT_FOUND", "We couldn't find that article.");
    Object.assign(a, { status: "draft", chunk_count: 0, last_indexed_at: null, updated_at: new Date().toISOString() });
    writeAudit(g.user, { action: "kb.unpublish", entity_type: "kb_article", entity_id: a.id, metadata: { title: a.title } });
    return HttpResponse.json(a);
  }),

  http.delete(`${API}/admin/kb/articles/:id`, async ({ request, params }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const i = db.kb.findIndex((x) => x.id === params.id);
    if (i < 0) return fail(404, "NOT_FOUND", "We couldn't find that article.");
    const [a] = db.kb.splice(i, 1);
    writeAudit(g.user, { action: "kb.delete", entity_type: "kb_article", entity_id: a.id, metadata: { title: a.title } });
    return new HttpResponse(null, { status: 204 });
  }),
];
