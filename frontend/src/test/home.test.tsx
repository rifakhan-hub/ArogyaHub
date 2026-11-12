import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp, signInAs } from "./render";

describe("home page", () => {
  it("shows the real verified doctors and their next free slot", async () => {
    renderApp("/");

    const list = (await screen.findByRole("heading", { name: "Find a doctor" })).closest(
      "section",
    )!;
    expect(
      await within(list).findByRole("heading", { name: /Dr. Anjali Mehta/ }),
    ).toBeInTheDocument();
    expect(within(list).queryByText(/Dr. Ravi Kapoor/)).not.toBeInTheDocument();
    expect(within(list).getByText("1 verified doctor")).toBeInTheDocument();
    expect(within(list).getByText(/^(Today|Tomorrow), /)).toBeInTheDocument();

    const hero = (await screen.findByRole("heading", { name: "Next available doctors" })).closest(
      "div",
    )!;
    expect(await within(hero).findByText("Dr. Anjali Mehta")).toBeInTheDocument();
  });

  it("matches a symptom to a speciality", async () => {
    const user = userEvent.setup();
    renderApp("/");
    await screen.findByRole("heading", { name: /Dr. Anjali Mehta/ });

    await user.type(screen.getByLabelText("Symptom or speciality"), "fever");
    expect(await screen.findByText("No doctor for that yet")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show all doctors" }));
    await user.click(screen.getByRole("button", { name: "Dermatology" }));
    expect(await screen.findByRole("heading", { name: /Dr. Anjali Mehta/ })).toBeInTheDocument();
  });

  it("sends guests to log in before booking", async () => {
    const user = userEvent.setup();
    const { router } = renderApp("/");

    const book = await screen.findByRole("link", { name: "Book Dr. Anjali Mehta" });
    expect(book).toHaveAttribute("href", "/patient/doctors?doctor=10");
    await user.click(book);
    expect(await screen.findByRole("heading", { name: /Log in/ })).toBeInTheDocument();
    expect(router.state.location.search).toBe(
      `?next=${encodeURIComponent("/patient/doctors?doctor=10")}`,
    );
  });

  it("opens Find a doctor with the chosen doctor for a patient", async () => {
    signInAs("patient");
    const user = userEvent.setup();
    const { router } = renderApp("/");

    await user.click(await screen.findByRole("link", { name: "Book Dr. Anjali Mehta" }));
    expect(
      await screen.findByRole("button", { name: /Dr. Anjali Mehta/, pressed: true }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/patient/doctors");
  });

  it("hides booking for doctors", async () => {
    signInAs("doctor");
    renderApp("/");
    await screen.findByRole("heading", { name: /Dr. Anjali Mehta/ });
    expect(screen.queryByRole("link", { name: /Book/ })).not.toBeInTheDocument();
  });
});
