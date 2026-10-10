import { api } from "./client";
import type { Patient, PatientProfileInput } from "./types";

export async function updateMyPatientProfile(input: PatientProfileInput) {
  const res = await api.put<Patient>("/patients/me", input);
  return res.data;
}
