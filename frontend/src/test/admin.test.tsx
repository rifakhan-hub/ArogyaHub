import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { db } from "@/mocks/db";
import { renderApp, signInAs } from "./render";

describe("access", () => {
  it("sends signed-out visitors to the login page", async () => {
    const { router } = renderApp("/admin/users");
    await screen.findByRole("heading", { name: /log in to the admin console/i });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toBe("?next=%2Fadmin%2Fusers");
  });

  it("shows the no-access page to a signed-in patient", async () => {
    signInAs("patient");
    const { router } = renderApp("/admin");
    await screen.findByRole("heading", { name: /don't have access/i });
    expect(router.state.location.pathname).toBe("/403");
  });
});

describe("login", () => {
  it("signs an admin in and opens the page they asked for", async () => {
    const user = userEvent.setup();
    const { router } = renderApp("/login?next=%2Fadmin%2Faudit");
    await user.type(await screen.findByLabelText("Email"), "admin@aarogyahub.in");
    await user.type(screen.getByLabelText("Password"), "Admin@123");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    await screen.findByRole("heading", { name: "Audit log" });
    expect(router.state.location.pathname).toBe("/admin/audit");
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

describe("doctor verification", () => {
  const pendingDoctors = () =>
    db.doctors.filter((d) => d.verification_status === "pending").sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));

  it("needs a reason before rejecting, and sends nothing without one", async () => {
    signInAs("admin");
    const user = userEvent.setup();
    const [doctor] = pendingDoctors();
    renderApp("/admin/verifications");

    await user.click(await screen.findByRole("button", { name: doctor.name }));
    const panel = await screen.findByRole("dialog", { name: `Review ${doctor.name}` });
    await user.click(await within(panel).findByRole("button", { name: "Reject" }));

    expect(await within(panel).findByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(db.doctors.find((d) => d.id === doctor.id)?.verification_status).toBe("pending");
  });

  it("approves a doctor, moves to the next one and writes an audit entry", async () => {
    signInAs("admin");
    const user = userEvent.setup();
    const [first, second] = pendingDoctors();
    renderApp("/admin/verifications");

    await user.click(await screen.findByRole("button", { name: first.name }));
    const panel = await screen.findByRole("dialog", { name: `Review ${first.name}` });
    await user.click(await within(panel).findByRole("button", { name: "Approve" }));

    await screen.findByRole("dialog", { name: `Review ${second.name}` });
    expect(db.doctors.find((d) => d.id === first.id)?.verification_status).toBe("verified");
    expect(db.audit.find((l) => l.action === "doctor.approve" && l.entity_id === first.id)).toBeDefined();
  });
});

describe("users", () => {
  it("requires a reason, then blocks the user", async () => {
    signInAs("admin");
    const user = userEvent.setup();
    const target = db.users.find((u) => u.role === "patient" && u.is_active && u.email !== "patient@aarogyahub.in")!;
    renderApp(`/admin/users?open=${target.id}`);

    const panel = await screen.findByRole("dialog", { name: target.name });
    await user.click(await within(panel).findByRole("button", { name: "Block user" }));

    const confirm = await screen.findByRole("dialog", { name: `Block ${target.name}?` });
    await user.click(within(confirm).getByRole("button", { name: "Block user" }));
    expect(await within(confirm).findByText(/at least 10 characters/i)).toBeInTheDocument();

    await user.type(within(confirm).getByLabelText("Reason"), "Abusive messages to three doctors");
    await user.click(within(confirm).getByRole("button", { name: "Block user" }));

    await waitFor(() => expect(db.users.find((u) => u.id === target.id)?.is_active).toBe(false));
    expect(db.audit[0]).toMatchObject({ action: "user.block", entity_id: target.id });
  });
});
