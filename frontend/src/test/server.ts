import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type {
  Appointment,
  AvailabilityBlock,
  ConsultationReport,
  Doctor,
  DoctorDocument,
  Patient,
  Report,
  Role,
  User,
} from "@/api/types";

export const PASSWORD = "test-password-1";
const API = "*/api/v1";

function makeUser(id: string, name: string, email: string, role: Role): User {
  return {
    id,
    name,
    email,
    phone: null,
    city: "Ludhiana",
    role,
    is_active: true,
    is_email_verified: true,
    blocked_reason: null,
    created_at: "2026-09-01T05:00:00Z",
    last_login_at: null,
  };
}

function makeDoctor(id: string, user: User, status: Doctor["verification_status"]): Doctor {
  return {
    id,
    user_id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    is_active: true,
    specialization: "Dermatology",
    license_number: `PMC-${id}000`,
    council: "Punjab Medical Council",
    experience_years: 8,
    consultation_fee: 500,
    qualifications: "MBBS, MD",
    bio: null,
    verification_status: status,
    rejection_reason: null,
    submitted_at: "2026-10-01T05:00:00Z",
    reviewed_at: status === "pending" ? null : "2026-10-02T05:00:00Z",
  };
}

export let users: User[] = [];
export let doctors: Doctor[] = [];
export let health: Record<string, Pick<Patient, "date_of_birth" | "gender" | "blood_group" | "allergies">> = {};
export let appointments: Appointment[] = [];
export let blocks: AvailabilityBlock[] = [];
export let reports: Report[] = [];
export let documents: DoctorDocument[] = [];
export let consultationReports: Record<string, ConsultationReport> = {};
let sessionUserId: string | null = null;
let nextId = 100;

const MINUTE = 60_000;
const at = (minutesFromNow: number) => new Date(Date.now() + minutesFromNow * MINUTE).toISOString();

function makeAppointment(id: string, minutesFromNow: number, status: Appointment["status"], patient = "2"): Appointment {
  return {
    id,
    doctor_id: "10",
    doctor_name: "Dr. Anjali Mehta",
    specialization: "Dermatology",
    patient_id: patient,
    patient_name: patient === "2" ? "Priya Sharma" : "Rahul Verma",
    start_time: at(minutesFromNow),
    end_time: at(minutesFromNow + 30),
    status,
    reason: "Skin rash",
    fee: 500,
    cancel_reason: null,
    created_at: at(-60 * 24 * 7),
  };
}

export function resetData() {
  users = [
    makeUser("1", "Admin", "admin@aarogyahub.in", "admin"),
    makeUser("2", "Priya Sharma", "priya@example.com", "patient"),
    makeUser("3", "Rahul Verma", "rahul@example.com", "patient"),
    makeUser("4", "Dr. Anjali Mehta", "mehta@example.com", "doctor"),
    makeUser("5", "Dr. Ravi Kapoor", "kapoor@example.com", "doctor"),
  ];
  doctors = [makeDoctor("10", users[3], "verified"), makeDoctor("11", users[4], "pending")];
  health = { "2": { date_of_birth: "1994-05-17", gender: "female", blood_group: "B+", allergies: "Penicillin" } };
  appointments = [
    makeAppointment("20", 60 * 24, "scheduled"),
    makeAppointment("21", -5, "scheduled", "3"),
    makeAppointment("22", -60 * 24 * 5, "completed"),
  ];
  consultationReports = {
    "22": {
      id: "1",
      consultation_id: "1",
      symptoms: "Itchy rash",
      diagnosis: "Contact dermatitis",
      prescription: "Cetirizine 10 mg",
      advice: null,
      follow_up_date: null,
      updated_at: at(-60 * 24 * 5),
    },
  };
  blocks = [{ id: "30", day_of_week: 0, start_time: "09:00:00", end_time: "12:00:00", slot_minutes: 15 }];
  reports = [
    {
      id: "40",
      title: "Blood test - CBC",
      report_type: "pdf",
      file_name: "cbc.pdf",
      content_type: "application/pdf",
      size: 240_000,
      uploaded_at: at(-60 * 24 * 3),
      shared_with: [{ doctor_id: "10", doctor_name: "Dr. Anjali Mehta", shared_at: at(-60 * 24 * 2) }],
    },
  ];
  documents = [];
  sessionUserId = null;
}

export function startSession(role: Role) {
  const user = users.find((u) => u.role === role)!;
  sessionUserId = user.id;
  return user;
}

const fail = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status });

const tokenFor = (user: User) => ({ access_token: `token-${user.id}`, token_type: "bearer", user });

const signedInUser = (request: Request) => {
  const id = request.headers.get("Authorization")?.replace("Bearer token-", "");
  return users.find((u) => u.id === id);
};

const newId = () => String(nextId++);

