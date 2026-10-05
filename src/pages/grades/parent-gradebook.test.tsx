import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import Gradebook from "./gradebook";

const requestedPaths = vi.hoisted(() => [] as Array<string | null>);
const fixtures = vi.hoisted(() => ({
  children: { data: [{
    id: "child-1",
    name: "Amina",
    enrolledClasses: [{ id: 11, name: "Form I", schoolLevel: "secondary", subject: { id: 4, name: "Civics" } }],
  }] },
  gradebook: {
    data: [{ studentId: "child-1", name: "Amina", email: "amina@school.test", assignmentAvg: 90, examAvg: 80, missingAssignmentSubmission: false, finalGrade: 90, letterGrade: "A", remarks: null, isOverridden: false }],
    assignments: [],
    submissions: [],
  },
}));

vi.mock("@refinedev/core", async (importOriginal) => ({
  ...await importOriginal<typeof import("@refinedev/core")>(),
  useGetIdentity: () => ({ data: { id: "parent-1", name: "Parent", role: "parent" } }),
  useList: () => ({ query: { data: { data: [] } } }),
}));
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tanstack/react-query")>(),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/components/layout/historical-portal-banner", () => ({ useHistoricalPortal: () => ({ data: null }) }));
vi.mock("@/hooks/use-download", () => ({ useDownload: () => ({ narrateDownload: vi.fn() }) }));
vi.mock("@/components/pdf/deferred-pdf-download", () => ({ DeferredPdfDownload: () => null }));
vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (path: string | null) => {
    requestedPaths.push(path);
    if (path === "/profile/my-children?academicYearId=2") return {
      data: fixtures.children,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
    if (path === "/grades/gradebook/11?childId=child-1&academicYearId=2") return {
      data: fixtures.gradebook,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
    return { data: undefined, isLoading: false, isError: false, refetch: vi.fn() };
  },
}));

afterEach(() => {
  cleanup();
  requestedPaths.length = 0;
});

it("shows the selected child's homework gradebook with the student presentation", () => {
  render(
    <MemoryRouter initialEntries={["/homework/grades?childId=child-1&academicYearId=2&classId=11"]}>
      <Gradebook />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { level: 1, name: "Homework Grade Book" })).toBeTruthy();
  expect(screen.getAllByText("90%").length).toBeGreaterThan(0);
  expect(screen.getByText("Amina")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Save remarks" })).toBeNull();
  expect(requestedPaths).toContain("/grades/gradebook/11?childId=child-1&academicYearId=2");
});
