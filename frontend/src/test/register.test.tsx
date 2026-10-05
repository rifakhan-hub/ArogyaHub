import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { RegisterRequest } from "@/api/types";
import { renderApp } from "./render";
import { server } from "./server";

const URL = "*/api/v1/users";

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Full name"), "Aman Gill");
  await user.type(screen.getByLabelText("Email"), "aman@example.com");
  await user.type(screen.getByLabelText(/phone/i), "+919811112222");
  await user.type(screen.getByLabelText(/city/i), "Patiala");
  await user.type(screen.getByLabelText("Password"), "a-strong-password");
  await user.type(screen.getByLabelText("Confirm password"), "a-strong-password");
}

describe("register", () => {
  it("creates an account and shows a welcome message", async () => {
    let sent: RegisterRequest | undefined;
    server.use(
      http.post(URL, async ({ request }) => {
        sent = (await request.json()) as RegisterRequest;
        return HttpResponse.json(
          {
            id: "8",
            ...sent,
            password: undefined,
            is_active: true,
            is_email_verified: false,
            blocked_reason: null,
            created_at: new Date().toISOString(),
            last_login_at: null,
          },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderApp("/register");

    await fillForm(user);
    await user.click(screen.getByRole("radio", { name: /doctor/i }));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("heading", { name: "Account created" })).toBeInTheDocument();
    expect(screen.getByText(/welcome to aarogyahub, aman gill/i)).toBeInTheDocument();
    expect(sent).toEqual({
      name: "Aman Gill",
      email: "aman@example.com",
      phone: "+919811112222",
      city: "Patiala",
      role: "doctor",
      password: "a-strong-password",
    });
  });

  it("checks the form before sending anything", async () => {
    let called = false;
    server.use(
      http.post(URL, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();
    renderApp("/register");

    await user.type(await screen.findByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Enter your full name")).toBeInTheDocument();
    expect(screen.getByText(/enter an email address/i)).toBeInTheDocument();
    expect(screen.getByText("Use at least 8 characters")).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it("shows the server's message when the email is already used", async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json(
          { error: { code: "EMAIL_TAKEN", message: "An account with this email already exists." } },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp("/register");

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("An account with this email already exists.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("is linked from the home page header", async () => {
    renderApp("/");
    expect(await screen.findByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/register");
  });
});
