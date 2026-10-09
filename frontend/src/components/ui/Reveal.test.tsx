import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "./Reveal";

describe("Reveal", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("stays hidden until it scrolls into view", () => {
    let callback: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );

    render(<Reveal>Hello</Reveal>);
    const box = screen.getByText("Hello");
    expect(box).toHaveAttribute("data-reveal", "hidden");

    act(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(box).toHaveAttribute("data-reveal", "shown");
  });

  it("shows straight away in browsers without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Reveal>Hello</Reveal>);
    expect(screen.getByText("Hello")).toHaveAttribute("data-reveal", "shown");
  });
});
