import { describe, it, expect } from "vitest";
import { formatTime, freeWindows } from "./utils";

describe("formatTime", () => {
  it("formats morning times with AM", () => {
    expect(formatTime("08:30")).toBe("8:30 AM");
  });

  describe("freeWindows", () => {
    it("finds open periods around overlapping bookings", () => {
      expect(freeWindows(1, [
        { room_id: 1, start_time: "09:00", end_time: "10:00" },
        { room_id: 1, start_time: "09:30", end_time: "11:00" },
        { room_id: 2, start_time: "12:00", end_time: "13:00" },
      ])).toEqual([
        { start: 480, end: 540 },
        { start: 660, end: 1020 },
      ]);
    });

    it("clips bookings to operating hours and returns no free time for a full day", () => {
      expect(freeWindows(4, [
        { room_id: 4, start_time: "07:00", end_time: "18:00" },
      ])).toEqual([]);
    });
  });

  it("formats afternoon times with PM", () => {
    expect(formatTime("14:00")).toBe("2:00 PM");
  });

  it("formats noon as 12 PM, not 0 PM", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
  });
});