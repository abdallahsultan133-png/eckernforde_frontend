import { expect, it } from "vitest";
import type { ReactNode } from "react";

import { GradebookDocument } from "./gradebook-document";

function collectText(node: ReactNode): string[] {
  if (node === null || node === undefined || typeof node === "boolean") return [];
  if (typeof node === "string" || typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap(collectText);
  if (typeof node === "object" && "props" in node) {
    return collectText((node.props as { children?: ReactNode }).children);
  }
  return [];
}

it("renders the student All homework PDF with each question and the student's result", () => {
  const document = GradebookDocument({
    className: "Form I",
    subjectName: "All Subjects",
    studentReport: true,
    studentName: "Amina",
    allSubjectsReport: true,
    reportMode: "full",
    rows: [{
      studentId: "student-1",
      name: "Amina",
      email: "amina@school.test",
      assignmentAvg: 70,
      examAvg: null,
      finalGrade: 70,
      missingAssignmentSubmission: false,
      letterGrade: "B",
      remarks: null,
    }],
    questions: [
      { id: 101, title: "Algebra", question: "Solve equations", maxScore: 10, subjectName: "Mathematics", subjectAssignmentIndex: 1 },
      { id: 102, title: "Geometry", question: "Find the angles", maxScore: 20, subjectName: "Mathematics", subjectAssignmentIndex: 2 },
    ],
    submissions: [
      { assignmentId: 101, studentId: "student-1", status: "graded", score: 8, feedback: "Strong algebra work" },
      { assignmentId: 102, studentId: "student-1", status: "graded", score: 13, feedback: "Review angle rules" },
    ],
    subjectSummaries: [{ classId: 11, subjectName: "Mathematics", assignmentCount: 2, gradedAssignmentCount: 2, assignmentAvg: 70, examAvg: 60, letterGrade: "B" }],
  });
  const text = collectText(document).join(" ").replace(/\s+/g, " ").trim();

  expect(text).toContain("Homework 1: Algebra");
  expect(text).toContain("Solve equations");
  expect(text).toContain("Marks");
  expect(text).toContain("8/10 (80%)");
  expect(text).toContain("Homework 2: Geometry");
  expect(text).toContain("Find the angles");
  expect(text).toContain("13/20 (65%)");
  expect(text).not.toContain("Subject Homework Marks Exam Marks Grades Remarks");
});

it("renders the student Overall homework PDF as a subject summary", () => {
  const document = GradebookDocument({
    className: "Form I",
    subjectName: "All Subjects",
    studentReport: true,
    studentName: "Amina",
    allSubjectsReport: true,
    reportMode: "summary",
    rows: [],
    subjectSummaries: [{ classId: 11, subjectName: "Mathematics", assignmentCount: 2, gradedAssignmentCount: 2, assignmentAvg: 70, examAvg: 60, letterGrade: "B" }],
  });
  const text = collectText(document).join(" ");

  expect(text).toContain("Subject Homework Marks Exam Marks Grades Remarks");
  expect(text).toContain("Mathematics 70% average 60% B");
  expect(text).not.toContain("Homework 1:");
});
