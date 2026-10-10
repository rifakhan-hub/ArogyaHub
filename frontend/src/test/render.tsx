import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { Role } from "@/api/types";
import { Providers } from "@/app/providers";
import { routes } from "@/app/router";
import { startSession } from "./server";

export function signInAs(role: Role) {
  return startSession(role);
}

export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { router };
}
