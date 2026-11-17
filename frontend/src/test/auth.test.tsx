import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { AccountInput } from "@/api/types";
import { renderApp } from "./render";
import { server } from "./server";

const URL = "*/api/v1/auth/register";
const PASSWORD = "Strong-pass-123";

async function patientCard() {
  return within(await screen.findByRole("region", { name: "I'm a patient" }));
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  const card = await patientCard();
  await user.type(card.getByLabelText("Full name"), "Aman Gill");
  await user.type(card.getByLabelText("Email"), "aman@example.com");
  await user.type(card.getByLabelText(/phone/i), "+919811112222");
  await user.type(card.getByLabelText(/city/i), "Patiala");
  await user.type(card.getByLabelText("Password"), PASSWORD);
  await user.type(card.getByLabelText("Confirm password"), PASSWORD);
  return card;
}

describe("register", () => {
  it("shows the patient and doctor forms side by side", async () => {
    renderApp("/register");
    expect(await screen.findByRole("heading", { name: "Create your account" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "I'm a patient" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "I'm a doctor" })).toBeInTheDocument();
  });

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

    const card = await fillForm(user);
    await user.click(card.getByRole("button", { name: "Create account" }));

    expect(await card.findByRole("heading", { name: "Account created" })).toBeInTheDocument();
    expect(card.getByText(/welcome to aarogyahub, aman gill/i)).toBeInTheDocument();
    expect(sent).toEqual({
      name: "Aman Gill",
      email: "aman@example.com",
      phone: "+919811112222",
      city: "Patiala",
      password: PASSWORD,
    });
  });

  it("shows how strong the password is while typing", async () => {
    const user = userEvent.setup();
    renderApp("/register");
    const card = await patientCard();
    const password = card.getByLabelText("Password");

    expect(card.queryByText(/password strength/i)).not.toBeInTheDocument();
    await user.type(password, "abc");
    expect(card.getByText("Password strength: Too short")).toBeInTheDocument();
    await user.type(password, "defghi");
    expect(card.getByText("Password strength: Weak")).toBeInTheDocument();
    await user.type(password, "1A");
    expect(card.getByText("Password strength: Good")).toBeInTheDocument();
    expect(card.getByText("A symbol")).toHaveTextContent("(missing)");
    await user.type(password, "!");
    expect(card.getByText("Password strength: Strong")).toBeInTheDocument();
    expect(card.getByText("A symbol")).toHaveTextContent("(done)");
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
    const card = await patientCard();

    await user.type(card.getByLabelText("Email"), "not-an-email");
    await user.type(card.getByLabelText("Password"), "allsmallletters");
    await user.click(card.getByRole("button", { name: "Create account" }));

    expect(await card.findByText("Enter your full name")).toBeInTheDocument();
    expect(card.getByText(/enter an email address/i)).toBeInTheDocument();
    expect(card.getByText("Choose a stronger password")).toBeInTheDocument();
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

    const card = await fillForm(user);
    await user.click(card.getByRole("button", { name: "Create account" }));

    expect(await card.findByText("An account with this email already exists.")).toBeInTheDocument();
    expect(card.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("is linked from the home page header", async () => {
    renderApp("/");
    expect(await screen.findByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/register",
    );
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
    await user.type(screen.getByLabelText("Password"), PASSWORD);
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
    expect(await screen.findByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
