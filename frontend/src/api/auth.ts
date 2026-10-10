import { api, setAccessToken } from "./client";
import type { AccountInput, Doctor, DoctorRegisterInput, TokenResponse, User } from "./types";

export async function register(input: AccountInput) {
  const res = await api.post<User>("/auth/register", input);
  return res.data;
}

export async function registerDoctor(input: DoctorRegisterInput) {
  const res = await api.post<Doctor>("/auth/register/doctor", input);
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await api.post<TokenResponse>("/auth/login", { email, password });
  setAccessToken(res.data.access_token);
  return res.data.user;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

export { refreshAccessToken as refresh } from "./client";
