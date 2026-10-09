import type { Role } from "@/api/types";

export const HOME_PATH: Record<Role, string> = {
  admin: "/admin",
  patient: "/patient",
  doctor: "/doctor",
};

export const PORTAL_LABEL: Record<Role, string> = {
  admin: "Admin console",
  patient: "My portal",
  doctor: "My portal",
};
