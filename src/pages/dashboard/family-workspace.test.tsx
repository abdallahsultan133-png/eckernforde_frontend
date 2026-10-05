import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import FamilyWorkspace from "./family-workspace";

vi.mock("@refinedev/core", async (importOriginal) => ({
  ...await importOriginal<typeof import("@refinedev/core")>(),
  useGetIdentity: () => ({ data: { id: "parent-1", role: "parent" } }),
}));
vi.mock("@/components/dashboard/academic-progress", () => ({ AcademicProgress: () => null }));
vi.mock("@/components/dashboard/dashboard-greeting", () => ({ DashboardGreeting: () => null }));
vi.mock("@/components/dashboard/upcoming-events", () => ({ UpcomingEvents: () => null }));
vi.mock("@/components/dashboard/recent-activity", () => ({ RecentActivity: () => null }));

const childrenForYear = vi.hoisted(() => (year: number) => [
  { id: "one", name: "Amina", profile: null, enrolledClasses: year === 1 ? [{ id: 11, name: "Form I", subject: { id: 1, name: "Math" } }] : [], grades: [], attendanceSummary: { rate: year === 1 ? 90 : 60, present: year === 1 ? 9 : 3, total: year === 1 ? 10 : 5 } },
  { id: "two", name: "Juma", profile: null, enrolledClasses: [], grades: [], attendanceSummary: { rate: year === 1 ? 80 : 70, present: year === 1 ? 8 : 7, total: 10 } },
]);

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (path: string | null) => ({
    data: { data: path === "/grades/academic-years" ? [
      { id: 1, name: "2026", startsOn: "2026-01-01", endsOn: "2026-12-31", active: true },
      { id: 2, name: "2025", startsOn: "2025-01-01", endsOn: "2025-12-31", active: false },
    ] : childrenForYear(path?.includes("academicYearId=2") ? 2 : 1) },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

afterEach(() => { cleanup(); window.localStorage.clear(); });

it("opens attendance and homework for the child already selected on the dashboard", () => {
  render(<MemoryRouter><FamilyWorkspace /></MemoryRouter>);
  expect(screen.getAllByText("90%").length).toBeGreaterThan(0);

  fireEvent.change(screen.getByLabelText("Viewing records for"), { target: { value: "two" } });

  expect(screen.getAllByText("80%").length).toBeGreaterThan(0);
  expect(screen.queryAllByText("90%")).toHaveLength(0);
  expect(screen.getByRole("heading", { name: "Juma" })).toBeTruthy();
  expect(screen.getByText("View student profile →")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Attendance" }).getAttribute("href")).toBe("/parent/attendance/view?childId=two&academicYearId=1");
  expect(screen.getByRole("link", { name: "Homework" }).getAttribute("href")).toBe("/parent/homework/view?childId=two&academicYearId=1");
  expect(screen.getByRole("link", { name: "Review record" }).getAttribute("href")).toBe("/parent/attendance/view?childId=two&academicYearId=1");
  expect(screen.queryByRole("heading", { name: "Classes and subjects studied" })).toBeNull();
});

it("keeps the selected academic year when opening attendance and homework", () => {
  render(<MemoryRouter><FamilyWorkspace /></MemoryRouter>);
  expect(screen.getAllByText("90%").length).toBeGreaterThan(0);

  fireEvent.change(screen.getByLabelText("Academic year"), { target: { value: "2" } });

  expect(screen.getAllByText("60%").length).toBeGreaterThan(0);
  expect(screen.queryAllByText("90%")).toHaveLength(0);
  expect(screen.getByRole("link", { name: "Attendance" }).getAttribute("href")).toBe("/parent/attendance/view?childId=one&academicYearId=2");
  expect(screen.getByRole("link", { name: "Homework" }).getAttribute("href")).toBe("/parent/homework/view?childId=one&academicYearId=2");
});
