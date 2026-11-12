import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import secondaryLogo from "@/assets/eckernforde-cambridge-badge.png";

const primaryLogo = "/eckernforde-english-medium-primary-badge.png";

type GradebookRow = {
    studentId: string;
    name: string;
    email: string;
    assignmentAvg: number | null;
    examAvg: number | null;
    finalGrade: number | null;
    missingAssignmentSubmission: boolean;
    letterGrade: string | null;
    remarks: string | null;
};

type GradebookDocumentProps = {
    className: string;
    subjectName?: string;
    schoolName?: string;
    schoolBand?: "primary" | "secondary" | null;
    studentReport?: boolean;
    studentName?: string;
    allSubjectsReport?: boolean;
    compactReport?: boolean;
    reportMode?: "full" | "summary";
    rows: GradebookRow[];
    questions?: Array<{ id: number; title: string; question: string; dueAt?: string | null; maxScore: number; subjectName?: string; subjectAssignmentIndex?: number }>;
    submissions?: Array<{ assignmentId: number; studentId: string; status: "submitted" | "graded"; score: number | null; feedback?: string | null }>;
    subjectSummaries?: Array<{ classId: number; subjectName: string; assignmentCount: number; gradedAssignmentCount: number; assignmentAvg: number | null; examAvg: number | null; letterGrade: string | null }>;
};

const letterColor = (letter: string | null) => {
    if (!letter) return "#475569";
    if (letter === "A") return "#047857";
    if (letter === "B") return "#1d4ed8";
    if (letter === "C") return "#b45309";
    return "#b91c1c";
};

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
    watermark: { position: "absolute", top: 145, left: 78, width: 435, height: 580, objectFit: "contain", opacity: 0.3 },
    header: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        borderBottom: "2 solid #0f172a",
        paddingBottom: 12,
        marginBottom: 20,
    },
    logo: { width: 76, height: 76, objectFit: "contain", marginBottom: 6 },
    brand: { fontSize: 18, fontWeight: 700, textDecoration: "underline", textAlign: "center" },
    reportSubheading: { fontSize: 16, fontWeight: 700, textAlign: "center", textDecoration: "underline", marginTop: 2 },
    classSubjectHeading: { fontSize: 10, fontWeight: 700, textAlign: "center", marginTop: 4 },
    summary: { flexDirection: "column", marginBottom: 20, gap: 5 },
    summaryRow: { flexDirection: "row", alignItems: "center" },
    summaryItem: { flexDirection: "row", alignItems: "center" },
    summaryLabel: { fontSize: 9, color: "#0f172a", fontWeight: 700 },
    summaryValue: { fontSize: 9, color: "#0f172a" },
    summarySeparator: { marginHorizontal: 10, fontSize: 9, color: "#64748b" },
    questions: { marginTop: 18, marginBottom: 16, border: "1 solid #cbd5e1", padding: 10, borderRadius: 4 },
    questionsTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, color: "#0f172a" },
    question: { fontSize: 9, lineHeight: 1.4, marginTop: 4 },
    questionTitle: { fontWeight: 700 },
    table: { borderTop: "1 solid #e2e8f0", borderLeft: "1 solid #e2e8f0" },
    tableRow: { flexDirection: "row" },
    tableHeaderRow: { flexDirection: "row", backgroundColor: "#0f172a" },
    th: { padding: 6, fontSize: 8, fontWeight: 700, color: "#ffffff", borderRight: "1 solid #1e293b" },
    td: { padding: 6, fontSize: 9, borderRight: "1 solid #e2e8f0", borderBottom: "1 solid #e2e8f0" },
    colStudent: { width: "31%" },
    colHomework: { width: "14%", textAlign: "center" },
    colExam: { width: "14%", textAlign: "center" },
    colFinal: { width: "12%", textAlign: "center" },
    colGrade: { width: "12%", textAlign: "center" },
    colRemarks: { width: "17%" },
    detailStudent: { width: "45%" },
    detailResult: { width: "25%", textAlign: "center" },
    detailStatus: { width: "30%", textAlign: "center" },
    subjectName: { width: "38%" },
    subjectHomework: { width: "18%", textAlign: "center" },
    subjectAverage: { width: "28%", textAlign: "center" },
    subjectGrade: { width: "16%", textAlign: "center" },
    homeworkSubject: { width: "21%" },
    homeworkMarks: { width: "16%", textAlign: "center" },
    homeworkExams: { width: "16%", textAlign: "center" },
    homeworkLetterGrade: { width: "18%", textAlign: "center" },
    homeworkRemarks: { width: "29%" },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        color: "#94a3b8",
        textAlign: "center",
        borderTop: "1 solid #e2e8f0",
        paddingTop: 8,
    },
});

