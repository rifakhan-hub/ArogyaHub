import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { setAccessToken } from "@/api/client";
import { resetDb } from "@/mocks/db";
import { server } from "./server";

// the first test in a file also downloads the lazy page code, so give it a bit longer
configure({ asyncUtilTimeout: 10000 });

// jsdom (the fake browser used by tests) doesn't have these, so add simple versions
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})) as unknown as typeof window.matchMedia;
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute("open");
  this.dispatchEvent(new Event("close"));
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => {
  resetDb(); // fresh sample data for every test
  localStorage.clear();
  setAccessToken(null);
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
