import type { KbArticleInput } from "@/api/types";

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function checkReason(reason: string, message = "Give a reason of at least 10 characters.") {
  return reason.trim().length < 10 ? message : undefined;
}

export type KbErrors = Partial<Record<keyof KbArticleInput, string>>;

export function validateArticle(a: KbArticleInput): KbErrors {
  const errors: KbErrors = {};
  if (a.title.trim().length < 5) errors.title = "Enter a title of at least 5 characters";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.slug) || a.slug.length < 3)
    errors.slug = "Use lowercase letters, numbers and hyphens only";
  if (a.audience.length === 0) errors.audience = "Choose at least one audience";
  if (a.body_md.trim().length < 40) errors.body_md = "Write at least 40 characters";
  if (a.category === "health" && (a.reviewer?.trim().length ?? 0) < 3)
    errors.reviewer = "Health articles need a named medical reviewer";
  return errors;
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/-$/, "");
}

export function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
