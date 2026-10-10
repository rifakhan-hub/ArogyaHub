import { api } from "./client";
import type { Appointment, ConsultationReport, ConsultationReportInput } from "./types";

export async function bookAppointment(doctorId: string, startTime: string, reason: string | null) {
  const res = await api.post<Appointment>("/appointments", { doctor_id: Number(doctorId), start_time: startTime, reason });
  return res.data;
}

export async function cancelAppointment(id: string, reason?: string) {
  const res = await api.post<Appointment>(`/appointments/${id}/cancel`, { reason });
  return res.data;
}

export async function markNoShow(id: string) {
  const res = await api.post<Appointment>(`/appointments/${id}/no-show`);
  return res.data;
}

export async function startConsultation(id: string) {
  await api.post(`/appointments/${id}/consultation/start`);
}

export async function endConsultation(id: string) {
  await api.post(`/appointments/${id}/consultation/end`);
}

export async function saveConsultationReport(id: string, input: ConsultationReportInput) {
  const res = await api.put<ConsultationReport>(`/appointments/${id}/consultation/report`, input);
  return res.data;
}
