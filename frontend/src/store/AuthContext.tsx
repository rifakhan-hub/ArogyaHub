import { createContext, useEffect, useState } from "react";
import { login, logout, refresh } from "@/api/auth";
import type { User } from "@/api/types";

interface AuthValue {
  user: User | null;
  checking: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    refresh()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));

    const onExpired = () => setUser(null);
    window.addEventListener("session-expired", onExpired);
    return () => window.removeEventListener("session-expired", onExpired);
  }, []);

  async function signIn(email: string, password: string) {
    const signedIn = await login(email, password);
    setUser(signedIn);
    return signedIn;
  }

  async function signOut() {
    await logout().catch(() => {});
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, checking, signIn, signOut }}>{children}</AuthContext.Provider>;
}
