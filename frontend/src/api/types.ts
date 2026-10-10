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

export interface DoctorCard {
  id: string;
  name: string;
  city: string | null;
  specialization: string;
  qualifications: string;
  experience_years: number;
  consultation_fee: number;
  bio: string | null;
}

export interface Slot {
  start: string;
  end: string;
}

export interface AvailabilityBlock {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  doctor_name: string;
  specialization: string;
  patient_id: string;
  patient_name: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string | null;
  fee: number;
  cancel_reason: string | null;
  created_at: string;
}

export interface ConsultationReportInput {
  symptoms: string | null;
  diagnosis: string;
  prescription: string | null;
  advice: string | null;
  follow_up_date: string | null;
}

export interface ConsultationReport extends ConsultationReportInput {
  id: string;
  consultation_id: string;
  updated_at: string;
}

export type ReportType = "pdf" | "image" | "dicom";

export interface Report {
  id: string;
  title: string;
  report_type: ReportType;
  file_name: string;
  content_type: string;
  size: number;
  uploaded_at: string;
  shared_with: { doctor_id: string; doctor_name: string; shared_at: string }[];
}

export interface SharedReport {
  id: string;
  title: string;
  report_type: ReportType;
  file_name: string;
  size: number;
  patient_id: string;
  patient_name: string;
  shared_at: string;
}

export type DocumentType = "licence" | "degree" | "id_proof";

export interface DoctorDocument {
  id: string;
  doc_type: DocumentType;
  file_name: string;
  content_type: string;
  size: number;
  uploaded_at: string;
}
