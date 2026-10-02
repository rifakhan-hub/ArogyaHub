import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { Role } from "@/api/types";
import { Providers } from "@/app/providers";
import { routes } from "@/app/router";
import { db, mockSession } from "@/mocks/db";

/** Signs in a sample user with this role before the app starts (like a remembered session). */
export function signInAs(role: Role) {
  const user = role === "admin" ? db.users.find((u) => u.email === "admin@aarogyahub.in") : db.users.find((u) => u.role === role);
  if (!user) throw new Error(`no sample ${role}`);
  mockSession.set(user.id);
  return user;
}

/** Renders the whole app at a URL. */
export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { router };
}
