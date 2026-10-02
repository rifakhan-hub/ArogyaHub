// Shared bits for the mock API: error responses, the admin check, paging, sorting and search.
import { delay, HttpResponse } from "msw";
import type { User } from "@/api/types";
import { userFromToken } from "../db";
import { requestId } from "../seed";

export const API = "*/api/v1";
export const MIN = 60_000;
export const DAY = 24 * 60 * MIN;
const IST_OFFSET = 330 * MIN;
export const istDate = (ms: number) => new Date(ms + IST_OFFSET).toISOString().slice(0, 10);

export function fail(status: number, code: string, message: string, details?: unknown) {
  return HttpResponse.json(
    { error: { code, message, request_id: requestId(), details } },
    { status },
  );
}

type Guard = { user: User; error?: never } | { user?: never; error: Response };

export function requireAdmin(request: Request): Guard {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const user = userFromToken(token);
  if (!user) return { error: fail(401, "UNAUTHENTICATED", "Your session has ended. Log in again.") };
  if (user.role !== "admin" || !user.is_active)
    return { error: fail(403, "FORBIDDEN", "Only admins can use the admin console.") };
  return { user };
}

export function paginate<T>(items: T[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("page_size") ?? 20)));
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  };
}

export function sortItems<T>(items: T[], sort: string | null, fields: Record<string, (x: T) => string | number>) {
  if (!sort) return items;
  const desc = sort.startsWith("-");
  const get = fields[sort.replace(/^-/, "")];
  if (!get) return items;
  return [...items].sort((a, b) => {
    const va = get(a);
    const vb = get(b);
    const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
    return desc ? -cmp : cmp;
  });
}

export const matches = (q: string | null, ...fields: (string | null | undefined)[]) =>
  !q || fields.some((f) => f?.toLowerCase().includes(q.toLowerCase()));

export const latency = () => delay(import.meta.env.MODE === "test" ? 0 : 250 + Math.random() * 350);

