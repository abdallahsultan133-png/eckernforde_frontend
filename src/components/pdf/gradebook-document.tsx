import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import cambridgeLogo from "@/assets/eckernforde-cambridge-badge.png";

type GradebookRow = {
    studentId: string;
    name: string;
    email: string;
    assignmentAvg: number | null;
    missingAssignmentSubmission: boolean;
    letterGrade: string | null;
    remarks: string | null;
};

type GradebookDocumentProps = {
    className: string;
    rows: GradebookRow[];
    questions?: Array<{ id: number; title: string; question: string; dueAt?: string | null; maxScore: number }>;
    submissions?: Array<{ assignmentId: number; studentId: string; status: "submitted" | "graded"; score: number | null }>;
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "2 solid #0f172a",
        paddingBottom: 12,
        marginBottom: 20,
    },
    logo: { width: 90, height: 90, objectFit: "contain", marginRight: 14 },
    brand: { fontSize: 17, fontWeight: 700 },
    brandSub: { fontSize: 9, color: "#64748b", marginTop: 2 },
    docTitle: { fontSize: 12, fontWeight: 700, textAlign: "right" },
    docDate: { fontSize: 9, color: "#64748b", textAlign: "right", marginTop: 2 },
    classBlock: { marginBottom: 20, padding: 12, backgroundColor: "#f8fafc", borderRadius: 4 },
    className: { fontSize: 14, fontWeight: 700 },
    questions: { marginBottom: 16, border: "1 solid #cbd5e1", padding: 10, borderRadius: 4 },
    questionsTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, color: "#0f172a" },
    question: { fontSize: 9, lineHeight: 1.4, marginTop: 4 },
    questionTitle: { fontWeight: 700 },
    table: { borderTop: "1 solid #e2e8f0", borderLeft: "1 solid #e2e8f0" },
    tableRow: { flexDirection: "row" },
    tableHeaderRow: { flexDirection: "row", backgroundColor: "#0f172a" },
    th: { padding: 6, fontSize: 8, fontWeight: 700, color: "#ffffff", borderRight: "1 solid #1e293b" },
    td: { padding: 6, fontSize: 9, borderRight: "1 solid #e2e8f0", borderBottom: "1 solid #e2e8f0" },
    colStudent: { width: "40%" },
    colNum: { width: "20%", textAlign: "center" },
    colRemarks: { width: "20%" },
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

export function GradebookDocument({ className, rows, questions = [], submissions = [] }: GradebookDocumentProps) {
    const generatedAt = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    const submissionsByAssignment = new Map<number, Map<string, typeof submissions[number]>>();
    for (const submission of submissions) {
        const assignment = submissionsByAssignment.get(submission.assignmentId) ?? new Map<string, typeof submission>();
        assignment.set(submission.studentId, submission);
        submissionsByAssignment.set(submission.assignmentId, assignment);
    }

    return (
        <Document title={`Homework Grade Book - ${className}`}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.header}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Image src={cambridgeLogo} style={styles.logo} />
                        <View>
                            <Text style={styles.brand}>School Portal</Text>
                            <Text style={styles.brandSub}>Homework Grade Book</Text>
                        </View>
                    </View>
                    <View>
                        <Text style={styles.docTitle}>HOMEWORK GRADE BOOK</Text>
                        <Text style={styles.docDate}>Generated {generatedAt}</Text>
                    </View>
                </View>

                <View style={styles.classBlock}>
                    <Text style={styles.className}>{className}</Text>
                </View>

                {questions.length > 0 && <View style={styles.questions}>
                    <Text style={styles.questionsTitle}>Question asked{questions.length === 1 ? "" : "s"}</Text>
                    {questions.map((item, index) => <Text key={`${item.title}-${index}`} style={styles.question}>
                        <Text style={styles.questionTitle}>{index + 1}. {item.title}: </Text>{item.question}{item.dueAt ? ` (Due ${new Date(item.dueAt).toLocaleDateString()})` : ""}
                    </Text>)}
                </View>}

                {questions.map((item, index) => {
                    const results = submissionsByAssignment.get(item.id);
                    return <View key={item.id} wrap={false} style={styles.questions}>
                        <Text style={styles.questionsTitle}>Homework {index + 1}: {item.title}</Text>
                        <Text style={styles.question}>{item.question}</Text>
                        <View style={[styles.table, { marginTop: 8 }]}>
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.th, styles.colStudent]}>Student</Text>
                                <Text style={[styles.th, styles.colNum]}>Result</Text>
                                <Text style={[styles.th, styles.colRemarks]}>Status</Text>
                            </View>
                            {rows.map((student) => {
                                const submission = results?.get(student.studentId);
                                const score = submission?.score;
                                const graded = submission?.status === "graded" && score !== null && score !== undefined;
                                const result = graded ? `${score}/${item.maxScore} (${Math.round((score / item.maxScore) * 100)}%)` : "—";
                                const status = !submission ? "F · Not submitted" : graded ? "Graded" : "Awaiting grading";
                                return <View style={styles.tableRow} key={student.studentId}>
                                    <Text style={[styles.td, styles.colStudent]}>{student.name}</Text>
                                    <Text style={[styles.td, styles.colNum]}>{result}</Text>
                                    <Text style={[styles.td, styles.colRemarks, { color: !submission ? "#b91c1c" : "#0f172a" }]}>{status}</Text>
                                </View>;
                            })}
                        </View>
                    </View>;
                })}

                <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, styles.colStudent]}>Student</Text>
                        <Text style={[styles.th, styles.colNum]}>Homework</Text>
                        <Text style={[styles.th, styles.colNum]}>Grade</Text>
                        <Text style={[styles.th, styles.colRemarks]}>Remarks</Text>
                    </View>
                    {rows.length === 0 ? (
                        <View style={styles.tableRow}>
                            <Text style={{ ...styles.td, width: "100%", textAlign: "center", color: "#94a3b8" }}>
                                No students enrolled in this class yet.
                            </Text>
                        </View>
                    ) : (
                        rows.map((r) => (
                            <View style={styles.tableRow} key={r.studentId}>
                                <Text style={[styles.td, styles.colStudent]}>{r.name}</Text>
                                <Text style={[styles.td, styles.colNum]}>{r.assignmentAvg !== null ? `${r.assignmentAvg}%` : "—"}</Text>
                                <Text style={[styles.td, styles.colNum, { color: letterColor(r.letterGrade), fontWeight: 700 }]}>
                                    {r.letterGrade ?? "—"}
                                </Text>
                                <Text style={[styles.td, styles.colRemarks]}>{r.remarks ?? "—"}</Text>
                            </View>
                        ))
                    )}
                </View>

                <Text style={styles.footer}>
                    This is a computer-generated homework grade book from the school portal.
                </Text>
            </Page>
        </Document>
    );
}
