import type { KbArticleInput } from "@/api/types";

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Reasons (reject, suspend, block, override) must be at least 10 characters. */
export function checkReason(reason: string, message = "Give a reason of at least 10 characters.") {
  return reason.trim().length < 10 ? message : undefined;
}

export type KbErrors = Partial<Record<keyof KbArticleInput, string>>;

/** Checks a knowledge base article. Returns an error message for each field that is wrong. */
export function validateArticle(a: KbArticleInput): KbErrors {
  const errors: KbErrors = {};
  if (a.title.trim().length < 5) errors.title = "Enter a title of at least 5 characters";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.slug) || a.slug.length < 3)
    errors.slug = "Use lowercase letters, numbers and hyphens only";
  if (a.audience.length === 0) errors.audience = "Choose at least one audience";
  if (a.body_md.trim().length < 40) errors.body_md = "Write at least 40 characters";
  // health content needs a named medical reviewer (backend doc section 8)
  if (a.category === "health" && (a.reviewer?.trim().length ?? 0) < 3)
    errors.reviewer = "Health articles need a named medical reviewer";
  return errors;
}

/** "Heat stroke: warning signs" -> "heat-stroke-warning-signs" */
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
