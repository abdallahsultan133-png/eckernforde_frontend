import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import AssignmentsList from "./list";

vi.mock("@refinedev/core", async (importOriginal) => ({
  ...await importOriginal<typeof import("@refinedev/core")>(),
  useGetIdentity: () => ({ data: { id: "parent-1", name: "Parent", role: "parent" } }),
}));
vi.mock("@/components/layout/historical-portal-banner", () => ({ useHistoricalPortal: () => ({ data: null }) }));
vi.mock("@/hooks/use-api-query", () => ({ useApiQuery: (path: string | null) => ({
  data: path?.startsWith("/homework?") ? { data: [{
    id: 8, title: "Civics essay", description: "Write an essay", dueAt: "2026-10-20T12:00:00Z", maxScore: 20,
    class: { id: 11, name: "Form I" }, subject: { id: 4, name: "Civics" }, creator: { id: "teacher-1", name: "Teacher" },
    submissionCount: 1, gradedCount: 1, mySubmission: { status: "graded", score: 18 },
  }] } : path === "/profile/my-children" ? { data: [{ id: "child-1", name: "Amina" }] }
    : path === "/grades/academic-years" ? { data: [{ id: 2, name: "2026" }] } : { data: [] },
  isLoading: false, isError: false, refetch: vi.fn(),
}) }));

afterEach(cleanup);

it("shows the selected child's homework status and keeps the child/year on task links", () => {
  render(<MemoryRouter initialEntries={["/parent/homework/view?childId=child-1&academicYearId=2"]}><AssignmentsList /></MemoryRouter>);

  expect(screen.getByText("Amina · 2026")).toBeTruthy();
  expect(screen.getByText("18/20")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Civics essay/ }).getAttribute("href")).toBe("/homework/8?childId=child-1&academicYearId=2");
  expect(screen.getByRole("link", { name: "Grades" }).getAttribute("href")).toBe("/homework/grades?childId=child-1&academicYearId=2");
  expect(screen.queryByRole("link", { name: "New homework" })).toBeNull();
});
