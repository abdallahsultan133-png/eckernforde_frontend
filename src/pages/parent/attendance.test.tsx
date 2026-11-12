import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import ParentAttendance from "./attendance";

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (path: string | null) => ({
    data: path?.startsWith("/profile/my-children?")
      ? { data: [{ id: "student-one", name: "Amina", enrolledClasses: [{ id: 10, name: "Form I", schoolLevel: "secondary", subject: { id: 4, name: "Mathematics" } }] }] }
      : path === "/grades/academic-years"
        ? { data: [{ id: 7, name: "2026", startsOn: "2026-01-01", endsOn: "2026-12-31" }] }
        : { data: [{ id: 1, classId: 10, className: "Form I", subjectName: "Mathematics", date: "2026-03-01", status: "present", notes: null }] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-download", () => ({ useDownload: () => ({ narrateDownload: vi.fn() }) }));
vi.mock("@/components/pdf/deferred-pdf-download", () => ({
  DeferredPdfDownload: ({ documentProps }: { documentProps: Record<string, unknown> }) => (
    <div data-testid="attendance-pdf-props">{JSON.stringify(documentProps)}</div>
  ),
}));

afterEach(cleanup);

it("shows the subject instead of the class in a parent's attendance record", () => {
  render(
    <MemoryRouter initialEntries={["/parent/attendance/view?childId=student-one&academicYearId=7"]}>
      <ParentAttendance />
    </MemoryRouter>,
  );

  expect(screen.getAllByRole("columnheader", { name: "Subject" })).toHaveLength(2);
  expect(screen.queryByRole("columnheader", { name: "Class" })).toBeNull();
  expect(screen.getAllByText("Mathematics").length).toBeGreaterThan(0);
  expect(screen.getByRole("columnheader", { name: "Attendance Rate" })).toBeTruthy();
  expect(screen.getByText("100%")).toBeTruthy();
  expect(JSON.parse(screen.getByTestId("attendance-pdf-props").textContent ?? "{}")).toMatchObject({
    studentAccountReport: true,
    studentReport: true,
  });
});