const mine = (request: Request) => {
  const user = signedInUser(request);
  if (!user) return [];
  if (user.role === "patient") return appointments.filter((a) => a.patient_id === user.id);
  const doctor = doctors.find((d) => d.user_id === user.id);
  return appointments.filter((a) => a.doctor_id === doctor?.id);
};

const findAppointment = (id: unknown) => appointments.find((a) => a.id === id)!;

const page = <T>(items: T[]) => ({ items, total: items.length, page: 1, page_size: 20 });

const EMPTY_HEALTH = { date_of_birth: null, gender: null, blood_group: null, allergies: null };
const patientOut = (user: User): Patient => ({ ...user, ...EMPTY_HEALTH, ...health[user.id] });

export const handlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = users.find((u) => u.email === body.email.toLowerCase());
    if (!user || body.password !== PASSWORD) {
      return fail(401, "INVALID_CREDENTIALS", "That email and password don't match. Check them and try again.");
    }
    sessionUserId = user.id;
    return HttpResponse.json(tokenFor(user));
  }),

  http.post(`${API}/auth/refresh`, () => {
    const user = users.find((u) => u.id === sessionUserId);
    return user ? HttpResponse.json(tokenFor(user)) : fail(401, "NO_SESSION", "Log in to continue.");
  }),

  http.post(`${API}/auth/logout`, () => {
    sessionUserId = null;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/doctors/me`, ({ request }) => {
    const doctor = doctors.find((d) => d.user_id === signedInUser(request)?.id);
    return doctor
      ? HttpResponse.json(doctor)
      : fail(404, "NO_DOCTOR_PROFILE", "Finish your doctor profile so an admin can review it.");
  }),

  http.get(`${API}/admin/doctors`, ({ request }) => {
    const status = new URL(request.url).searchParams.get("status");
    return HttpResponse.json(page(doctors.filter((d) => !status || d.verification_status === status)));
  }),

  http.post(`${API}/admin/doctors/:id/verify`, async ({ params, request }) => {
    const body = (await request.json()) as { action: "approve" | "reject"; reason?: string };
    const doctor = doctors.find((d) => d.id === params.id)!;
    doctor.verification_status = body.action === "approve" ? "verified" : "rejected";
    doctor.rejection_reason = body.reason ?? null;
    return HttpResponse.json(doctor);
  }),

  http.get(`${API}/patients/me`, ({ request }) => {
    const user = signedInUser(request);
    return user?.role === "patient" ? HttpResponse.json(patientOut(user)) : fail(403, "FORBIDDEN", "Only patients.");
  }),

  http.put(`${API}/patients/me`, async ({ request }) => {
    const user = signedInUser(request)!;
    const body = (await request.json()) as Patient;
    Object.assign(user, { name: body.name, phone: body.phone, city: body.city });
    health[user.id] = {
      date_of_birth: body.date_of_birth,
      gender: body.gender,
      blood_group: body.blood_group,
      allergies: body.allergies,
    };
    return HttpResponse.json(patientOut(user));
  }),

  http.get(`${API}/admin/patients/:id`, ({ params }) =>
    HttpResponse.json(patientOut(users.find((u) => u.id === params.id)!)),
  ),

  http.get(`${API}/admin/patients`, () => HttpResponse.json(page(users.filter((u) => u.role === "patient")))),

  http.get(`${API}/doctors`, ({ request }) => {
    const q = (new URL(request.url).searchParams.get("q") ?? "").toLowerCase();
    const listed = doctors.filter((d) => d.verification_status === "verified" && d.name.toLowerCase().includes(q));
    return HttpResponse.json(page(listed));
  }),

  http.get(`${API}/doctors/:id/slots`, ({ request }) => {
    const date = new URL(request.url).searchParams.get("date");
    const slots = ["03:30", "04:00", "04:30"].map((t) => ({ start: `${date}T${t}:00Z`, end: `${date}T${t}:00Z` }));
    return HttpResponse.json(slots.filter((s) => !appointments.some((a) => a.start_time === s.start)));
  }),

  http.post(`${API}/appointments`, async ({ request }) => {
    const body = (await request.json()) as { doctor_id: number; start_time: string; reason: string | null };
    const appointment = { ...makeAppointment(newId(), 0, "scheduled"), start_time: body.start_time, reason: body.reason };
    appointments.push(appointment);
    return HttpResponse.json(appointment, { status: 201 });
  }),

  http.get(`${API}/appointments/me`, ({ request }) => HttpResponse.json(mine(request))),

  http.post(`${API}/appointments/:id/cancel`, ({ params }) => {
    const appointment = findAppointment(params.id);
    appointment.status = "cancelled";
    return HttpResponse.json(appointment);
  }),

  http.post(`${API}/appointments/:id/no-show`, ({ params }) => {
    const appointment = findAppointment(params.id);
    appointment.status = "no_show";
    return HttpResponse.json(appointment);
  }),

  http.post(`${API}/appointments/:id/consultation/start`, ({ params }) => {
    findAppointment(params.id).status = "in_progress";
    return HttpResponse.json({ id: "1", appointment_id: params.id, started_at: at(0), ended_at: null }, { status: 201 });
  }),

  http.post(`${API}/appointments/:id/consultation/end`, ({ params }) => {
    findAppointment(params.id).status = "completed";
    return HttpResponse.json({ id: "1", appointment_id: params.id, started_at: at(-10), ended_at: at(0) });
  }),

  http.get(`${API}/appointments/:id/consultation/report`, ({ params }) => {
    const report = consultationReports[params.id as string];
    return report ? HttpResponse.json(report) : fail(404, "NO_REPORT", "No report yet.");
  }),

  http.put(`${API}/appointments/:id/consultation/report`, async ({ params, request }) => {
    const body = (await request.json()) as ConsultationReport;
    consultationReports[params.id as string] = { ...body, id: newId(), consultation_id: "1", updated_at: at(0) };
    return HttpResponse.json(consultationReports[params.id as string]);
  }),

  http.get(`${API}/doctors/me/availability`, () => HttpResponse.json(blocks)),

  http.post(`${API}/doctors/me/availability`, async ({ request }) => {
    const body = (await request.json()) as AvailabilityBlock;
    const start = `${body.start_time}:00`;
    const end = `${body.end_time}:00`;
    const overlap = blocks.some((b) => b.day_of_week === body.day_of_week && start < b.end_time && end > b.start_time);
    if (overlap) return fail(409, "HOURS_OVERLAP", "These hours overlap hours you already have on that day.");
    const block = { ...body, id: newId(), start_time: start, end_time: end };
    blocks.push(block);
    return HttpResponse.json(block, { status: 201 });
  }),

  http.delete(`${API}/doctors/me/availability/:id`, ({ params }) => {
    blocks = blocks.filter((b) => b.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/doctors/me/documents`, () => HttpResponse.json(documents)),

  http.post(`${API}/doctors/me/documents`, async ({ request }) => {
    const form = await request.formData();
    const file = form.get("file") as File;
    const document: DoctorDocument = {
      id: newId(),
      doc_type: form.get("doc_type") as DoctorDocument["doc_type"],
      file_name: file.name,
      content_type: file.type,
      size: file.size,
      uploaded_at: at(0),
    };
    documents.push(document);
    return HttpResponse.json(document, { status: 201 });
  }),

  http.get(`${API}/admin/doctors/:id/documents`, () => HttpResponse.json(documents)),

  http.get(`${API}/reports/me`, () => HttpResponse.json(reports)),

  http.post(`${API}/reports`, async ({ request }) => {
    const form = await request.formData();
    const file = form.get("file") as File;
    const report: Report = {
      id: newId(),
      title: form.get("title") as string,
      report_type: "pdf",
      file_name: file.name,
      content_type: file.type,
      size: file.size,
      uploaded_at: at(0),
      shared_with: [],
    };
    reports.unshift(report);
    return HttpResponse.json(report, { status: 201 });
  }),

  http.delete(`${API}/reports/:id`, ({ params }) => {
    reports = reports.filter((r) => r.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API}/reports/:id/shares`, async ({ params, request }) => {
    const body = (await request.json()) as { doctor_id: number };
    const report = reports.find((r) => r.id === params.id)!;
    const doctor = doctors.find((d) => d.id === String(body.doctor_id))!;
    report.shared_with.push({ doctor_id: doctor.id, doctor_name: doctor.name, shared_at: at(0) });
    return HttpResponse.json(report, { status: 201 });
  }),

  http.delete(`${API}/reports/:id/shares/:doctorId`, ({ params }) => {
    const report = reports.find((r) => r.id === params.id)!;
    report.shared_with = report.shared_with.filter((s) => s.doctor_id !== params.doctorId);
    return HttpResponse.json(report);
  }),

  http.get(`${API}/reports/shared-with-me`, () =>
    HttpResponse.json(
      reports
        .filter((r) => r.shared_with.length > 0)
        .map((r) => ({ ...r, patient_id: "2", patient_name: "Priya Sharma", shared_at: r.shared_with[0].shared_at })),
    ),
  ),

  http.patch(`${API}/admin/patients/:id/block`, async ({ params, request }) => {
    const body = (await request.json()) as { blocked: boolean; reason?: string };
    const patient = users.find((u) => u.id === params.id)!;
    patient.is_active = !body.blocked;
    patient.blocked_reason = body.reason ?? null;
    return HttpResponse.json(patient);
  }),
];

export const server = setupServer(...handlers);
