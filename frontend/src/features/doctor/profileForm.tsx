import type { Doctor, DoctorProfileInput } from "@/api/types";
import { Field } from "@/components/ui/Field";
import { Input, Select, Textarea } from "@/components/ui/Input";

export const SPECIALITIES = [
  "General Physician",
  "Paediatrics",
  "Dermatology",
  "Gynaecology",
  "ENT",
  "Psychiatry",
  "Cardiology",
  "Orthopaedics",
];

export interface ProfileForm {
  specialization: string;
  license_number: string;
  council: string;
  experience_years: string;
  consultation_fee: string;
  qualifications: string;
  bio: string;
}

export type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

export const EMPTY_PROFILE: ProfileForm = {
  specialization: "",
  license_number: "",
  council: "",
  experience_years: "",
  consultation_fee: "",
  qualifications: "",
  bio: "",
};

export function profileFromDoctor(doctor: Doctor): ProfileForm {
  return {
    specialization: doctor.specialization,
    license_number: doctor.license_number,
    council: doctor.council,
    experience_years: String(doctor.experience_years),
    consultation_fee: String(doctor.consultation_fee),
    qualifications: doctor.qualifications,
    bio: doctor.bio ?? "",
  };
}

export function toProfileInput(form: ProfileForm): DoctorProfileInput {
  return {
    specialization: form.specialization,
    license_number: form.license_number.trim(),
    council: form.council.trim(),
    experience_years: Number(form.experience_years),
    consultation_fee: Number(form.consultation_fee),
    qualifications: form.qualifications.trim(),
    bio: form.bio.trim() || null,
  };
}

function isWholeNumber(value: string, max: number) {
  return /^\d+$/.test(value.trim()) && Number(value) <= max;
}

export function validateProfessional(form: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!form.specialization) errors.specialization = "Choose your speciality";
  if (form.license_number.trim().length < 3) errors.license_number = "Enter your registration number";
  if (form.council.trim().length < 2) errors.council = "Enter the medical council you're registered with";
  if (!isWholeNumber(form.experience_years, 60)) errors.experience_years = "Enter years as a number, like 8";
  if (!isWholeNumber(form.consultation_fee, 100000)) errors.consultation_fee = "Enter the fee in rupees, like 500";
  return errors;
}

export function validateAbout(form: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {};
  if (form.qualifications.trim().length < 2) errors.qualifications = "Enter your degrees, like MBBS, MD";
  if (form.bio.length > 2000) errors.bio = "Keep this under 2000 characters";
  return errors;
}

interface FieldsProps {
  form: ProfileForm;
  errors: ProfileErrors;
  onChange: (key: keyof ProfileForm, value: string) => void;
}

const SPECIALITY_OPTIONS = [{ value: "", label: "Choose a speciality" }, ...SPECIALITIES.map((s) => ({ value: s, label: s }))];

export function ProfessionalFields({ form, errors, onChange }: FieldsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Speciality" id="specialization" error={errors.specialization}>
        <Select value={form.specialization} onChange={(v) => onChange("specialization", v)} options={SPECIALITY_OPTIONS} />
      </Field>
      <Field label="Registration (licence) number" id="license_number" error={errors.license_number}>
        <Input value={form.license_number} onChange={(e) => onChange("license_number", e.target.value)} />
      </Field>
      <Field label="Medical council" id="council" hint="For example, Punjab Medical Council" error={errors.council}>
        <Input value={form.council} onChange={(e) => onChange("council", e.target.value)} />
      </Field>
      <Field label="Years of experience" id="experience_years" error={errors.experience_years}>
        <Input
          inputMode="numeric"
          value={form.experience_years}
          onChange={(e) => onChange("experience_years", e.target.value)}
        />
      </Field>
      <Field label="Consultation fee (₹)" id="consultation_fee" error={errors.consultation_fee}>
        <Input
          inputMode="numeric"
          value={form.consultation_fee}
          onChange={(e) => onChange("consultation_fee", e.target.value)}
        />
      </Field>
    </div>
  );
}

export function AboutFields({ form, errors, onChange }: FieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Qualifications" id="qualifications" hint="For example, MBBS, MD (Dermatology)" error={errors.qualifications}>
        <Input value={form.qualifications} onChange={(e) => onChange("qualifications", e.target.value)} />
      </Field>
      <Field label="About you" id="bio" optional hint="What patients should know about your practice" error={errors.bio}>
        <Textarea rows={4} value={form.bio} onChange={(e) => onChange("bio", e.target.value)} />
      </Field>
    </div>
  );
}
