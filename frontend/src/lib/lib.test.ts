import { describe, expect, it } from "vitest";
import { formatDay, formatTime, timeAgo, todayIST } from "./dates";
import { formatBytes, formatINR, percentChange } from "./format";
import { checkReason, isEmail, slugify, validateArticle } from "./validators";

describe("money and numbers", () => {
  it("formats rupees with Indian digit grouping", () => {
    expect(formatINR(150000)).toBe("₹1,50,000");
    expect(formatINR(500)).toBe("₹500");
  });

  it("computes percent change, with no baseline for zero", () => {
    expect(percentChange(59, 30)).toBe(97);
    expect(percentChange(20, 25)).toBe(-20);
    expect(percentChange(5, 0)).toBeNull();
  });

  it("formats file sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});

describe("dates (stored in UTC, shown in IST)", () => {
  it("converts UTC to India Standard Time", () => {
    expect(formatTime("2026-10-05T04:30:00Z")).toBe("10:00");
    expect(formatDay("2026-10-05T04:30:00Z")).toBe("Mon, 5 Oct");
  });

  it("starts a new day at IST midnight, not UTC midnight", () => {
    expect(todayIST(new Date("2026-10-05T19:00:00Z"))).toBe("2026-10-06");
  });

  it("describes elapsed time briefly", () => {
    const now = new Date("2026-09-30T12:00:00Z");
    expect(timeAgo("2026-09-30T11:59:40Z", now)).toBe("just now");
    expect(timeAgo("2026-09-30T11:15:00Z", now)).toBe("45m ago");
    expect(timeAgo("2026-09-30T02:00:00Z", now)).toBe("10h ago");
    expect(timeAgo("2026-09-27T12:00:00Z", now)).toBe("3d ago");
  });
});

describe("validators", () => {
  const article = {
    title: "Joining a video consultation",
    slug: "join-video-call",
    category: "howto" as const,
    audience: ["patient" as const],
    body_md: "Open Appointments, then tap Join call. The button turns on 10 minutes before.",
    reviewer: null,
  };

  it("accepts a valid how-to article without a reviewer", () => {
    expect(validateArticle(article)).toEqual({});
  });

  it("requires a named medical reviewer for health articles", () => {
    expect(validateArticle({ ...article, category: "health" }).reviewer).toBeDefined();
    expect(validateArticle({ ...article, category: "health", reviewer: "Dr. Simran Kaur, MD" })).toEqual({});
  });

  it("rejects slugs that aren't lowercase words joined by hyphens", () => {
    expect(validateArticle({ ...article, slug: "Join Video" }).slug).toBeDefined();
    expect(validateArticle({ ...article, slug: "join--video" }).slug).toBeDefined();
  });

  it("needs at least one audience", () => {
    expect(validateArticle({ ...article, audience: [] }).audience).toBeDefined();
  });

  it("turns a title into a slug", () => {
    expect(slugify("Heat stroke: warning signs in summer")).toBe("heat-stroke-warning-signs-in-summer");
    expect(slugify("  What is a DICOM file?  ")).toBe("what-is-a-dicom-file");
  });

  it("checks emails and reasons", () => {
    expect(isEmail("admin@aarogyahub.in")).toBe(true);
    expect(isEmail("admin")).toBe(false);
    expect(checkReason("too short")).toBeDefined();
    expect(checkReason("A clear reason for the change")).toBeUndefined();
  });
});
