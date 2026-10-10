import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { DoctorRegisterInput } from "@/api/types";
import { renderApp, signInAs } from "./render";
import { doctors, server } from "./server";

type User = ReturnType<typeof userEvent.setup>;

async function fillAccount(user: User) {
  await user.type(await screen.findByLabelText("Full name"), "Dr. Kavya Rao");
  await user.type(screen.getByLabelText("Email"), "kavya@example.com");
  await user.type(screen.getByLabelText("Password"), "a-strong-password");
  await user.type(screen.getByLabelText("Confirm password"), "a-strong-password");
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

async function fillProfessional(user: User) {
  await user.selectOptions(await screen.findByLabelText("Speciality"), "Paediatrics");
  await user.type(screen.getByLabelText("Registration (licence) number"), "PMC-9090");
  await user.type(screen.getByLabelText("Medical council"), "Punjab Medical Council");
  await user.type(screen.getByLabelText("Years of experience"), "7");
  await user.type(screen.getByLabelText("Consultation fee (₹)"), "550");
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

async function fillAbout(user: User) {
  await user.type(await screen.findByLabelText("Qualifications"), "MBBS, DCH");
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

describe("doctor sign-up", () => {
  it("goes through four steps and sends the profile for review", async () => {
    let sent: DoctorRegisterInput | undefined;
    server.use(
      http.post("*/api/v1/auth/register/doctor", async ({ request }) => {
        sent = (await request.json()) as DoctorRegisterInput;
        return HttpResponse.json({ id: "20", verification_status: "pending" }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp("/register/doctor");

    await fillAccount(user);
    expect(await screen.findByRole("heading", { name: "Professional details" })).toBeInTheDocument();
    await fillProfessional(user);
    await fillAbout(user);

    expect(await screen.findByRole("heading", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByText("PMC-9090")).toBeInTheDocument();
    expect(screen.getByText("₹550")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Tick the box");

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Submit for review" }));

    expect(await screen.findByRole("heading", { name: "Profile sent for review" })).toBeInTheDocument();
    expect(sent).toEqual({
      name: "Dr. Kavya Rao",
      email: "kavya@example.com",
      phone: null,
      city: null,
      password: "a-strong-password",
      specialization: "Paediatrics",
      license_number: "PMC-9090",
      council: "Punjab Medical Council",
      experience_years: 7,
      consultation_fee: 550,
      qualifications: "MBBS, DCH",
      bio: null,
    });
  });

  it("does not move on until a step is filled in correctly", async () => {
    const user = userEvent.setup();
    renderApp("/register/doctor");

    await user.click(await screen.findByRole("button", { name: "Continue" }));
    expect(screen.getByText("Enter your full name")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();

    await fillAccount(user);
    await user.type(await screen.findByLabelText("Years of experience"), "lots");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Choose your speciality")).toBeInTheDocument();
    expect(screen.getByText("Enter years as a number, like 8")).toBeInTheDocument();
  });

  it("goes back to the licence step when the licence is already used", async () => {
    server.use(
      http.post("*/api/v1/auth/register/doctor", () =>
        HttpResponse.json(
          { error: { code: "LICENSE_TAKEN", message: "Another doctor has already registered this licence number." } },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp("/register/doctor");
    await fillAccount(user);
    await fillProfessional(user);
    await fillAbout(user);
    await user.click(await screen.findByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Submit for review" }));

    expect(await screen.findByRole("heading", { name: "Professional details" })).toBeInTheDocument();
    expect(screen.getByText("Another doctor has already registered this licence number.")).toBeInTheDocument();
  });

  it("is linked from the patient sign-up page", async () => {
    renderApp("/register");
    expect(await screen.findByRole("link", { name: "Join as a doctor" })).toHaveAttribute("href", "/register/doctor");
  });
});

describe("doctor approval", () => {
  it("shows a waiting screen until an admin approves the profile", async () => {
    signInAs("doctor");
    doctors[0].verification_status = "pending";
    renderApp("/doctor");
    expect(await screen.findByRole("heading", { name: "Your profile is under review" })).toBeInTheDocument();
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
        Object.assign(doctors[0], await request.json(), { verification_status: "pending", rejection_reason: null });
        return HttpResponse.json(doctors[0]);
      }),
    );
    const user = userEvent.setup();
    renderApp("/doctor");

    expect(await screen.findByText("Licence photo is blurry")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Registration (licence) number"));
    await user.type(screen.getByLabelText("Registration (licence) number"), "PMC-10000-B");
    await user.click(screen.getByRole("button", { name: "Send for review again" }));

    expect(await screen.findByRole("heading", { name: "Your profile is under review" })).toBeInTheDocument();
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

    expect(await screen.findByRole("heading", { name: "Finish your doctor profile" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Speciality"), "ENT");
    await user.type(screen.getByLabelText("Registration (licence) number"), "PMC-4545");
    await user.type(screen.getByLabelText("Medical council"), "Punjab Medical Council");
    await user.type(screen.getByLabelText("Years of experience"), "5");
    await user.type(screen.getByLabelText("Consultation fee (₹)"), "450");
    await user.type(screen.getByLabelText("Qualifications"), "MBBS, MS (ENT)");
    await user.click(screen.getByRole("button", { name: "Send for review" }));

    expect(await screen.findByRole("heading", { name: "Your profile is under review" })).toBeInTheDocument();
    expect(sent).toMatchObject({ specialization: "ENT", license_number: "PMC-4545", consultation_fee: 450 });
  });
});
