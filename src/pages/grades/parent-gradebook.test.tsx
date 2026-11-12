import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import Gradebook from "./gradebook";

const requestedPaths = vi.hoisted(() => [] as Array<string | null>);
const downloadDocuments = vi.hoisted(() => [] as Array<Record<string, unknown>>);
const fixtures = vi.hoisted(() => ({
  children: { data: [{
    id: "child-1",
    name: "Amina",
    enrolledClasses: [
      { id: 11, name: "Form I", schoolLevel: "secondary", subject: { id: 4, name: "Civics" } },
      { id: 12, name: "Form I", schoolLevel: "secondary", subject: { id: 5, name: "Mathematics" } },
    ],
  }] },
  gradebook: {
    data: [{ studentId: "child-1", name: "Amina", email: "amina@school.test", assignmentAvg: 90, examAvg: 80, missingAssignmentSubmission: false, finalGrade: 90, letterGrade: "A", remarks: null, isOverridden: false }],
    assignments: [],
    submissions: [],
  },
  allSubjects: {
    student: { id: "child-1", name: "Parent", email: "parent@school.test" },
    overallAverage: 90,
    data: [{
      classId: 11,
      className: "Form I",
      subjectName: "Civics",
      assignmentCount: 2,
      gradedAssignmentCount: 2,
      assignmentAvg: 90,
      examAvg: 80,
      letterGrade: "A",
      assignments: [
        { id: 101, title: "Community", description: "Describe community", maxScore: 10 },
        { id: 102, title: "Citizenship", description: "Explain citizenship", maxScore: 10 },
      ],
      submissions: [
        { assignmentId: 101, studentId: "child-1", status: "graded", score: 9 },
        { assignmentId: 102, studentId: "child-1", status: "graded", score: 9 },
      ],
    }],
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
vi.mock("@/components/pdf/deferred-pdf-download", () => ({
  DeferredPdfDownload: ({ documentProps }: { documentProps: Record<string, unknown> }) => {
    downloadDocuments.push(documentProps);
    return <button type="button">Download PDF</button>;
  },
}));
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
    if (path === "/grades/gradebook/all-subjects?childId=child-1&academicYearId=2") return {
      data: fixtures.allSubjects,
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
  fixtures.children.data[0].enrolledClasses = [
    { id: 11, name: "Form I", schoolLevel: "secondary", subject: { id: 4, name: "Civics" } },
    { id: 12, name: "Form I", schoolLevel: "secondary", subject: { id: 5, name: "Mathematics" } },
  ];
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

it("lets a parent download all subjects for the selected child and academic year", () => {
  render(
    <MemoryRouter initialEntries={["/homework/grades?childId=child-1&academicYearId=2&classId=all"]}>
      <Gradebook />
    </MemoryRouter>,
  );

  expect(screen.getByText("All Subjects")).toBeTruthy();
  expect(screen.getByText("Community")).toBeTruthy();
  expect(requestedPaths).toContain("/grades/gradebook/all-subjects?childId=child-1&academicYearId=2");
  expect(screen.getByRole("button", { name: "Download PDF" })).toBeTruthy();
  expect(downloadDocuments.at(-1)?.allSubjectsReport).toBe(true);
  expect(downloadDocuments.at(-1)?.studentName).toBe("Amina");
  expect(downloadDocuments.at(-1)?.schoolName).toBe("Eckernforde Cambridge Secondary School");
  expect(downloadDocuments.at(-1)?.schoolBand).toBe("secondary");
  expect(downloadDocuments.at(-1)?.reportMode).toBe("full");
  fireEvent.click(screen.getByRole("combobox", { name: "Select homework report" }));
  fireEvent.click(screen.getByRole("option", { name: "Overall homework" }));
  expect(downloadDocuments.at(-1)?.reportMode).toBe("summary");
});

it("uses the primary school name and badge band for a primary child's all-subjects PDF", () => {
  fixtures.children.data[0].enrolledClasses.forEach((course) => {
    course.name = "Class I";
    course.schoolLevel = "primary";
  });

  render(
    <MemoryRouter initialEntries={["/homework/grades?childId=child-1&academicYearId=2&classId=all"]}>
      <Gradebook />
    </MemoryRouter>,
  );

  expect(downloadDocuments.at(-1)?.schoolName).toBe("Eckernforde English Medium Primary School");
  expect(downloadDocuments.at(-1)?.schoolBand).toBe("primary");
});
