import type {
  Appointment,
  AppointmentStatus,
  AuditLog,
  Doctor,
  DoctorDocument,
  KbArticle,
  Role,
  User,
  VerificationStatus,
} from "@/api/types";
import { kbSeed } from "./kb-content";

export const DEMO_ADMIN = { email: "admin@aarogyahub.in", password: "Admin@123" } as const;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260930);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const chance = (p: number) => rand() < p;

let idCounter = 0x66f1000;
export const oid = () => (idCounter++).toString(16).padStart(24, "66f0a0000000000000000000");

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const IST_OFFSET = 330 * MIN;

function istInstant(now: Date, dayOffset: number, hh: number, mm: number) {
  const istNow = new Date(now.getTime() + IST_OFFSET);
  const base = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + dayOffset, hh, mm);
  return new Date(base - IST_OFFSET);
}

const FIRST = [
  "Simran", "Arjun", "Farah", "Kavya", "Aman", "Leena", "Vikram", "Sara", "Rohit", "Neha", "Iqbal",
  "Priya", "Harpreet", "Gurleen", "Manpreet", "Rajesh", "Sunita", "Deepak", "Anita", "Karan", "Pooja",
  "Ravi", "Meenakshi", "Sandeep", "Nisha", "Arvind", "Jasleen", "Tarun", "Swati", "Imran", "Ayesha",
  "Vivek", "Divya", "Naveen", "Rekha", "Suresh", "Ananya", "Kabir", "Ishaan", "Tanvi", "Mohit", "Zoya",
  "Baljit", "Rupinder", "Prakash", "Lakshmi", "Gaurav", "Shreya", "Yusuf", "Parminder",
] as const;
const LAST = [
  "Kaur", "Mehta", "Khan", "Rao", "Gill", "Das", "Jha", "Thomas", "Bansal", "Arora", "Singh", "Sharma",
  "Verma", "Gupta", "Sandhu", "Dhillon", "Iyer", "Nair", "Reddy", "Chopra", "Malhotra", "Bhatia",
  "Grewal", "Sidhu", "Kapoor", "Joshi", "Menon", "Pillai", "Ahmed", "Qureshi", "Saini", "Bajwa",
] as const;
const CITIES = [
  "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali", "Chandigarh", "Bathinda", "Delhi",
  "Bengaluru", "Pune", "Jaipur", "Lucknow", "Dehradun", "Kochi", "Bhubaneswar", "Patna",
] as const;

const COUNCILS = [
  { code: "PMC", name: "Punjab Medical Council" },
  { code: "KMC", name: "Karnataka Medical Council" },
  { code: "DMC", name: "Delhi Medical Council" },
  { code: "MMC", name: "Maharashtra Medical Council" },
  { code: "OCMR", name: "Odisha Council of Medical Registration" },
  { code: "BMC", name: "Bihar Medical Council" },
  { code: "TCMC", name: "Travancore-Cochin Medical Council" },
  { code: "HMC", name: "Haryana Medical Council" },
  { code: "UPMC", name: "Uttar Pradesh Medical Council" },
  { code: "RMC", name: "Rajasthan Medical Council" },
] as const;

const SPECIALIZATIONS = [
  { name: "General Physician", quals: ["MBBS"], fee: [300, 600] },
  { name: "General Physician", quals: ["MBBS", "MD (Medicine)"], fee: [400, 700] },
  { name: "Paediatrics", quals: ["MBBS", "MD (Paediatrics)"], fee: [500, 800] },
  { name: "Dermatology", quals: ["MBBS", "MD (Dermatology)"], fee: [500, 900] },
  { name: "Gynaecology", quals: ["MBBS", "MS (Obstetrics & Gynaecology)"], fee: [600, 900] },
  { name: "ENT", quals: ["MBBS", "MS (ENT)"], fee: [400, 700] },
  { name: "Orthopaedics", quals: ["MBBS", "MS (Orthopaedics)"], fee: [600, 1000] },
  { name: "Psychiatry", quals: ["MBBS", "MD (Psychiatry)"], fee: [700, 1200] },
  { name: "Endocrinology", quals: ["MBBS", "MD (Medicine)", "DM (Endocrinology)"], fee: [800, 1200] },
  { name: "Cardiology", quals: ["MBBS", "MD (Medicine)", "DM (Cardiology)"], fee: [900, 1500] },
] as const;

