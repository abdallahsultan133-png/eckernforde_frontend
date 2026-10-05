import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import Gradebook from "./gradebook";

const requestedPaths = vi.hoisted(() => [] as Array<string | null>);
const downloadDocuments = vi.hoisted(() => [] as Array<Record<string, unknown>>);
const allSubjectsFixture = vi.hoisted(() => ({
  student: { id: "student-1", name: "Amina", email: "amina@school.test" },
  overallAverage: 73,
  data: [
    {
      classId: 11,
      className: "Form I",
      subjectName: "Mathematics",
      assignmentCount: 2,
      gradedAssignmentCount: 2,
      assignmentAvg: 70,
      examAvg: 60,
      letterGrade: "B",
      assignments: [
        { id: 101, title: "Algebra", description: "Solve equations", maxScore: 10 },
        { id: 102, title: "Geometry", description: "Find the angles", maxScore: 20 },
      ],
      submissions: [
        { assignmentId: 101, studentId: "student-1", status: "graded", score: 8, feedback: "Strong algebra work" },
        { assignmentId: 102, studentId: "student-1", status: "graded", score: 13, feedback: "Review angle rules" },
      ],
    },
    {
      classId: 12,
      className: "Form I",
      subjectName: "Civics",
      assignmentCount: 1,
      gradedAssignmentCount: 1,
      assignmentAvg: 80,
      examAvg: 75,
      letterGrade: "A",
      assignments: [{ id: 201, title: "Citizenship", description: "Define citizenship", maxScore: 10 }],
      submissions: [{ assignmentId: 201, studentId: "student-1", status: "graded", score: 8 }],
    },
  ],
}));

vi.mock("@refinedev/core", async (importOriginal) => ({
  ...await importOriginal<typeof import("@refinedev/core")>(),
  useGetIdentity: () => ({ data: { id: "student-1", name: "Amina", email: "amina@school.test", role: "student" } }),
  useList: () => ({ query: { data: { data: [
    { id: 11, name: "Form I", courseName: "Mathematics", schoolLevel: "secondary", subject: { id: 4, name: "Mathematics" } },
    { id: 12, name: "Form I", courseName: "Civics", schoolLevel: "secondary", subject: { id: 5, name: "Civics" } },
  ] } } }),
}));
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tanstack/react-query")>(),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/components/layout/historical-portal-banner", () => ({ useHistoricalPortal: () => ({ data: null }) }));
vi.mock("@/hooks/use-download", () => ({ useDownload: () => ({ narrateDownload: vi.fn() }) }));
vi.mock("@/components/pdf/deferred-pdf-download", () => ({
  DeferredPdfDownload: ({ documentProps }: { documentProps: Record<string, unknown> }) => {
    downloadDocuments.push(documentProps);
    return <button type="button">Download PDF</button>;
  },
}));
vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (path: string | null) => {
    requestedPaths.push(path);
    if (path === "/classes/enrolled-ids") return { data: { data: [11, 12] }, isLoading: false, isError: false, refetch: vi.fn() };
    if (path === "/portal-context") return { data: { data: { context: { schoolBand: "secondary" } } }, isLoading: false, isError: false, refetch: vi.fn() };
    if (path === "/grades/gradebook/all-subjects") return {
      data: allSubjectsFixture,
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
  downloadDocuments.length = 0;
});

it("shows all subjects, averages repeated homework, and prepares every homework for download", () => {
  render(<MemoryRouter initialEntries={["/homework/grades?classId=all"]}><Gradebook /></MemoryRouter>);

  expect(screen.getByText("All Subjects")).toBeTruthy();
  expect(screen.getByText("70% average")).toBeTruthy();
  expect(screen.getByText("80%")).toBeTruthy();
  expect(screen.getByText("Algebra")).toBeTruthy();
  expect(screen.getByText("Geometry")).toBeTruthy();
  expect(screen.getByText("Citizenship")).toBeTruthy();
  expect(screen.getByText("All homework")).toBeTruthy();
  expect(screen.queryByText("Overall homework")).toBeNull();
  expect(screen.getByRole("button", { name: "Download PDF" })).toBeTruthy();
  expect(requestedPaths).toContain("/grades/gradebook/all-subjects");
  expect(downloadDocuments.at(-1)?.allSubjectsReport).toBe(true);
  expect(downloadDocuments.at(-1)?.reportMode).toBe("full");
  expect((downloadDocuments.at(-1)?.questions as unknown[])).toHaveLength(3);
  expect((downloadDocuments.at(-1)?.submissions as Array<{ feedback?: string }>)[0]?.feedback).toBe("Strong algebra work");
});
