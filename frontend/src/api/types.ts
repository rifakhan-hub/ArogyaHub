export type Role = "patient" | "doctor" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected" | "suspended";
export type AppointmentStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
export type KbCategory = "faq" | "howto" | "health";
export type KbStatus = "draft" | "published";
export type Audience = "visitor" | "patient" | "doctor";
export type DocType = "licence" | "degree" | "id";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string; request_id?: string; details?: unknown };
}

export interface ListParams {
  page?: number;
  page_size?: number;
  q?: string;
  sort?: string;
}


export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  blocked_reason?: string | null;
  city?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  role: "patient" | "doctor";
  password: string;
}

export interface UserListParams extends ListParams {
  role?: Role;
  status?: "active" | "blocked";
}

export interface UserDetail extends User {
  doctor_id: string | null;
  verification_status: VerificationStatus | null;
  stats: {
    appointments: number;
    completed: number;
    cancelled: number;
    no_show: number;
    last_appointment_at: string | null;
  };
}

export interface BlockUserRequest {
  blocked: boolean;
  reason?: string;
}


export interface DoctorDocument {
  id: string;
  doc_type: DocType;
  file_name: string;
  mime: string;
  size: number;
  uploaded_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string;
  specialization: string;
  qualifications: string[];
  languages: string[];
  experience_years: number;
  license_number: string;
  council: string;
  council_name: string;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  verified_by: { id: string; name: string } | null;
  verified_at: string | null;
  submitted_at: string;
  consultation_fee: number;
  bio: string;
  is_active: boolean;
  documents: DoctorDocument[];
}

export interface DoctorListParams extends ListParams {
  status?: VerificationStatus;
}

export type DoctorStatusCounts = Record<VerificationStatus, number>;

export interface DoctorList extends Paginated<Doctor> {
  counts: DoctorStatusCounts;
}

export type VerifyAction = "approve" | "reject" | "suspend";

export interface VerifyRequest {
  action: VerifyAction;
  reason?: string;
}

export interface SignedUrl {
  url: string;
  mime: string;
  expires_at: string;
}


export interface PersonRef {
  id: string;
  name: string;
}

export interface AppointmentEvent {
  at: string;
  status: AppointmentStatus;
  by: string;
  note?: string;
}

export interface Appointment {
  id: string;
  patient: PersonRef;
  doctor: PersonRef & { specialization: string };
  start_time: string;
  end_time: string;
  slot_duration_min: 5 | 10 | 15 | 20 | 30;
  status: AppointmentStatus;
  reason: string;
  fee_snapshot: number;
  cancelled_by: Role | null;
  cancel_reason: string | null;
  reports_shared: number;
  created_at: string;
  history: AppointmentEvent[];
}

export interface AppointmentListParams extends ListParams {
  status?: AppointmentStatus;
  from?: string;
  to?: string;
}

export interface AppointmentOverride {
  status: Extract<AppointmentStatus, "cancelled" | "completed" | "no_show">;
  reason: string;
}


export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  category: KbCategory;
  status: KbStatus;
  audience: Audience[];
  body_md: string;
  reviewer: string | null;
  author: PersonRef;
  chunk_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  last_indexed_at: string | null;
}

export interface KbListParams extends ListParams {
  category?: KbCategory;
  status?: KbStatus;
}

export type KbArticleInput = Pick<
  KbArticle,
  "title" | "slug" | "category" | "audience" | "body_md" | "reviewer"
>;


export interface AuditLog {
  id: string;
  actor: (PersonRef & { role: Role }) | null;
  action: string;
  entity_type: "doctor" | "user" | "appointment" | "kb_article" | "report" | "auth";
  entity_id: string;
  metadata: Record<string, unknown>;
  ip: string;
  request_id: string;
  created_at: string;
}

export interface AuditListParams extends ListParams {
  action?: string;
  entity_type?: AuditLog["entity_type"];
  from?: string;
  to?: string;
}


export interface Analytics {
  kpis: {
    consultations_today: number;
    consultations_today_prev: number;
    live_now: number;
    active_doctors: number;
    active_doctors_prev: number;
    pending_verifications: number;
    oldest_pending_hours: number;
    new_users_7d: number;
    new_users_7d_prev: number;
  };
  consultations_per_day: { date: string; completed: number; cancelled: number; no_show: number }[];
  new_users_per_week: { week: string; patient: number; doctor: number }[];
  appointment_status: Record<AppointmentStatus, number>;
  top_specializations: { name: string; count: number }[];
}
