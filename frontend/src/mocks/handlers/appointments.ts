// Mock appointments: list, details and admin overrides (cancel, no-show, completed).
import { http, HttpResponse } from "msw";
import type { Appointment, AppointmentOverride } from "@/api/types";
import { db, writeAudit } from "../db";
import { API, fail, istDate, latency, matches, paginate, requireAdmin, sortItems } from "./helpers";

export const appointmentsHandlers = [
  http.get(`${API}/admin/appointments`, async ({ request }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const status = url.searchParams.get("status");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const filtered = db.appointments.filter((a) => {
      const day = istDate(Date.parse(a.start_time));
      return (
        matches(q, a.id, a.patient.name, a.doctor.name, a.doctor.specialization) &&
        (!status || a.status === status) &&
        (!from || day >= from) &&
        (!to || day <= to)
      );
    });
    const sorted = sortItems(filtered, url.searchParams.get("sort") ?? "-start_time", {
      start_time: (a) => a.start_time,
      fee_snapshot: (a) => a.fee_snapshot,
      slot_duration_min: (a) => a.slot_duration_min,
      status: (a) => a.status,
    });
    return HttpResponse.json(paginate(sorted, url));
  }),

  http.get(`${API}/admin/appointments/:id`, async ({ request, params }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const a = db.appointments.find((x) => x.id === params.id);
    if (!a) return fail(404, "NOT_FOUND", "We couldn't find that appointment.");
    return HttpResponse.json(a);
  }),

  http.patch(`${API}/admin/appointments/:id`, async ({ request, params }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const a = db.appointments.find((x) => x.id === params.id);
    if (!a) return fail(404, "NOT_FOUND", "We couldn't find that appointment.");
    const body = (await request.json()) as AppointmentOverride;
    if ((body.reason?.trim().length ?? 0) < 10)
      return fail(422, "VALIDATION_ERROR", "Give a reason of at least 10 characters.", { field: "reason" });
    const allowed: Record<AppointmentOverride["status"], Appointment["status"][]> = {
      cancelled: ["scheduled", "in_progress"],
      completed: ["in_progress", "no_show"],
      no_show: ["scheduled", "in_progress"],
    };
    if (!allowed[body.status]?.includes(a.status))
      return fail(409, "INVALID_TRANSITION", `A ${a.status.replace("_", " ")} appointment can't be marked ${body.status.replace("_", " ")}.`);
    if (body.status === "no_show" && Date.parse(a.start_time) > Date.now())
      return fail(409, "INVALID_TRANSITION", "No-show can only be recorded after the start time.");
    const from = a.status;
    a.status = body.status;
    if (body.status === "cancelled") {
      a.cancelled_by = "admin";
      a.cancel_reason = body.reason.trim();
    }
    a.history.push({ at: new Date().toISOString(), status: body.status, by: `${g.user.name} (admin)`, note: body.reason.trim() });
    writeAudit(g.user, {
      action: "appointment.override",
      entity_type: "appointment",
      entity_id: a.id,
      metadata: { from, to: body.status, reason: body.reason.trim(), patient: a.patient.name, doctor: a.doctor.name },
    });
    return HttpResponse.json(a);
  }),
];
