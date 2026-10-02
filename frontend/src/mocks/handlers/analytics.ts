// Mock numbers and charts for the overview page, computed from the sample data.
import { http, HttpResponse } from "msw";
import type { Analytics, AppointmentStatus } from "@/api/types";
import { db } from "../db";
import { API, DAY, istDate, latency, MIN, requireAdmin } from "./helpers";

function computeAnalytics(): Analytics {
  const now = Date.now();
  const today = istDate(now);
  const lastWeekSameDay = istDate(now - 7 * DAY);
  const countOn = (day: string) =>
    db.appointments.filter((a) => istDate(Date.parse(a.start_time)) === day && a.status !== "cancelled").length;

  const verified = db.doctors.filter((d) => d.verification_status === "verified");
  const approvedThisWeek = verified.filter((d) => d.verified_at && Date.parse(d.verified_at) > now - 7 * DAY).length;
  const pending = db.doctors.filter((d) => d.verification_status === "pending");
  const oldestPending = pending.reduce((min, d) => Math.min(min, Date.parse(d.submitted_at)), now);

  const created = (from: number, to: number) =>
    db.users.filter((u) => Date.parse(u.created_at) > from && Date.parse(u.created_at) <= to && u.role !== "admin");

  const perDay: Analytics["consultations_per_day"] = [];
  for (let i = 29; i >= 0; i--) {
    const day = istDate(now - i * DAY);
    const onDay = db.appointments.filter((a) => istDate(Date.parse(a.start_time)) === day);
    perDay.push({
      date: day,
      completed: onDay.filter((a) => a.status === "completed" || a.status === "in_progress").length,
      cancelled: onDay.filter((a) => a.status === "cancelled").length,
      no_show: onDay.filter((a) => a.status === "no_show").length,
    });
  }

  const perWeek: Analytics["new_users_per_week"] = [];
  for (let w = 11; w >= 0; w--) {
    const to = now - w * 7 * DAY;
    const users = created(to - 7 * DAY, to);
    perWeek.push({
      week: istDate(to - 6 * DAY),
      patient: users.filter((u) => u.role === "patient").length,
      doctor: users.filter((u) => u.role === "doctor").length,
    });
  }

  const last30 = db.appointments.filter((a) => Date.parse(a.start_time) > now - 30 * DAY && Date.parse(a.start_time) <= now + 7 * DAY);
  const status = { scheduled: 0, in_progress: 0, completed: 0, cancelled: 0, no_show: 0 } as Record<AppointmentStatus, number>;
  last30.forEach((a) => status[a.status]++);

  const bySpec = new Map<string, number>();
  last30
    .filter((a) => a.status === "completed")
    .forEach((a) => bySpec.set(a.doctor.specialization, (bySpec.get(a.doctor.specialization) ?? 0) + 1));

  return {
    kpis: {
      consultations_today: countOn(today),
      consultations_today_prev: countOn(lastWeekSameDay),
      live_now: db.appointments.filter((a) => a.status === "in_progress").length,
      active_doctors: verified.length,
      active_doctors_prev: verified.length - approvedThisWeek,
      pending_verifications: pending.length,
      oldest_pending_hours: pending.length ? Math.round((now - oldestPending) / (60 * MIN)) : 0,
      new_users_7d: created(now - 7 * DAY, now).length,
      new_users_7d_prev: created(now - 14 * DAY, now - 7 * DAY).length,
    },
    consultations_per_day: perDay,
    new_users_per_week: perWeek,
    appointment_status: status,
    top_specializations: [...bySpec.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}

export const analyticsHandlers = [
  http.get(`${API}/admin/analytics`, async ({ request }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    return HttpResponse.json(computeAnalytics());
  }),
];
