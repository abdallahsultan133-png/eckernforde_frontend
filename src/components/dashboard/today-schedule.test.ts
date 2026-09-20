import { describe, expect, it } from "vitest";
import { lessonState, schoolDate } from "@/lib/school-time";
describe("school schedule time", () => {
  it("uses the school date across the UTC midnight boundary", () => {
    expect(schoolDate(new Date("2026-09-13T22:30:00Z"))).toBe("2026-09-14");
  });
  it("does not invent an end time", () => {
    expect(lessonState("2026-09-13T08:00:00Z",null,Date.parse("2026-09-13T12:00:00Z"))).toBe("Started");
  });
  it("changes state at the recorded start and end", () => {
    const start="2026-09-13T08:00:00Z", end="2026-09-13T09:00:00Z";
    expect(lessonState(start,end,Date.parse(start)-1)).toBe("Upcoming");
    expect(lessonState(start,end,Date.parse(start))).toBe("In progress");
    expect(lessonState(start,end,Date.parse(end))).toBe("Completed");
  });
});
