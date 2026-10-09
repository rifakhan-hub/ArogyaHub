import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp, signInAs } from "./render";

describe("patient portal", () => {
  it("shows the dashboard with the next consultation", async () => {
    signInAs("patient");
    renderApp("/patient");
    expect(await screen.findByRole("heading", { name: /^welcome,/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Next consultation" })).toBeInTheDocument();
    expect(screen.getByText("Dr. Simran Kaur")).toBeInTheDocument();
  });

  it("books a doctor and lists the new appointment", async () => {
    signInAs("patient");
    const user = userEvent.setup();
    const { router } = renderApp("/patient/doctors");

    await user.click(await screen.findByRole("button", { name: "Book Dr. Kavya Iyer" }));
    const dialog = await screen.findByRole("dialog", { name: "Book Dr. Kavya Iyer" });
    const confirm = within(dialog).getByRole("button", { name: "Confirm booking" });
    expect(confirm).toBeDisabled();

    await user.click(within(dialog).getByRole("button", { name: "11:00" }));
    await user.click(confirm);

    expect(await screen.findByRole("heading", { name: "My appointments" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/patient/appointments");
    expect(screen.getByText("Dr. Kavya Iyer")).toBeInTheDocument();
  });

  it("cancels an upcoming appointment", async () => {
    signInAs("patient");
    const user = userEvent.setup();
    renderApp("/patient/appointments");

    const upcoming = (await screen.findByRole("heading", { name: "Upcoming" })).closest("section")!;
    const before = within(upcoming).getAllByRole("button", { name: "Cancel" }).length;
    await user.click(within(upcoming).getAllByRole("button", { name: "Cancel" })[0]);

    expect(within(upcoming).queryAllByRole("button", { name: "Cancel" })).toHaveLength(before - 1);
    expect(screen.getAllByText("Cancelled").length).toBeGreaterThan(0);
  });

  it("keeps patients out of the doctor portal", async () => {
    signInAs("patient");
    const { router } = renderApp("/doctor");
    await screen.findByRole("heading", { name: /don't have access/i });
    expect(router.state.location.pathname).toBe("/403");
  });
});

describe("doctor portal", () => {
  it("shows today's schedule", async () => {
    signInAs("doctor");
    renderApp("/doctor");
    expect(await screen.findByRole("heading", { name: "Today's schedule" })).toBeInTheDocument();
    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
  });

  it("marks a consultation as done", async () => {
    signInAs("doctor");
    const user = userEvent.setup();
    renderApp("/doctor/appointments");

    const upcoming = (await screen.findByRole("heading", { name: "Upcoming" })).closest("section")!;
    const before = within(upcoming).getAllByRole("button", { name: "Mark done" }).length;
    await user.click(within(upcoming).getAllByRole("button", { name: "Mark done" })[0]);

    expect(within(upcoming).queryAllByRole("button", { name: "Mark done" })).toHaveLength(before - 1);
  });

  it("picks a day on the calendar and adds weekly hours for it", async () => {
    signInAs("doctor");
    const user = userEvent.setup();
    renderApp("/doctor/schedule");

    await screen.findByRole("heading", { name: "Schedule" });
    const sunday = screen.getAllByRole("button", { name: /^Sunday/ })[0];
    await user.click(sunday);
    expect(sunday).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("You don't work on Sundays yet.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add hours" }));
    expect(screen.getByRole("button", { name: "Remove Sunday 09:00–12:00" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add hours" }));
    expect(screen.getByRole("alert")).toHaveTextContent("overlap hours you already have on Sundays");

    await user.click(screen.getByRole("button", { name: "Remove Sunday 09:00–12:00" }));
    expect(screen.getByText("You don't work on Sundays yet.")).toBeInTheDocument();
  });

  it("marks a day off on the calendar", async () => {
    signInAs("doctor");
    const user = userEvent.setup();
    renderApp("/doctor/schedule");

    await screen.findByRole("heading", { name: "Schedule" });
    await user.click(screen.getByRole("button", { name: "Take this day off" }));
    expect(screen.getByRole("button", { name: "Undo day off" })).toBeInTheDocument();
    expect(screen.getByRole("button", { pressed: true })).toHaveAccessibleName(/day off$/);
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
});
