import { api } from "./client";
import type { Report } from "./types";

export async function uploadReport(title: string, file: File) {
  const form = new FormData();
  form.append("title", title);
  form.append("file", file);
  const res = await api.post<Report>("/reports", form);
  return res.data;
}

export async function deleteReport(id: string) {
  await api.delete(`/reports/${id}`);
}

export async function shareReport(id: string, doctorId: string) {
  const res = await api.post<Report>(`/reports/${id}/shares`, { doctor_id: Number(doctorId) });
  return res.data;
}

export async function stopSharingReport(id: string, doctorId: string) {
  const res = await api.delete<Report>(`/reports/${id}/shares/${doctorId}`);
  return res.data;
}
