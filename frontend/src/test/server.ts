import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { Doctor, Patient, Role, User } from "@/api/types";

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
let sessionUserId: string | null = null;

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

  http.patch(`${API}/admin/patients/:id/block`, async ({ params, request }) => {
    const body = (await request.json()) as { blocked: boolean; reason?: string };
    const patient = users.find((u) => u.id === params.id)!;
    patient.is_active = !body.blocked;
    patient.blocked_reason = body.reason ?? null;
    return HttpResponse.json(patient);
  }),
];

export const server = setupServer(...handlers);
