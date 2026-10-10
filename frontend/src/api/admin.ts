import { api } from "./client";
import type { Doctor, User } from "./types";

export async function verifyDoctor(id: string, action: "approve" | "reject", reason?: string) {
  const res = await api.post<Doctor>(`/admin/doctors/${id}/verify`, { action, reason });
  return res.data;
}

export async function setPatientBlocked(id: string, blocked: boolean, reason?: string) {
  const res = await api.patch<User>(`/admin/patients/${id}/block`, { blocked, reason });
  return res.data;
}
