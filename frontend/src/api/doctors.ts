import { api } from "./client";
import type { Doctor, DoctorProfileInput } from "./types";

export async function updateMyProfile(input: DoctorProfileInput) {
  const res = await api.put<Doctor>("/doctors/me", input);
  return res.data;
}
