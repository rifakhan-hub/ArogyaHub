import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { todayIST } from "@/lib/dates";
import { renderApp, signInAs } from "./render";
import { appointments, blocks, consultationReports, documents, reports, server } from "./server";

describe("patient portal", () => {
  it("shows the next consultation and the report count", async () => {
    signInAs("patient");
    renderApp("/patient");
    expect(await screen.findByRole("heading", { name: "Welcome, Priya" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Next consultation" })).toBeInTheDocument();
    expect(screen.getByText("Dr. Anjali Mehta")).toBeInTheDocument();
    expect(screen.getByText("Blood test - CBC")).toBeInTheDocument();
  });

  it("books a free slot with a doctor", async () => {
    signInAs("patient");
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.post("*/api/v1/appointments", async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        appointments.push({ ...appointments[0], id: "99", start_time: sent.start_time as string });
        return HttpResponse.json(appointments[appointments.length - 1], { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderApp("/patient/doctors");

    await user.click(await screen.findByRole("button", { name: "Book Dr. Anjali Mehta" }));
    const dialog = await screen.findByRole("dialog", { name: "Book Dr. Anjali Mehta" });
    const confirm = within(dialog).getByRole("button", { name: "Confirm booking" });
    expect(confirm).toBeDisabled();

    await user.click(await within(dialog).findByRole("button", { name: "09:30" }));
    await user.type(within(dialog).getByLabelText(/reason/i), "Itchy skin");
    await user.click(confirm);

    expect(await screen.findByRole("heading", { name: "My appointments" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/patient/appointments");
    expect(sent).toEqual({ doctor_id: 10, start_time: `${todayIST()}T04:00:00Z`, reason: "Itchy skin" });
  });

  it("cancels an upcoming appointment", async () => {
    signInAs("patient");
    const user = userEvent.setup();
    renderApp("/patient/appointments");

    const upcoming = (await screen.findByRole("heading", { name: "Upcoming" })).closest("section")!;
    await user.click(within(upcoming).getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("No upcoming consultations")).toBeInTheDocument();
    expect(appointments.find((a) => a.id === "20")?.status).toBe("cancelled");
  });

  it("shows the doctor's report for a finished consultation", async () => {
    signInAs("patient");
    const user = userEvent.setup();
    renderApp("/patient/appointments");

    await user.click(await screen.findByRole("button", { name: "View report" }));
    const dialog = await screen.findByRole("dialog", { name: "Consultation report" });
    expect(await within(dialog).findByText("Contact dermatitis")).toBeInTheDocument();
    expect(within(dialog).getByText("Cetirizine 10 mg")).toBeInTheDocument();
  });

  it("uploads, shares and deletes reports", async () => {
    signInAs("patient");
    const user = userEvent.setup({ applyAccept: false });
    renderApp("/patient/reports");

    await screen.findByRole("heading", { name: "Reports" });
    await user.upload(screen.getByLabelText(/upload report/i), new File(["%PDF"], "Lipid profile.pdf", { type: "application/pdf" }));
    const row = (await screen.findByText("Lipid profile")).closest("li")!;
    expect(reports[0].title).toBe("Lipid profile");

    await user.selectOptions(within(row).getByLabelText("Share Lipid profile with"), "Dr. Anjali Mehta");
    expect(await within(row).findByRole("button", { name: "Stop sharing with Dr. Anjali Mehta" })).toBeInTheDocument();

    await user.click(within(row).getByRole("button", { name: "Stop sharing with Dr. Anjali Mehta" }));
    expect(await within(row).findByText("nobody")).toBeInTheDocument();

    await user.click(within(row).getByRole("button", { name: "Delete Lipid profile" }));
    expect(await screen.findByText("Deleted Lipid profile")).toBeInTheDocument();
    expect(reports.map((r) => r.title)).toEqual(["Blood test - CBC"]);
  });

  it("shows the portal links in the sidebar", async () => {
    signInAs("patient");
    renderApp("/patient");
    const nav = await screen.findByRole("navigation", { name: "Patient portal" });
    expect(within(nav).getAllByRole("link").map((l) => l.textContent)).toEqual([
      "Home",
      "Appointments",
      "Reports",
      "Find a doctor",
      "Profile",
    ]);
  });

  it("shows and edits the patient's own profile", async () => {
    signInAs("patient");
    const user = userEvent.setup();
    renderApp("/patient/profile");

    expect(await screen.findByText("B+")).toBeInTheDocument();
    expect(screen.getByText("Penicillin")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit profile" }));
    await user.selectOptions(screen.getByLabelText(/blood group/i), "O-");
    await user.clear(screen.getByLabelText(/allergies/i));
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByText("O-")).toBeInTheDocument();
    expect(screen.getByText("None recorded")).toBeInTheDocument();
  });

  it("keeps patients out of the doctor portal", async () => {
    signInAs("patient");
    const { router } = renderApp("/doctor");
    await screen.findByRole("heading", { name: /don't have access/i });
    expect(router.state.location.pathname).toBe("/403");
  });
});

describe("doctor portal", () => {
  it("shows today's patients", async () => {
    signInAs("doctor");
    renderApp("/doctor");
    expect(await screen.findByRole("heading", { name: "Today's schedule" })).toBeInTheDocument();
    expect(screen.getAllByText("Rahul Verma").length).toBeGreaterThan(0);
  });

  it("starts a consultation, writes the report and ends it", async () => {
    signInAs("doctor");
    const user = userEvent.setup();
    renderApp("/doctor/appointments");

    await user.click(await screen.findByRole("button", { name: "Start consultation" }));
    await user.click(await screen.findByRole("button", { name: "Write report" }));

    const dialog = await screen.findByRole("dialog", { name: "Consultation report" });
    await user.type(await within(dialog).findByLabelText("Diagnosis"), "Viral fever");
    await user.type(within(dialog).getByLabelText(/prescription/i), "Paracetamol 500 mg");
    await user.click(within(dialog).getByRole("button", { name: "Save report" }));
    expect(await screen.findByText("Saved the report for Rahul Verma")).toBeInTheDocument();
    expect(consultationReports["21"].diagnosis).toBe("Viral fever");

    await user.click(screen.getByRole("button", { name: "End consultation" }));
    expect(await screen.findByText("Ended with Rahul Verma")).toBeInTheDocument();
    expect(appointments.find((a) => a.id === "21")?.status).toBe("completed");
  });

  it("adds and removes weekly hours on the calendar", async () => {
    signInAs("doctor");
    const user = userEvent.setup();
    renderApp("/doctor/schedule");

    await screen.findByRole("heading", { name: "Schedule" });
    await user.click(screen.getAllByRole("button", { name: /^Sunday/ })[0]);
    expect(screen.getByText("You don't work on Sundays yet.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add hours" }));
    expect(await screen.findByRole("button", { name: "Remove Sunday 09:00–12:00" })).toBeInTheDocument();
    expect(blocks.some((b) => b.day_of_week === 6)).toBe(true);

    await user.click(screen.getByRole("button", { name: "Add hours" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("overlap hours you already have");

    await user.click(screen.getByRole("button", { name: "Remove Sunday 09:00–12:00" }));
    expect(await screen.findByText("You don't work on Sundays yet.")).toBeInTheDocument();
  });

  it("moves between months", async () => {
    signInAs("doctor");
    const user = userEvent.setup();
    renderApp("/doctor/schedule");

    const title = await screen.findByRole("heading", { level: 2, name: /^[A-Z][a-z]+ \d{4}$/ });
    const thisMonth = title.textContent;
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(title.textContent).not.toBe(thisMonth);
    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(title.textContent).toBe(thisMonth);
  });

  it("lists reports patients shared with the doctor", async () => {
    signInAs("doctor");
    renderApp("/doctor/reports");
    expect(await screen.findByText("Blood test - CBC")).toBeInTheDocument();
    expect(screen.getByText(/Priya Sharma/)).toBeInTheDocument();
  });

  it("uploads a licence from the profile page", async () => {
    signInAs("doctor");
    const user = userEvent.setup({ applyAccept: false });
    renderApp("/doctor/profile");

    await screen.findByRole("heading", { name: "Documents" });
    await user.upload(screen.getByLabelText(/upload file/i), new File(["%PDF"], "licence.pdf", { type: "application/pdf" }));
    expect(await screen.findByText(/licence\.pdf/)).toBeInTheDocument();
    expect(documents[0].doc_type).toBe("licence");
  });
});
