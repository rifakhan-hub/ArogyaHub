import type { AuditLog, User } from "@/api/types";
import { buildSeed, type MockDb, oid, requestId } from "./seed";

export let db: MockDb = buildSeed();

/** Fresh data for each test. */
export function resetDb(now?: Date) {
  db = buildSeed(now);
}

// The real backend keeps the refresh token in an HttpOnly cookie. The mock stands in for that
// cookie with a localStorage entry so a page reload keeps you signed in.
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
  const id = token?.startsWith("mock-access.") ? token.split(".")[1] : undefined;
  return id ? db.users.find((u) => u.id === id) : undefined;
};

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
