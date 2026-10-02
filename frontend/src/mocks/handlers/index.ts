/**
 * The mock API: it answers the same URLs as the real backend (architecture doc section 8),
 * using the in-memory sample data in ../db.ts. It follows the documented backend rules:
 * admin-only access, the verification state machine, required reasons, an audit entry for
 * every sensitive action, and the { error: { code, message, request_id } } error shape.
 */
import { analyticsHandlers } from "./analytics";
import { appointmentsHandlers } from "./appointments";
import { auditLogHandlers } from "./audit-log";
import { authHandlers } from "./auth";
import { doctorsHandlers } from "./doctors";
import { knowledgeBaseHandlers } from "./knowledge-base";
import { usersHandlers } from "./users";

export const handlers = [
  ...authHandlers,
  ...analyticsHandlers,
  ...doctorsHandlers,
  ...usersHandlers,
  ...appointmentsHandlers,
  ...knowledgeBaseHandlers,
  ...auditLogHandlers,
];
