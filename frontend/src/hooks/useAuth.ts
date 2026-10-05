import { useContext } from "react";
import { AuthContext } from "@/store/AuthContext";

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside <AuthProvider>");
  return auth;
}