export function GradebookDocument({ className, subjectName, schoolName = "Eckernforde Schools", schoolBand, studentReport = false, studentName, allSubjectsReport = false, compactReport = false, reportMode = "full", rows, questions = [], submissions = [], subjectSummaries = [] }: GradebookDocumentProps) {
    const generatedAt = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    const displaySchoolName = schoolName.trim().toUpperCase();
    const schoolLogo = schoolBand === "primary" ? primaryLogo : secondaryLogo;
    const displayClassName = className.trim() || "Class";
    const displaySubjectName = subjectName?.trim() || "";
    const reportSubject = displaySubjectName ? ` ${displaySubjectName}` : "";
    const studentHomeworkSummary = studentReport && reportMode === "summary";
    const studentHomeworkDetails = studentReport && reportMode === "full";
    const reportTitle = `${displayClassName}${reportSubject}${studentReport ? " STUDENT" : ""} HOMEWORK GRADES ${studentHomeworkSummary || reportMode === "summary" ? "SUMMARY REPORT" : "FULL REPORT"}`.toUpperCase();
    const gradedRows = rows.filter((row) => row.assignmentAvg !== null && Number.isFinite(row.assignmentAvg));
    const homeworkAverage = gradedRows.length
        ? Math.round(gradedRows.reduce((sum, row) => sum + (row.assignmentAvg ?? 0), 0) / gradedRows.length)
        : null;
    const atRisk = rows.filter((row) => row.missingAssignmentSubmission || row.letterGrade === "D" || row.letterGrade === "F").length;
    const letterForRow = (row: GradebookRow) => row.missingAssignmentSubmission ? "F" : row.letterGrade;
    const submissionsByAssignment = new Map<number, Map<string, typeof submissions[number]>>();
    for (const submission of submissions) {
        const assignment = submissionsByAssignment.get(submission.assignmentId) ?? new Map<string, typeof submission>();
        assignment.set(submission.studentId, submission);
        submissionsByAssignment.set(submission.assignmentId, assignment);
    }
    const studentId = rows[0]?.studentId;
    const studentSubjectRows = (allSubjectsReport
        ? subjectSummaries
        : [{ classId: 0, subjectName: displaySubjectName || "Subject", assignmentCount: questions.length, assignmentAvg: homeworkAverage, examAvg: rows[0]?.examAvg ?? null, letterGrade: rows[0]?.letterGrade ?? null }]
    ).map((subject) => {
        const subjectQuestions = allSubjectsReport
            ? questions.filter((item) => item.subjectName === subject.subjectName)
            : questions;
        const feedback = [...new Set(subjectQuestions.flatMap((item) => {
            const submission = studentId ? submissionsByAssignment.get(item.id)?.get(studentId) : undefined;
            const remark = submission?.feedback?.trim();
            return remark ? [remark] : [];
        }))];
        return {
            ...subject,
            homeworkMarks: subject.assignmentAvg === null
                ? "--"
                : subject.assignmentCount > 1 ? `${subject.assignmentAvg}% average` : `${subject.assignmentAvg}%`,
            examMarks: subject.examAvg === null ? "--" : `${subject.examAvg}%`,
            homeworkLetterGrade: subject.letterGrade ?? "--",
            remarks: feedback.join(" | ") || "--",
        };
    });

    return (
        <Document title={`${displaySchoolName} - ${reportTitle}`}>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Image src={schoolLogo} style={styles.logo} />
                    <Text style={styles.brand}>{displaySchoolName}</Text>
                    <Text style={styles.reportSubheading}>HOMEWORK REPORT</Text>
                    <Text style={styles.classSubjectHeading}>CLASS: {displayClassName.toUpperCase()}{displaySubjectName ? `  |  SUBJECT: ${displaySubjectName.toUpperCase()}` : ""}</Text>
                </View>
                <Image src={schoolLogo} style={styles.watermark} fixed />

                {(studentHomeworkSummary || studentHomeworkDetails) && <View style={styles.summary}>
                    <View style={styles.summaryRow}><Text style={styles.summaryLabel}>STUDENT: </Text><Text style={styles.summaryValue}>{studentName ?? rows[0]?.name ?? "Student"}</Text></View>
                    <View style={styles.summaryRow}><Text style={styles.summaryLabel}>SUBJECT: </Text><Text style={styles.summaryValue}>{allSubjectsReport ? "All Subjects" : (displaySubjectName || "Subject")}</Text></View>
                </View>}

                {!studentReport && !allSubjectsReport && !compactReport && <View style={styles.summary}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>TOTAL STUDENTS: </Text><Text style={styles.summaryValue}>{rows.length}</Text></View>
                        <Text style={styles.summarySeparator}>|</Text>
                        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>GRADES: </Text><Text style={styles.summaryValue}>{gradedRows.length}</Text></View>
                    </View>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>HOMEWORK AVERAGE: </Text><Text style={styles.summaryValue}>{homeworkAverage === null ? "—" : `${homeworkAverage}%`}</Text></View>
                        <Text style={styles.summarySeparator}>|</Text>
                        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>AT RISK: </Text><Text style={styles.summaryValue}>{atRisk}</Text></View>
                    </View>
                </View>}

                {studentHomeworkDetails ? null : studentHomeworkSummary ? <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, styles.homeworkSubject]}>Subject</Text>
                        <Text style={[styles.th, styles.homeworkMarks]}>Homework Marks</Text>
                        <Text style={[styles.th, styles.homeworkExams]}>Exam Marks</Text>
                        <Text style={[styles.th, styles.homeworkLetterGrade]}>Grades</Text>
                        <Text style={[styles.th, styles.homeworkRemarks]}>Remarks</Text>
                    </View>
                    {studentSubjectRows.map((subject) => <View style={styles.tableRow} key={`${subject.classId}-${subject.subjectName}`}>
                        <Text style={[styles.td, styles.homeworkSubject]}>{subject.subjectName}</Text>
                        <Text style={[styles.td, styles.homeworkMarks]}>{subject.homeworkMarks}</Text>
                        <Text style={[styles.td, styles.homeworkExams]}>{subject.examMarks}</Text>
                        <Text style={[styles.td, styles.homeworkLetterGrade, { color: letterColor(subject.homeworkLetterGrade === "--" ? null : subject.homeworkLetterGrade), fontWeight: 700 }]}>{subject.homeworkLetterGrade}</Text>
                        <Text style={[styles.td, styles.homeworkRemarks]}>{subject.remarks}</Text>
                    </View>)}
                </View> : allSubjectsReport ? <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, styles.subjectName]}>Subject</Text>
                        <Text style={[styles.th, styles.subjectHomework]}>Homework</Text>
                        <Text style={[styles.th, styles.subjectAverage]}>Mark / Average</Text>
                        <Text style={[styles.th, styles.subjectGrade]}>Grade</Text>
                    </View>
                    {subjectSummaries.map((subject) => <View style={styles.tableRow} key={subject.classId}>
                        <Text style={[styles.td, styles.subjectName]}>{subject.subjectName}</Text>
                        <Text style={[styles.td, styles.subjectHomework]}>{subject.assignmentCount}</Text>
                        <Text style={[styles.td, styles.subjectAverage]}>{subject.assignmentAvg === null ? "--" : subject.assignmentCount > 1 ? `${subject.assignmentAvg}% average` : `${subject.assignmentAvg}%`}</Text>
                        <Text style={[styles.td, styles.subjectGrade, { color: letterColor(subject.letterGrade), fontWeight: 700 }]}>{subject.letterGrade ?? "--"}</Text>
                    </View>)}
                </View> : <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, styles.colStudent]}>Student</Text>
                        <Text style={[styles.th, styles.colHomework]}>Homework</Text>
                        <Text style={[styles.th, styles.colExam]}>Exam</Text>
                        <Text style={[styles.th, styles.colFinal]}>Final</Text>
                        <Text style={[styles.th, styles.colGrade]}>Grade</Text>
                        <Text style={[styles.th, styles.colRemarks]}>Remarks</Text>
                    </View>
                    {rows.length === 0 ? (
                        <View style={styles.tableRow}><Text style={{ ...styles.td, width: "100%", textAlign: "center", color: "#94a3b8" }}>No students enrolled in this class yet.</Text></View>
                    ) : rows.map((row) => {
                        const letter = letterForRow(row);
                        return <View style={styles.tableRow} key={row.studentId}>
                            <Text style={[styles.td, styles.colStudent]}>{row.name}</Text>
                            <Text style={[styles.td, styles.colHomework]}>{row.assignmentAvg !== null ? `${row.assignmentAvg}%` : "—"}</Text>
                            <Text style={[styles.td, styles.colExam]}>{row.examAvg !== null ? `${row.examAvg}%` : "—"}</Text>
                            <Text style={[styles.td, styles.colFinal]}>{row.finalGrade ?? "—"}</Text>
                            <Text style={[styles.td, styles.colGrade, { color: letterColor(letter), fontWeight: 700 }]}>{letter ?? "—"}</Text>
                            <Text style={[styles.td, styles.colRemarks]}>{row.remarks ?? "—"}</Text>
                        </View>;
                    })}
                </View>}

                {reportMode === "full" && questions.map((item, index) => {
                    const results = submissionsByAssignment.get(item.id);
                    const questionHeading = `${allSubjectsReport && item.subjectName ? `${item.subjectName} - ` : ""}Homework ${item.subjectAssignmentIndex ?? index + 1}: ${item.title}`;
                    return <View key={item.id} wrap={false} style={styles.questions}>
                        <Text style={styles.questionsTitle}>{questionHeading}</Text>
                        <Text style={styles.question}>{item.question}{item.dueAt ? ` (Due ${new Date(item.dueAt).toLocaleDateString()})` : ""}</Text>
                        <View style={[styles.table, { marginTop: 8 }]}>
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.th, styles.detailStudent]}>Student</Text>
                                <Text style={[styles.th, styles.detailResult]}>Marks</Text>
                                <Text style={[styles.th, styles.detailStatus]}>Status</Text>
                            </View>
                            {rows.map((student) => {
                                const submission = results?.get(student.studentId);
                                const score = submission?.score;
                                const graded = submission?.status === "graded" && score !== null && score !== undefined;
                                const result = graded ? `${score}/${item.maxScore} (${Math.round((score / item.maxScore) * 100)}%)` : "—";
                                const status = !submission ? "F · Not submitted" : graded ? "Graded" : "Awaiting grading";
                                return <View style={styles.tableRow} key={student.studentId}>
                                    <Text style={[styles.td, styles.detailStudent]}>{student.name}</Text>
                                    <Text style={[styles.td, styles.detailResult]}>{result}</Text>
                                    <Text style={[styles.td, styles.detailStatus, { color: !submission ? "#b91c1c" : "#0f172a" }]}>{status}</Text>
                                </View>;
                            })}
                        </View>
                    </View>;
                })}

                <Text style={styles.footer}>
                    Generated {generatedAt}{"\n"}
                    This is a computer-generated homework grade book from the school portal.
                </Text>
            </Page>
        </Document>
    );
}
