import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";

import { ParentAcademicSelector } from "./academic-selector";
import { saveParentRecordContext } from "@/lib/parent-record-context";

vi.mock("@refinedev/core", async (importOriginal) => ({
  ...await importOriginal<typeof import("@refinedev/core")>(),
  useGetIdentity: () => ({ data: { id: "parent-1", role: "parent" } }),
}));
vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (path: string) => path === "/profile/my-children"
    ? {
        data: { data: [{ id: "student-one", name: "Amina", profile: { registrationNumber: "S-001" } }, { id: "student-two", name: "Juma", profile: { registrationNumber: "S-002" } }] },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      }
    : {
        data: { data: [{ id: 7, name: "2026", startsOn: "2026-01-01", endsOn: "2026-12-31", active: true }, { id: 6, name: "2025", startsOn: "2025-01-01", endsOn: "2025-12-31", active: false }] },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      },
}));

function CurrentLocation() {
  const location = useLocation();
  return <output aria-label="Current location">{location.pathname}{location.search}</output>;
}

afterEach(() => { cleanup(); window.localStorage.clear(); });

it("opens the selected child's report for the selected academic year", () => {
  render(
    <MemoryRouter initialEntries={["/parent/reports"]}>
      <ParentAcademicSelector mode="reports" />
      <CurrentLocation />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Grades" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Open grades" }));
  expect(screen.getByLabelText("Current location").textContent).toBe(
    "/parent/reports/view?childId=student-one&academicYearId=7",
  );
});

it.each(["attendance", "homework"] as const)("opens the selected child's %s page for the selected academic year", (mode) => {
  render(
    <MemoryRouter initialEntries={[`/parent/${mode}`]}>
      <ParentAcademicSelector mode={mode} />
      <CurrentLocation />
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole("button", { name: `Open ${mode}` }));
  expect(screen.getByLabelText("Current location").textContent).toBe(
    `/parent/${mode}/view?childId=student-one&academicYearId=7`,
  );
});

it("remembers the child and year already selected by the parent", () => {
  saveParentRecordContext("parent-1", { childId: "student-two", academicYearId: 6 });
  render(
    <MemoryRouter initialEntries={["/parent/homework"]}>
      <ParentAcademicSelector mode="homework" />
      <CurrentLocation />
    </MemoryRouter>,
  );

  expect(screen.getByRole("combobox", { name: "Select child" }).textContent).toContain("Juma");
  expect(screen.getByRole("combobox", { name: "Select academic year" }).textContent).toContain("2025");
  fireEvent.click(screen.getByRole("button", { name: "Open homework" }));
  expect(screen.getByLabelText("Current location").textContent).toBe(
    "/parent/homework/view?childId=student-two&academicYearId=6",
  );
});
