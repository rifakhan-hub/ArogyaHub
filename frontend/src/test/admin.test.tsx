import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp, signInAs } from "./render";
import { doctors, PASSWORD, users } from "./server";

describe("access", () => {
  it("sends signed-out visitors to the login page", async () => {
    const { router } = renderApp("/admin/patients");
    await screen.findByRole("heading", { name: /log in to aarogyahub/i });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toBe("?next=%2Fadmin%2Fpatients");
  });

  it("shows the no-access page to a signed-in patient", { timeout: 90_000 }, async () => {
    signInAs("patient");
    const { router } = renderApp("/admin");
    await screen.findByRole("heading", { name: /don't have access/i }, { timeout: 80_000 });
    expect(router.state.location.pathname).toBe("/403");
  });

  it("signs an admin in and opens the page they asked for", async () => {
    const user = userEvent.setup();
    const { router } = renderApp("/login?next=%2Fadmin%2Fdoctors");
    await user.type(await screen.findByLabelText("Email"), "admin@aarogyahub.in");
    await user.type(screen.getByLabelText("Password"), PASSWORD);
    await user.click(screen.getByRole("button", { name: "Log in" }));
    await screen.findByRole("heading", { name: "Doctors" });
    expect(router.state.location.pathname).toBe("/admin/doctors");
  });

  it("explains a wrong password and keeps the email", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await user.type(await screen.findByLabelText("Email"), "admin@aarogyahub.in");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText(/don't match/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("admin@aarogyahub.in");
  });
});

describe("doctors", () => {
  it("lists doctors waiting for review and approves one", async () => {
    signInAs("admin");
    const user = userEvent.setup();
    renderApp("/admin/doctors");

    await user.click(await screen.findByText("Dr. Ravi Kapoor"));
    const panel = await screen.findByRole("dialog", { name: "Review Dr. Ravi Kapoor" });
    expect(within(panel).getByText("PMC-11000")).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Approve" }));
    expect(await screen.findByText("Approved Dr. Ravi Kapoor")).toBeInTheDocument();
    expect(doctors.find((d) => d.id === "11")?.verification_status).toBe("verified");
  });

  it("needs a reason before rejecting", async () => {
    signInAs("admin");
    const user = userEvent.setup();
    renderApp("/admin/doctors");

    await user.click(await screen.findByText("Dr. Ravi Kapoor"));
    const panel = await screen.findByRole("dialog", { name: "Review Dr. Ravi Kapoor" });
    await user.click(within(panel).getByRole("button", { name: "Reject" }));
    await user.click(within(panel).getByRole("button", { name: "Confirm rejection" }));
    expect(within(panel).getByText(/at least 10 characters/)).toBeInTheDocument();
    expect(doctors.find((d) => d.id === "11")?.verification_status).toBe("pending");

    await user.type(
      within(panel).getByLabelText("Reason for rejecting"),
      "Licence photo is blurry",
    );
    await user.click(within(panel).getByRole("button", { name: "Confirm rejection" }));
    expect(await screen.findByText("Rejected Dr. Ravi Kapoor")).toBeInTheDocument();
    expect(doctors.find((d) => d.id === "11")?.rejection_reason).toBe("Licence photo is blurry");
  });
});

describe("patients", () => {
  it("blocks a patient after a reason is given", async () => {
    signInAs("admin");
    const user = userEvent.setup();
    renderApp("/admin/patients");

    await user.click(await screen.findByText("Rahul Verma"));
    const panel = await screen.findByRole("dialog", { name: "Patient Rahul Verma" });
    await user.click(within(panel).getByRole("button", { name: "Block patient" }));
    expect(within(panel).getByText(/at least 10 characters/)).toBeInTheDocument();

    await user.type(within(panel).getByLabelText("Reason for blocking"), "Repeated no-shows");
    await user.click(within(panel).getByRole("button", { name: "Block patient" }));
    expect(await screen.findByText("Blocked Rahul Verma")).toBeInTheDocument();
    expect(users.find((u) => u.name === "Rahul Verma")?.is_active).toBe(false);
  });
});

describe("patient details", () => {
  it("shows the patient's health details", async () => {
    signInAs("admin");
    const user = userEvent.setup();
    renderApp("/admin/patients");

    await user.click(await screen.findByText("Priya Sharma"));
    const panel = await screen.findByRole("dialog", { name: "Patient Priya Sharma" });
    expect(await within(panel).findByText("B+")).toBeInTheDocument();
    expect(within(panel).getByText("Penicillin")).toBeInTheDocument();
  });
});

describe("pages that are not built yet", () => {
  it("shows an empty page", async () => {
    signInAs("admin");
    renderApp("/admin/audit");
    expect(await screen.findByRole("heading", { name: "Audit log" })).toBeInTheDocument();
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });
});

describe("appointments", () => {
  it("lists every appointment with a summary", async () => {
    signInAs("admin");
    renderApp("/admin/appointments");

    expect(await screen.findByRole("heading", { name: "Appointments" })).toBeInTheDocument();
    const table = await screen.findByRole("table", { name: "Appointments" });
    expect(await within(table).findAllByText("Dr. Anjali Mehta")).toHaveLength(3);
    expect(within(table).getByText("Rahul Verma")).toBeInTheDocument();
    expect(screen.getByText("All appointments").nextElementSibling).toHaveTextContent("3");
    expect(screen.getByText("Completed consultations").nextElementSibling).toHaveTextContent("1");
  });

  it("filters by search and status", async () => {
    signInAs("admin");
    const user = userEvent.setup();
    renderApp("/admin/appointments");
    const table = await screen.findByRole("table", { name: "Appointments" });
    await within(table).findByText("Rahul Verma");

    await user.type(screen.getByPlaceholderText("Search patient or doctor"), "rahul");
    await waitFor(() => expect(within(table).queryByText("Priya Sharma")).not.toBeInTheDocument());
    expect(within(table).getByText("Rahul Verma")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search patient or doctor"));
    await user.selectOptions(screen.getByLabelText("Status"), "completed");
    await waitFor(() => expect(within(table).queryByText("Rahul Verma")).not.toBeInTheDocument());
    expect(await within(table).findAllByText("Priya Sharma")).toHaveLength(1);
  });

  it("shows the consultation and the doctor's notes", async () => {
    signInAs("admin");
    const user = userEvent.setup();
    renderApp("/admin/appointments?status=completed");
    const table = await screen.findByRole("table", { name: "Appointments" });

    await user.click((await within(table).findAllByText("Completed"))[0]);
    const panel = await screen.findByRole("dialog", { name: "Appointment with Dr. Anjali Mehta" });
    expect(await within(panel).findByText("Contact dermatitis")).toBeInTheDocument();
    expect(within(panel).getByRole("row", { name: /Cetirizine/ })).toBeInTheDocument();
    expect(within(panel).getByText("30 min")).toBeInTheDocument();
  });
});
