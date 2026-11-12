import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

import AssignmentShow from "./show";

vi.mock("@refinedev/core", async (importOriginal) => ({
  ...await importOriginal<typeof import("@refinedev/core")>(),
  useGetIdentity: () => ({ data: { id: "parent-1", name: "Parent", role: "parent" } }),
}));
vi.mock("@/components/layout/historical-portal-banner", () => ({ useHistoricalPortal: () => ({ data: null }) }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("shows the selected child's homework submission without student submission controls", async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    expect(String(input)).toContain("childId=child-1&academicYearId=2");
    return { ok: true, json: async () => ({ data: {
      id: 8, title: "Civics essay", description: "Write an essay", dueAt: null, maxScore: 20,
      attachmentUrl: null, attachmentName: null, class: { id: 11, name: "Form I" },
      creator: { id: "teacher-1", name: "Teacher" },
      mySubmission: { id: 50, assignmentId: 8, studentId: "child-1", content: "My answer", fileUrl: null, fileName: null, status: "graded", score: 18, feedback: "Good work", submittedAt: "2026-10-01T10:00:00Z" },
    } }) };
  });
  vi.stubGlobal("fetch", fetchMock);

  render(<MemoryRouter initialEntries={["/homework/8?childId=child-1&academicYearId=2"]}>
    <Routes><Route path="/homework/:id" element={<AssignmentShow />} /></Routes>
  </MemoryRouter>);

  expect(await screen.findByText("Child's submission")).toBeTruthy();
  expect(screen.getByText("Score: 18 / 20")).toBeTruthy();
  expect(screen.getByText("Good work")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Submit homework" })).toBeNull();
  expect(screen.getByRole("link", { name: "Back to selected child's homework" }).getAttribute("href")).toBe("/parent/homework/view?childId=child-1&academicYearId=2");
});