const LANG_SETS = [
  ["English", "Hindi", "Punjabi"],
  ["English", "Hindi"],
  ["English", "Punjabi"],
  ["English", "Hindi", "Urdu"],
  ["English", "Kannada", "Hindi"],
  ["English", "Malayalam"],
] as const;

const REASONS = [
  "Fever since 2 days", "Persistent cough", "Skin rash on arms", "Follow-up on blood test results",
  "Child has ear pain", "Recurring headaches", "Back pain after lifting", "Thyroid medication review",
  "Irregular periods", "Anxiety and poor sleep", "Knee pain while climbing stairs", "Allergy flare-up",
  "Blood sugar review", "Chest X-ray follow-up", "Sore throat and cold", "Acne treatment review",
  "Stomach pain after meals", "BP check and medication", "Vaccination query for toddler", "Dizziness",
] as const;

const REJECTION_REASONS = [
  "We couldn't verify your licence: the document is unclear. Upload a clearer copy.",
  "The registration number does not match the council register. Check the number and re-upload.",
  "The degree certificate is missing. Upload your MBBS certificate.",
  "The licence has expired. Upload your renewed registration certificate.",
];

const SUSPEND_REASONS = [
  "Registration lapsed on the council register; suspended until renewal is uploaded.",
  "Repeated no-shows reported by patients; under review.",
];

const BLOCK_REASONS = [
  "Repeated abusive messages to doctors.",
  "Multiple accounts created with the same phone number.",
  "Booked and missed 5 consultations in a row.",
];

let nameIdx = 0;
function uniqueName() {
  const f = FIRST[nameIdx % FIRST.length];
  const l = LAST[(nameIdx * 7 + Math.floor(nameIdx / FIRST.length)) % LAST.length];
  nameIdx++;
  return `${f} ${l}`;
}
const emailFor = (name: string, i: number) =>
  `${name.toLowerCase().replace(/[^a-z]+/g, ".")}${i % 3 === 0 ? "" : i}@${pick(["gmail.com", "yahoo.in", "outlook.com", "rediffmail.com"])}`;
const phone = () => `+91 ${int(70000, 99999)} ${int(10000, 99999)}`;
const ip = () => `${pick([49, 103, 106, 117, 122, 157, 182])}.${int(1, 254)}.${int(1, 254)}.${int(1, 254)}`;
export const requestId = () => Array.from({ length: 12 }, () => "0123456789abcdef"[int(0, 15)]).join("");

