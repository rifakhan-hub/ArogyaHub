import { api } from "./client";
import type { AvailabilityBlock, Doctor, DoctorDocument, DoctorProfileInput, DocumentType } from "./types";

export async function updateMyProfile(input: DoctorProfileInput) {
  const res = await api.put<Doctor>("/doctors/me", input);
  return res.data;
}

export async function addAvailability(block: Omit<AvailabilityBlock, "id">) {
  const res = await api.post<AvailabilityBlock>("/doctors/me/availability", block);
  return res.data;
}

export async function removeAvailability(id: string) {
  await api.delete(`/doctors/me/availability/${id}`);
}

export async function uploadDocument(docType: DocumentType, file: File) {
  const form = new FormData();
  form.append("doc_type", docType);
  form.append("file", file);
  const res = await api.post<DoctorDocument>("/doctors/me/documents", form);
  return res.data;
}

export async function deleteDocument(id: string) {
  await api.delete(`/doctors/me/documents/${id}`);
}
