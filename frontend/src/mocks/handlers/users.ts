import { http, HttpResponse } from "msw";
import type { BlockUserRequest, UserDetail } from "@/api/types";
import { db, writeAudit } from "../db";
import { API, fail, latency, matches, paginate, requireAdmin, sortItems } from "./helpers";

export const usersHandlers = [
  http.get(`${API}/admin/users`, async ({ request }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    const filtered = db.users.filter(
      (u) =>
        matches(q, u.name, u.email, u.phone, u.city) &&
        (!role || u.role === role) &&
        (!status || (status === "blocked" ? !u.is_active : u.is_active)),
    );
    const sorted = sortItems(filtered, url.searchParams.get("sort") ?? "-created_at", {
      name: (u) => u.name.replace(/^Dr\.\s*/, ""),
      created_at: (u) => u.created_at,
      last_login_at: (u) => u.last_login_at ?? "",
      role: (u) => u.role,
    });
    return HttpResponse.json(paginate(sorted, url));
  }),

  http.get(`${API}/admin/users/:id`, async ({ request, params }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const user = db.users.find((u) => u.id === params.id);
    if (!user) return fail(404, "NOT_FOUND", "We couldn't find that user.");
    const doctor = db.doctors.find((d) => d.user_id === user.id);
    const appts = db.appointments.filter((a) => a.patient.id === user.id || a.doctor.id === doctor?.id);
    const detail: UserDetail = {
      ...user,
      doctor_id: doctor?.id ?? null,
      verification_status: doctor?.verification_status ?? null,
      stats: {
        appointments: appts.length,
        completed: appts.filter((a) => a.status === "completed").length,
        cancelled: appts.filter((a) => a.status === "cancelled").length,
        no_show: appts.filter((a) => a.status === "no_show").length,
        last_appointment_at: appts.find((x) => Date.parse(x.start_time) <= Date.now())?.start_time ?? null,
      },
    };
    return HttpResponse.json(detail);
  }),

  http.patch(`${API}/admin/users/:id/block`, async ({ request, params }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const user = db.users.find((u) => u.id === params.id);
    if (!user) return fail(404, "NOT_FOUND", "We couldn't find that user.");
    const body = (await request.json()) as BlockUserRequest;
    if (user.role === "admin") return fail(403, "CANNOT_BLOCK_ADMIN", "Admin accounts can't be blocked from the console.");
    if (body.blocked && (body.reason?.trim().length ?? 0) < 10)
      return fail(422, "VALIDATION_ERROR", "Give a reason of at least 10 characters.", { field: "reason" });
    user.is_active = !body.blocked;
    user.blocked_reason = body.blocked ? body.reason!.trim() : null;
    writeAudit(g.user, {
      action: body.blocked ? "user.block" : "user.unblock",
      entity_type: "user",
      entity_id: user.id,
      metadata: { user: user.name, role: user.role, ...(body.reason ? { reason: body.reason } : {}) },
    });
    return HttpResponse.json(user);
  }),
];
