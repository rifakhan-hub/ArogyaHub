import { api, setAccessToken } from "./client";
import type { RegisterRequest, TokenResponse, User } from "./types";

export async function register(input: RegisterRequest) {
  const res = await api.post<User>("/auth/register", input);
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
