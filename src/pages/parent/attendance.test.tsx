import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import ParentAttendance from "./attendance";

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (path: string | null) => ({
    data: path === "/profile/my-children"
      ? { data: [{ id: "student-one", name: "Amina" }] }
      : path === "/grades/academic-years"
        ? { data: [{ id: 7, name: "2026", startsOn: "2026-01-01", endsOn: "2026-12-31" }] }
        : { data: [{ id: 1, classId: 10, className: "Form I", subjectName: "Mathematics", date: "2026-03-01", status: "present", notes: null }] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

afterEach(cleanup);

it("shows the subject instead of the class in a parent's attendance record", () => {
  render(
    <MemoryRouter initialEntries={["/parent/attendance/view?childId=student-one&academicYearId=7"]}>
      <ParentAttendance />
    </MemoryRouter>,
  );

  expect(screen.getByRole("columnheader", { name: "Subject" })).toBeTruthy();
  expect(screen.queryByRole("columnheader", { name: "Class" })).toBeNull();
  expect(screen.getByText("Mathematics")).toBeTruthy();
});
