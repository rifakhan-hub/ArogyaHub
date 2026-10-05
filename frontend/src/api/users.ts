import { api } from "./client";
import type { RegisterRequest, User } from "./types";

export async function registerUser(input: RegisterRequest) {
  const res = await api.post<User>("/users", input);
  return res.data;
}
