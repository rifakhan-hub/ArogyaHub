import { http, HttpResponse } from "msw";
import type { AuditLog } from "@/api/types";
import { db } from "../db";
import { API, istDate, latency, matches, paginate, requireAdmin, sortItems } from "./helpers";

export const auditLogHandlers = [
  http.get(`${API}/admin/audit-logs`, async ({ request }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const action = url.searchParams.get("action");
    const entity = url.searchParams.get("entity_type");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const filtered: AuditLog[] = db.audit.filter((l) => {
      const day = istDate(Date.parse(l.created_at));
      return (
        matches(q, l.actor?.name, l.entity_id, l.request_id, l.ip, JSON.stringify(l.metadata)) &&
        (!action || l.action === action || l.action.startsWith(`${action}.`)) &&
        (!entity || l.entity_type === entity) &&
        (!from || day >= from) &&
        (!to || day <= to)
      );
    });
    const sorted = sortItems(filtered, url.searchParams.get("sort") ?? "-created_at", {
      created_at: (l) => l.created_at,
      action: (l) => l.action,
    });
    return HttpResponse.json(paginate(sorted, url));
  }),
];
