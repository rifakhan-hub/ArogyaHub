import type { AuditLog, User } from "@/api/types";
import { buildSeed, type MockDb, oid, requestId } from "./seed";

export let db: MockDb = buildSeed();

export function resetDb(now?: Date) {
  db = buildSeed(now);
}

const SESSION_KEY = "ah-mock-refresh";
const memSession = new Map<string, string>();
export const mockSession = {
  get(): string | null {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return memSession.get(SESSION_KEY) ?? null;
    }
  },
  set(userId: string) {
    try {
      localStorage.setItem(SESSION_KEY, userId);
    } catch {
      memSession.set(SESSION_KEY, userId);
    }
  },
  clear() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      memSession.delete(SESSION_KEY);
    }
  },
};

export const accessTokenFor = (userId: string) => `mock-access.${userId}.${Date.now()}`;
export const userFromToken = (token: string | null): User | undefined => {
  if (!token) return undefined;
  if (!token.startsWith("mock-access.")) return userFromBackendToken(token);
  const id = token.split(".")[1];
  return db.users.find((u) => u.id === id);
};

function userFromBackendToken(token: string): User | undefined {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return {
      id: String(payload.sub),
      name: "Admin",
      email: "",
      phone: null,
      role: payload.role,
      is_active: true,
      is_email_verified: true,
      created_at: new Date().toISOString(),
      last_login_at: null,
    };
  } catch {
    return undefined;
  }
}

export function writeAudit(
  actor: User | null,
  entry: Pick<AuditLog, "action" | "entity_type" | "entity_id" | "metadata">,
) {
  const log: AuditLog = {
    id: oid(),
    actor: actor ? { id: actor.id, name: actor.name, role: actor.role } : null,
    ip: "127.0.0.1",
    request_id: requestId(),
    created_at: new Date().toISOString(),
    ...entry,
  };
  db.audit.unshift(log);
  return log;
}
