import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { DoctorRegisterInput } from "@/api/types";
import { renderApp, signInAs } from "./render";
import { doctors, server } from "./server";

type User = ReturnType<typeof userEvent.setup>;

const URL = "*/api/v1/auth/register/doctor";
const PASSWORD = "Strong-pass-123";

async function doctorCard() {
  return within(await screen.findByRole("region", { name: "I'm a doctor" }));
}

async function fillDoctorForm(user: User) {
  const card = await doctorCard();
  await user.type(card.getByLabelText("Full name"), "Dr. Kavya Rao");
  await user.type(card.getByLabelText("Email"), "kavya@example.com");
  await user.type(card.getByLabelText("Password"), PASSWORD);
  await user.type(card.getByLabelText("Confirm password"), PASSWORD);
  await user.selectOptions(card.getByLabelText("Speciality"), "Paediatrics");
  await user.type(card.getByLabelText("Registration (licence) number"), "PMC-9090");
  await user.type(card.getByLabelText("Medical council"), "Punjab Medical Council");
  await user.type(card.getByLabelText("Years of experience"), "7");
  await user.type(card.getByLabelText("Consultation fee (₹)"), "550");
  await user.type(card.getByLabelText("Qualifications"), "MBBS, DCH");
  return card;
}

describe("doctor sign-up", () => {
  it("sends the account and professional details for review", async () => {
    let sent: DoctorRegisterInput | undefined;
    server.use(
      http.post(URL, async ({ request }) => {
        sent = (await request.json()) as DoctorRegisterInput;
        return HttpResponse.json({ id: "20", verification_status: "pending" }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp("/register");

    const card = await fillDoctorForm(user);
    await user.click(card.getByRole("button", { name: "Submit for review" }));
    expect(card.getByRole("alert")).toHaveTextContent("Tick the box");

    await user.click(card.getByRole("checkbox"));
    await user.click(card.getByRole("button", { name: "Submit for review" }));

    expect(
      await card.findByRole("heading", { name: "Profile sent for review" }),
    ).toBeInTheDocument();
    expect(sent).toEqual({
      name: "Dr. Kavya Rao",
      email: "kavya@example.com",
      phone: null,
      city: null,
      password: PASSWORD,
      specialization: "Paediatrics",
      license_number: "PMC-9090",
      council: "Punjab Medical Council",
      experience_years: 7,
      consultation_fee: 550,
      qualifications: "MBBS, DCH",
      bio: null,
    });
  });

  it("checks every field before sending", async () => {
    let called = false;
    server.use(
      http.post(URL, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();
    renderApp("/register");
    const card = await doctorCard();

    await user.type(card.getByLabelText("Password"), "weakpassword");
    await user.type(card.getByLabelText("Years of experience"), "lots");
    await user.click(card.getByRole("checkbox"));
    await user.click(card.getByRole("button", { name: "Submit for review" }));

    expect(card.getByText("Enter your full name")).toBeInTheDocument();
    expect(card.getByText("Choose a stronger password")).toBeInTheDocument();
    expect(card.getByText("Choose your speciality")).toBeInTheDocument();
    expect(card.getByText("Enter years as a number, like 8")).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it("shows the server's message on the licence field", async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json(
          {
            error: {
              code: "LICENSE_TAKEN",
              message: "Another doctor has already registered this licence number.",
            },
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp("/register");

    const card = await fillDoctorForm(user);
    await user.click(card.getByRole("checkbox"));
    await user.click(card.getByRole("button", { name: "Submit for review" }));

    expect(
      await card.findByText("Another doctor has already registered this licence number."),
    ).toBeInTheDocument();
    expect(card.getByLabelText("Registration (licence) number")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("sends the old doctor sign-up link to the sign-up page", async () => {
    const { router } = renderApp("/register/doctor");
    expect(await screen.findByRole("region", { name: "I'm a doctor" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/register");
  });
});

describe("doctor approval", () => {
  it("shows a waiting screen until an admin approves the profile", async () => {
    signInAs("doctor");
    doctors[0].verification_status = "pending";
    renderApp("/doctor");
    expect(
      await screen.findByRole("heading", { name: "Your profile is under review" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Doctor portal" })).not.toBeInTheDocument();
  });

  it("shows the rejection reason and sends the fixed profile again", async () => {
    signInAs("doctor");
    doctors[0].verification_status = "rejected";
    doctors[0].rejection_reason = "Licence photo is blurry";
    let updated = false;
    server.use(
      http.put("*/api/v1/doctors/me", async ({ request }) => {
        updated = true;
        Object.assign(doctors[0], await request.json(), {
          verification_status: "pending",
          rejection_reason: null,
        });
        return HttpResponse.json(doctors[0]);
      }),
    );
    const user = userEvent.setup();
    renderApp("/doctor");

    expect(await screen.findByText("Licence photo is blurry")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Registration (licence) number"));
    await user.type(screen.getByLabelText("Registration (licence) number"), "PMC-10000-B");
    await user.click(screen.getByRole("button", { name: "Send for review again" }));

    expect(
      await screen.findByRole("heading", { name: "Your profile is under review" }),
    ).toBeInTheDocument();
    expect(updated).toBe(true);
    expect(doctors[0].license_number).toBe("PMC-10000-B");
  });

  it("opens the doctor portal once approved", async () => {
    signInAs("doctor");
    renderApp("/doctor/profile");
    expect(await screen.findByRole("heading", { name: "My profile" })).toBeInTheDocument();
    expect(screen.getByText("PMC-10000")).toBeInTheDocument();
  });
});

describe("doctor without a profile", () => {
  it("asks the doctor to finish the profile, then shows it is under review", async () => {
    signInAs("doctor");
    doctors.splice(0, 1);
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.put("*/api/v1/doctors/me", async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        doctors.push({
          ...(sent as object),
          id: "30",
          user_id: "4",
          verification_status: "pending",
          submitted_at: new Date().toISOString(),
        } as never);
        return HttpResponse.json(doctors[doctors.length - 1]);
      }),
    );
    const user = userEvent.setup();
    renderApp("/doctor");

    expect(
      await screen.findByRole("heading", { name: "Finish your doctor profile" }),
    ).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Speciality"), "ENT");
    await user.type(screen.getByLabelText("Registration (licence) number"), "PMC-4545");
    await user.type(screen.getByLabelText("Medical council"), "Punjab Medical Council");
    await user.type(screen.getByLabelText("Years of experience"), "5");
    await user.type(screen.getByLabelText("Consultation fee (₹)"), "450");
    await user.type(screen.getByLabelText("Qualifications"), "MBBS, MS (ENT)");
    await user.click(screen.getByRole("button", { name: "Send for review" }));

    expect(
      await screen.findByRole("heading", { name: "Your profile is under review" }),
    ).toBeInTheDocument();
    expect(sent).toMatchObject({
      specialization: "ENT",
      license_number: "PMC-4545",
      consultation_fee: 450,
    });
  });
});
