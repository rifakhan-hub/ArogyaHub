import { api } from "./client";
import type {
  Appointment,
  AppointmentOverride,
  AuditListParams,
  AuditLog,
  Doctor,
  KbArticle,
  KbArticleInput,
  Paginated,
  User,
  VerifyAction,
} from "./types";

export async function verifyDoctor(id: string, action: VerifyAction, reason?: string) {
  const res = await api.post<Doctor>(`/admin/doctors/${id}/verify`, { action, reason });
  return res.data;
}

export async function setUserBlocked(id: string, blocked: boolean, reason?: string) {
  const res = await api.patch<User>(`/admin/users/${id}/block`, { blocked, reason });
  return res.data;
}

export async function overrideAppointment(id: string, status: AppointmentOverride["status"], reason: string) {
  const res = await api.patch<Appointment>(`/admin/appointments/${id}`, { status, reason });
  return res.data;
}

export async function createArticle(article: KbArticleInput) {
  const res = await api.post<KbArticle>("/admin/kb/articles", article);
  return res.data;
}

export async function updateArticle(id: string, article: KbArticleInput) {
  const res = await api.put<KbArticle>(`/admin/kb/articles/${id}`, article);
  return res.data;
}

export async function publishArticle(id: string) {
  const res = await api.post<KbArticle>(`/admin/kb/articles/${id}/publish`);
  return res.data;
}

export async function unpublishArticle(id: string) {
  const res = await api.post<KbArticle>(`/admin/kb/articles/${id}/unpublish`);
  return res.data;
}

export async function deleteArticle(id: string) {
  await api.delete(`/admin/kb/articles/${id}`);
}

export async function getAuditLogs(params: AuditListParams) {
  const res = await api.get<Paginated<AuditLog>>("/admin/audit-logs", { params });
  return res.data;
}