function documentSvg(kind: DocumentKind, doctor: { name: string; council: string; license: string; qual: string }) {
  const title =
    kind === "licence" ? "Certificate of registration" : kind === "degree" ? "Degree certificate" : "Government ID";
  const line2 =
    kind === "licence"
      ? `Registration no. ${doctor.license}`
      : kind === "degree"
        ? doctor.qual
        : `ID no. XXXX XXXX ${int(1000, 9999)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560" font-family="Georgia, serif">
<rect width="800" height="560" fill="#fbfaf5"/>
<rect x="18" y="18" width="764" height="524" fill="none" stroke="#147058" stroke-width="3"/>
<rect x="28" y="28" width="744" height="504" fill="none" stroke="#a9d8c5" stroke-width="1"/>
<circle cx="400" cy="100" r="36" fill="none" stroke="#147058" stroke-width="2"/>
<text x="400" y="108" text-anchor="middle" font-size="22" fill="#147058">${doctor.council}</text>
<text x="400" y="180" text-anchor="middle" font-size="30" fill="#17211e">${title}</text>
<text x="400" y="240" text-anchor="middle" font-size="18" fill="#47534b">This is to certify that</text>
<text x="400" y="290" text-anchor="middle" font-size="34" font-style="italic" fill="#17211e">${doctor.name}</text>
<text x="400" y="340" text-anchor="middle" font-size="18" fill="#47534b">${line2}</text>
<line x1="120" y1="450" x2="300" y2="450" stroke="#7f8c83"/><text x="210" y="475" text-anchor="middle" font-size="14" fill="#5e6b62">Registrar</text>
<line x1="500" y1="450" x2="680" y2="450" stroke="#7f8c83"/><text x="590" y="475" text-anchor="middle" font-size="14" fill="#5e6b62">Date of issue</text>
<text x="400" y="330" text-anchor="middle" font-size="96" fill="#c3382e" opacity="0.08" transform="rotate(-18 400 300)" font-family="sans-serif" font-weight="700">SAMPLE</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
type DocumentKind = "licence" | "degree" | "id";

export const chunkCount = (md: string) => Math.max(1, Math.ceil(md.length / 700));

export interface MockDb {
  users: User[];
  passwords: Map<string, string>;
  doctors: Doctor[];
  documentUrls: Map<string, string>;
  appointments: Appointment[];
  kb: KbArticle[];
  audit: AuditLog[];
}

export function buildSeed(now = new Date()): MockDb {
  const t = now.getTime();
  const users: User[] = [];
  const passwords = new Map<string, string>();
  const doctors: Doctor[] = [];
  const documentUrls = new Map<string, string>();
  const appointments: Appointment[] = [];
  const audit: AuditLog[] = [];

  const makeUser = (name: string, role: Role, createdAgoDays: number, email?: string): User => {
    const created = new Date(t - createdAgoDays * DAY - int(0, 20) * HOUR);
    const u: User = {
      id: oid(),
      name,
      email: email ?? emailFor(name, users.length),
      phone: chance(0.9) ? phone() : null,
      role,
      is_active: true,
      is_email_verified: chance(0.92),
      created_at: created.toISOString(),
      last_login_at: chance(0.85)
        ? new Date(Math.max(created.getTime(), t - int(0, Math.max(1, createdAgoDays)) * DAY - int(0, 23) * HOUR)).toISOString()
        : null,
      blocked_reason: null,
      city: pick(CITIES),
    };
    users.push(u);
    return u;
  };

  const admin = makeUser("Anjali Verma", "admin", 240, DEMO_ADMIN.email);
  admin.is_email_verified = true;
  admin.last_login_at = new Date(t - 2 * DAY).toISOString();
  passwords.set(admin.id, DEMO_ADMIN.password);
  const admins = [
    admin,
    makeUser("Rahul Sethi", "admin", 210, "rahul.sethi@aarogyahub.in"),
    makeUser("Meera Iyer", "admin", 120, "meera.iyer@aarogyahub.in"),
  ];
  admins.forEach((a) => (a.is_email_verified = true));

  const demoPatient = makeUser("Harpreet Singh", "patient", 60, "patient@aarogyahub.in");
  passwords.set(demoPatient.id, "Patient@123");

  const plan: VerificationStatus[] = [
    ...Array<VerificationStatus>(7).fill("pending"),
    ...Array<VerificationStatus>(26).fill("verified"),
    ...Array<VerificationStatus>(4).fill("rejected"),
    ...Array<VerificationStatus>(3).fill("suspended"),
  ];
  const pendingAgesH = [2, 5, 11, 26, 31, 52, 70];
  plan.forEach((status, i) => {
    const name = uniqueName();
    const spec = SPECIALIZATIONS[i % SPECIALIZATIONS.length];
    const council = COUNCILS[i % COUNCILS.length];
    const submittedAgoH = status === "pending" ? pendingAgesH[i] : int(5 * 24, 200 * 24);
    const user = makeUser(`Dr. ${name}`, "doctor", Math.ceil(submittedAgoH / 24) + int(0, 3));
    const license = `${council.code}-${int(10000, 99999)}`;
    const languages = [...pick(LANG_SETS)];
    const experience = int(2, 24);
    const docs: DoctorDocument[] = (["licence", "degree", "id"] as const)
      .filter((k) => k !== "id" || chance(0.8))
      .map((kind) => {
        const d: DoctorDocument = {
          id: oid(),
          doc_type: kind,
          file_name: kind === "licence" ? "licence.pdf" : kind === "degree" ? "mbbs-degree.jpg" : "aadhaar-masked.jpg",
          mime: kind === "licence" ? "application/pdf" : "image/jpeg",
          size: int(180, 2400) * 1024,
          uploaded_at: new Date(t - submittedAgoH * HOUR).toISOString(),
        };
        documentUrls.set(
          d.id,
          documentSvg(kind, { name: `Dr. ${name}`, council: council.code, license, qual: spec.quals.join(", ") }),
        );
        return d;
      });
    const decidedBy = status === "pending" ? null : pick(admins);
    const decidedAt = status === "pending" ? null : new Date(t - submittedAgoH * HOUR + int(3, 40) * HOUR);
    doctors.push({
      id: oid(),
      user_id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city ?? "Ludhiana",
      specialization: spec.name,
      qualifications: [...spec.quals],
      languages,
      experience_years: experience,
      license_number: license,
      council: council.code,
      council_name: council.name,
      verification_status: status,
      rejection_reason:
        status === "rejected" ? pick(REJECTION_REASONS) : status === "suspended" ? pick(SUSPEND_REASONS) : null,
      verified_by: status === "verified" || status === "suspended" ? { id: decidedBy!.id, name: decidedBy!.name } : null,
      verified_at: status === "verified" || status === "suspended" ? decidedAt!.toISOString() : null,
      submitted_at: new Date(t - submittedAgoH * HOUR).toISOString(),
      consultation_fee: Math.round(int(spec.fee[0], spec.fee[1]) / 50) * 50,
      bio: `${spec.name} with ${experience} years of practice in ${user.city}. Consults in ${languages.join(", ")}.`,
      is_active: status === "verified",
      documents: docs,
    });
    if (decidedBy && decidedAt) {
      audit.push({
        id: oid(),
        actor: { id: decidedBy.id, name: decidedBy.name, role: "admin" },
        action: status === "rejected" ? "doctor.reject" : "doctor.approve",
        entity_type: "doctor",
        entity_id: doctors[doctors.length - 1].id,
        metadata:
          status === "rejected"
            ? { doctor: user.name, reason: doctors[doctors.length - 1].rejection_reason }
            : { doctor: user.name, council: council.code, license },
        ip: ip(),
        request_id: requestId(),
        created_at: decidedAt.toISOString(),
      });
    }
  });

  const patients: User[] = [demoPatient];
  for (let i = 0; i < 150; i++) {
    const ago = Math.floor(Math.pow(rand(), 0.8) * 120);
    patients.push(makeUser(uniqueName(), "patient", ago));
  }
  patients.slice(3, 9).forEach((p) => {
    p.is_active = false;
    p.blocked_reason = pick(BLOCK_REASONS);
  });
  const suspendedDoctorUsers = doctors.filter((d) => d.verification_status === "suspended").map((d) => d.user_id);
  users.filter((u) => suspendedDoctorUsers.includes(u.id)).forEach((u) => (u.is_active = true));

  const bookable = doctors.filter((d) => d.verification_status === "verified" || d.verification_status === "suspended");
  const durations = [5, 10, 15, 20, 30] as const;
  for (const doc of bookable) {
    const morningLen = pick([10, 10, 15, 5, 20] as const);
    const eveningLen = pick([15, 15, 10, 20, 30] as const);
    for (let day = -30; day <= 7; day++) {
      if (doc.verification_status === "suspended" && day > -5) continue;
      const count = day === 0 ? int(1, 3) : int(0, 3);
      const used = new Set<string>();
      for (let k = 0; k < count; k++) {
        const morning = chance(0.55);
        const len = morning ? morningLen : eveningLen;
        const startMin = (morning ? 9 * 60 : 17 * 60) + len * int(0, Math.floor((morning ? 180 : 180) / len) - 1);
        const key = `${day}-${startMin}`;
        if (used.has(key)) continue;
        used.add(key);
        const start = istInstant(now, day, Math.floor(startMin / 60), startMin % 60);
        const end = new Date(start.getTime() + len * MIN);
        const patient = pick(patients);
        let status: AppointmentStatus;
        if (end.getTime() < t) {
          const r = rand();
          status = r < 0.82 ? "completed" : r < 0.93 ? "cancelled" : "no_show";
        } else if (start.getTime() <= t) {
          status = "in_progress";
        } else {
          status = chance(0.9) ? "scheduled" : "cancelled";
        }
        const created = new Date(start.getTime() - int(1, 96) * HOUR);
        const cancelledBy: Role | null = status === "cancelled" ? pick(["patient", "patient", "doctor"] as const) : null;
        const history: Appointment["history"] = [
          { at: created.toISOString(), status: "scheduled", by: patient.name, note: "Booked" },
        ];
        if (status === "in_progress" || status === "completed")
          history.push({ at: start.toISOString(), status: "in_progress", by: "System", note: "Both joined the call" });
        if (status === "completed")
          history.push({ at: end.toISOString(), status: "completed", by: doc.name, note: "Consultation ended" });
        if (status === "no_show")
          history.push({ at: new Date(start.getTime() + 15 * MIN).toISOString(), status: "no_show", by: doc.name, note: "Patient did not join" });
        const cancelReason =
          status === "cancelled"
            ? cancelledBy === "doctor"
              ? "Doctor unavailable due to emergency surgery"
              : pick(["Feeling better", "Booked by mistake", "Will visit clinic in person", "Clash with work"])
            : null;
        if (status === "cancelled")
          history.push({
            at: new Date(Math.min(start.getTime() - HOUR, t)).toISOString(),
            status: "cancelled",
            by: cancelledBy === "doctor" ? doc.name : patient.name,
            note: cancelReason ?? undefined,
          });
        appointments.push({
          id: oid(),
          patient: { id: patient.id, name: patient.name },
          doctor: { id: doc.id, name: doc.name, specialization: doc.specialization },
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          slot_duration_min: durations.includes(len) ? len : 10,
          status,
          reason: pick(REASONS),
          fee_snapshot: doc.consultation_fee,
          cancelled_by: cancelledBy,
          cancel_reason: cancelReason,
          reports_shared: chance(0.5) ? int(1, 3) : 0,
          created_at: created.toISOString(),
          history,
        });
      }
    }
  }
  appointments.sort((a, b) => b.start_time.localeCompare(a.start_time));

  const kb: KbArticle[] = kbSeed.map((a) => {
    const updated = new Date(t - int(1, 40) * DAY - int(0, 20) * HOUR);
    const author = pick(admins);
    return {
      id: oid(),
      ...a,
      author: { id: author.id, name: author.name },
      chunk_count: a.status === "published" ? chunkCount(a.body_md) : 0,
      created_at: new Date(updated.getTime() - int(1, 30) * DAY).toISOString(),
      updated_at: updated.toISOString(),
      published_at: a.status === "published" ? updated.toISOString() : null,
      last_indexed_at: a.status === "published" ? new Date(updated.getTime() + 2 * MIN).toISOString() : null,
    };
  });

  const blocked = patients.slice(3, 9);
  blocked.forEach((p) =>
    audit.push({
      id: oid(),
      actor: { id: pick(admins).id, name: pick(admins).name, role: "admin" },
      action: "user.block",
      entity_type: "user",
      entity_id: p.id,
      metadata: { user: p.name, reason: p.blocked_reason },
      ip: ip(),
      request_id: requestId(),
      created_at: new Date(t - int(1, 25) * DAY).toISOString(),
    }),
  );
  kb.filter((a) => a.status === "published").forEach((a) =>
    audit.push({
      id: oid(),
      actor: { ...a.author, role: "admin" },
      action: "kb.publish",
      entity_type: "kb_article",
      entity_id: a.id,
      metadata: { title: a.title, chunks: a.chunk_count },
      ip: ip(),
      request_id: requestId(),
      created_at: a.published_at!,
    }),
  );
  const recentAppts = appointments.filter((a) => a.status === "completed" || a.status === "in_progress").slice(0, 120);
  for (const a of recentAppts) {
    if (a.reports_shared > 0 && chance(0.6))
      audit.push({
        id: oid(),
        actor: { id: a.doctor.id, name: a.doctor.name, role: "doctor" },
        action: "report.view",
        entity_type: "report",
        entity_id: oid(),
        metadata: { patient: a.patient.name, appointment_id: a.id, type: pick(["pdf", "image", "dicom"]) },
        ip: ip(),
        request_id: requestId(),
        created_at: new Date(new Date(a.start_time).getTime() + int(0, 8) * MIN).toISOString(),
      });
    if (chance(0.35))
      audit.push({
        id: oid(),
        actor: { id: a.patient.id, name: a.patient.name, role: "patient" },
        action: "video.token_issued",
        entity_type: "appointment",
        entity_id: a.id,
        metadata: { role: "guest", doctor: a.doctor.name },
        ip: ip(),
        request_id: requestId(),
        created_at: new Date(new Date(a.start_time).getTime() - int(1, 9) * MIN).toISOString(),
      });
  }
  for (let i = 0; i < 40; i++) {
    const u = pick(users);
    const failed = chance(0.2);
    audit.push({
      id: oid(),
      actor: failed ? null : { id: u.id, name: u.name, role: u.role },
      action: failed ? "auth.login_failed" : "auth.login",
      entity_type: "auth",
      entity_id: u.id,
      metadata: failed ? { email: u.email, reason: "wrong_password" } : { method: "password" },
      ip: ip(),
      request_id: requestId(),
      created_at: new Date(t - int(0, 30 * 24) * HOUR - int(0, 59) * MIN).toISOString(),
    });
  }
  audit.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return { users, passwords, doctors, documentUrls, appointments, kb, audit };
}
