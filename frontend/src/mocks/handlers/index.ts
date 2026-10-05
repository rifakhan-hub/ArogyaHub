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
