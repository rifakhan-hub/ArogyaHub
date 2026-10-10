import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { AccountInput } from "@/api/types";
import { renderApp } from "./render";
import { server } from "./server";

const URL = "*/api/v1/auth/register";

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
    let sent: AccountInput | undefined;
    server.use(
      http.post(URL, async ({ request }) => {
        sent = (await request.json()) as AccountInput;
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
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("heading", { name: "Account created" })).toBeInTheDocument();
    expect(screen.getByText(/welcome to aarogyahub, aman gill/i)).toBeInTheDocument();
    expect(sent).toEqual({
      name: "Aman Gill",
      email: "aman@example.com",
      phone: "+919811112222",
      city: "Patiala",
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

describe("login", () => {
  const patient = {
    id: "9",
    name: "Aman Gill",
    email: "aman@example.com",
    phone: null,
    city: null,
    role: "patient",
    is_active: true,
    is_email_verified: false,
    blocked_reason: null,
    created_at: new Date().toISOString(),
    last_login_at: null,
  };

  it("sends a patient to the patient portal, and logs out to the home page", async () => {
    server.use(
      http.post("*/api/v1/auth/login", () =>
        HttpResponse.json({ access_token: "patient-token", token_type: "bearer", user: patient }),
      ),
    );
    const user = userEvent.setup();
    const { router } = renderApp("/login");

    await user.type(await screen.findByLabelText("Email"), "aman@example.com");
    await user.type(screen.getByLabelText("Password"), "a-strong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("heading", { name: "Welcome, Aman" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/patient");

    await user.click(screen.getByRole("link", { name: "Log out" }));
    expect(await screen.findByRole("link", { name: "Sign up" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("fills in the email after registering", async () => {
    renderApp("/login?email=aman%40example.com");
    expect(await screen.findByLabelText("Email")).toHaveValue("aman@example.com");
  });

  it("links to the register page", async () => {
    renderApp("/login");
    expect(await screen.findByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/register");
  });
});
