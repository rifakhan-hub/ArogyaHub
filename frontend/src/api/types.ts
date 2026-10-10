export type Role = "patient" | "doctor" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type AppointmentStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string; request_id?: string };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  role: Role;
  is_active: boolean;
  is_email_verified: boolean;
  blocked_reason: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface AccountInput {
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  password: string;
}

export interface DoctorProfileInput {
  specialization: string;
  license_number: string;
  council: string;
  experience_years: number;
  consultation_fee: number;
  qualifications: string;
  bio: string | null;
}

export type DoctorRegisterInput = AccountInput & DoctorProfileInput;

export interface Doctor extends DoctorProfileInput {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  is_active: boolean;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export type Gender = "female" | "male" | "other";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface PatientProfileInput {
  name: string;
  phone: string | null;
  city: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  blood_group: BloodGroup | null;
  allergies: string | null;
}

export interface Patient extends User {
  date_of_birth: string | null;
  gender: Gender | null;
  blood_group: BloodGroup | null;
  allergies: string | null;
}
