import { http, HttpResponse } from "msw";
import type { LoginRequest } from "@/api/types";
import { accessTokenFor, db, mockSession, userFromToken, writeAudit } from "../db";
import { API, fail, latency } from "./helpers";

export const authHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    await latency();
    const body = (await request.json()) as LoginRequest;
    const user = db.users.find((u) => u.email.toLowerCase() === body.email?.toLowerCase());
    if (!user || db.passwords.get(user.id) !== body.password) {
      writeAudit(null, {
        action: "auth.login_failed",
        entity_type: "auth",
        entity_id: user?.id ?? "unknown",
        metadata: { email: body.email, reason: "wrong_password" },
      });
      return fail(401, "INVALID_CREDENTIALS", "That email and password don't match. Check them and try again.");
    }
    if (!user.is_active) return fail(403, "ACCOUNT_BLOCKED", "This account is blocked. Contact support.");
    user.last_login_at = new Date().toISOString();
    mockSession.set(user.id);
    writeAudit(user, { action: "auth.login", entity_type: "auth", entity_id: user.id, metadata: { method: "password" } });
    return HttpResponse.json({ access_token: accessTokenFor(user.id), token_type: "bearer", user });
  }),

  http.post(`${API}/auth/refresh`, async () => {
    await latency();
    const id = mockSession.get();
    const user = id ? db.users.find((u) => u.id === id && u.is_active) : undefined;
    if (!user) return fail(401, "NO_SESSION", "Log in to continue.");
    return HttpResponse.json({ access_token: accessTokenFor(user.id), token_type: "bearer", user });
  }),

  http.post(`${API}/auth/logout`, async () => {
    mockSession.clear();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/users/me`, async ({ request }) => {
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? null;
    const user = userFromToken(token);
    if (!user) return fail(401, "UNAUTHENTICATED", "Log in to continue.");
    return HttpResponse.json(user);
  }),
];
