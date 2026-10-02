import { getAuditLogs } from "@/api/admin";
import type { AuditListParams, AuditLog } from "@/api/types";
import { auditVerb } from "./auditText";

/** Puts a value in quotes when it contains a comma, quote or line break (the CSV rules). */
function csvCell(value: unknown) {
  const text = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(logs: AuditLog[]) {
  const header = "time_utc,actor_id,actor_name,actor_role,action,description,entity_type,entity_id,ip,request_id,metadata";
  const lines = logs.map((l) =>
    [
      l.created_at,
      l.actor?.id,
      l.actor?.name ?? "System",
      l.actor?.role,
      l.action,
      auditVerb(l.action),
      l.entity_type,
      l.entity_id,
      l.ip,
      l.request_id,
      l.metadata,
    ]
      .map(csvCell)
      .join(","),
  );
  return [header, ...lines].join("\r\n");
}

/** Loads every page that matches the filters, then downloads them as a .csv file. Returns the count. */
export async function exportAuditCsv(filters: AuditListParams) {
  const logs: AuditLog[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await getAuditLogs({ ...filters, page, page_size: 100 });
    logs.push(...res.items);
    if (logs.length >= res.total || res.items.length === 0) break;
  }

  // a "byte order mark" at the start makes Excel read the file as UTF-8 (for ₹ and Indian names)
  const BOM = "﻿";
  const file = new Blob([BOM + toCsv(logs)], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = `aarogyahub-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  return logs.length;
}
