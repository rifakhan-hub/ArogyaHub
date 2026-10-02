// The app starts here. In development it first starts the fake backend in src/mocks.
import "@/styles/fonts.css";
import "@/styles/theme.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Providers } from "@/app/providers";
import { routes } from "@/app/router";
import { env } from "@/lib/env";

async function startMockBackend() {
  if (!env.USE_MOCKS) return;
  const { worker } = await import("@/mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass", quiet: true });
}

const router = createBrowserRouter(routes);

startMockBackend().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  );
});
