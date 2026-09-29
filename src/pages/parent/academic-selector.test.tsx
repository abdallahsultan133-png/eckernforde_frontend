import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";

import { ParentAcademicSelector } from "./academic-selector";

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (path: string) => path === "/profile/my-children"
    ? {
        data: { data: [{ id: "student-one", name: "Amina", profile: { registrationNumber: "S-001" } }] },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      }
    : {
        data: { data: [{ id: 7, name: "2026", startsOn: "2026-01-01", endsOn: "2026-12-31", active: true }] },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      },
}));

function CurrentLocation() {
  const location = useLocation();
  return <output aria-label="Current location">{location.pathname}{location.search}</output>;
}

afterEach(cleanup);

it("opens the selected child's report for the selected academic year", () => {
  render(
    <MemoryRouter initialEntries={["/parent/reports"]}>
      <ParentAcademicSelector mode="reports" />
      <CurrentLocation />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "Generate report" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Open report" }));
  expect(screen.getByLabelText("Current location").textContent).toBe(
    "/parent/reports/view?childId=student-one&academicYearId=7",
  );
});
