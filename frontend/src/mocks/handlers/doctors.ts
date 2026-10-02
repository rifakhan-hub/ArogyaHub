// Mock doctor verification: the queue, one doctor, their documents and approve / reject / suspend.
import { http, HttpResponse } from "msw";
import type { VerificationStatus, VerifyRequest } from "@/api/types";
import { db, writeAudit } from "../db";
import { API, fail, latency, matches, MIN, paginate, requireAdmin, sortItems } from "./helpers";

export const doctorsHandlers = [
  http.get(`${API}/admin/doctors`, async ({ request }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const status = url.searchParams.get("status") as VerificationStatus | null;
    const searched = db.doctors.filter((d) =>
      matches(q, d.name, d.license_number, d.council, d.specialization, d.email, d.city),
    );
    const counts = { pending: 0, verified: 0, rejected: 0, suspended: 0 } as Record<VerificationStatus, number>;
    searched.forEach((d) => counts[d.verification_status]++);
    const filtered = status ? searched.filter((d) => d.verification_status === status) : searched;
    const sorted = sortItems(filtered, url.searchParams.get("sort") ?? "submitted_at", {
      submitted_at: (d) => d.submitted_at,
      name: (d) => d.name.replace(/^Dr\.\s*/, ""),
      council: (d) => d.council,
      verification_status: (d) => d.verification_status,
      experience_years: (d) => d.experience_years,
    });
    return HttpResponse.json({ ...paginate(sorted, url), counts });
  }),

  http.get(`${API}/admin/doctors/:id`, async ({ request, params }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const doctor = db.doctors.find((d) => d.id === params.id);
    if (!doctor) return fail(404, "NOT_FOUND", "We couldn't find that doctor.");
    return HttpResponse.json(doctor);
  }),

  http.get(`${API}/admin/doctors/:id/documents/:docId/view`, async ({ request, params }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const doctor = db.doctors.find((d) => d.id === params.id);
    const doc = doctor?.documents.find((d) => d.id === params.docId);
    const url = doc && db.documentUrls.get(doc.id);
    if (!doctor || !doc || !url) return fail(404, "NOT_FOUND", "We couldn't find that document.");
    writeAudit(g.user, {
      action: "doctor.document_view",
      entity_type: "doctor",
      entity_id: doctor.id,
      metadata: { doctor: doctor.name, document: doc.file_name },
    });
    return HttpResponse.json({ url, mime: "image/svg+xml", expires_at: new Date(Date.now() + 5 * MIN).toISOString() });
  }),

  http.post(`${API}/admin/doctors/:id/verify`, async ({ request, params }) => {
    await latency();
    const g = requireAdmin(request);
    if (g.error) return g.error;
    const doctor = db.doctors.find((d) => d.id === params.id);
    if (!doctor) return fail(404, "NOT_FOUND", "We couldn't find that doctor.");
    const body = (await request.json()) as VerifyRequest;
    const reason = body.reason?.trim() ?? "";

    const allowed: Record<VerifyRequest["action"], VerificationStatus[]> = {
      approve: ["pending", "suspended"],
      reject: ["pending"],
      suspend: ["verified"],
    };
    if (!allowed[body.action]?.includes(doctor.verification_status))
      return fail(409, "INVALID_TRANSITION", `A ${doctor.verification_status} doctor can't be moved with "${body.action}".`);
    if ((body.action === "reject" || body.action === "suspend") && reason.length < 10)
      return fail(422, "VALIDATION_ERROR", "Give a reason of at least 10 characters. It is sent to the doctor.", {
        field: "reason",
      });

    const from = doctor.verification_status;
    const next: Record<VerifyRequest["action"], VerificationStatus> = {
      approve: "verified",
      reject: "rejected",
      suspend: "suspended",
    };
    doctor.verification_status = next[body.action];
    doctor.is_active = body.action === "approve";
    doctor.rejection_reason = body.action === "approve" ? null : reason;
    if (body.action === "approve") {
      doctor.verified_by = { id: g.user.id, name: g.user.name };
      doctor.verified_at = new Date().toISOString();
    }
    writeAudit(g.user, {
      action: `doctor.${body.action}`,
      entity_type: "doctor",
      entity_id: doctor.id,
      metadata: { doctor: doctor.name, from, to: doctor.verification_status, ...(reason ? { reason } : {}) },
    });
    return HttpResponse.json(doctor);
  }),
];
