import { api } from "./client";

export async function openFile(path: string) {
  const res = await api.get<Blob>(path, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
