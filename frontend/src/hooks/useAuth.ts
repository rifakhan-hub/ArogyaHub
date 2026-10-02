import { useContext } from "react";
import { AuthContext } from "@/store/AuthContext";

/** The signed-in user and the signIn / signOut functions. */
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside <AuthProvider>");
  return auth;
}
