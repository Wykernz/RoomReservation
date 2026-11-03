import { describe, it, expect } from "vitest";
import { formatTime } from "./utils";

describe("formatTime", () => {
  it("formats morning times with AM", () => {
    expect(formatTime("08:30")).toBe("8:30 AM");
  });

  it("formats afternoon times with PM", () => {
    expect(formatTime("14:00")).toBe("2:00 PM");
  });

  it("formats noon as 12 PM, not 0 PM", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
  });
});