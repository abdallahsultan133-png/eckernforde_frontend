import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

type GradebookRow = {
    studentId: string;
    name: string;
    email: string;
    assignmentAvg: number | null;
    examAvg: number | null;
    finalGrade: number | null;
    letterGrade: string | null;
    remarks: string | null;
};

type GradebookDocumentProps = {
    className: string;
    rows: GradebookRow[];
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
        alignItems: "flex-start",
        borderBottom: "2 solid #0f172a",
        paddingBottom: 12,
        marginBottom: 20,
    },
    brand: { fontSize: 18, fontWeight: 700 },
    brandSub: { fontSize: 9, color: "#64748b", marginTop: 2 },
    docTitle: { fontSize: 12, fontWeight: 700, textAlign: "right" },
    docDate: { fontSize: 9, color: "#64748b", textAlign: "right", marginTop: 2 },
    classBlock: { marginBottom: 20, padding: 12, backgroundColor: "#f8fafc", borderRadius: 4 },
    className: { fontSize: 14, fontWeight: 700 },
    table: { borderTop: "1 solid #e2e8f0", borderLeft: "1 solid #e2e8f0" },
    tableRow: { flexDirection: "row" },
    tableHeaderRow: { flexDirection: "row", backgroundColor: "#0f172a" },
    th: { padding: 6, fontSize: 8, fontWeight: 700, color: "#ffffff", borderRight: "1 solid #1e293b" },
    td: { padding: 6, fontSize: 9, borderRight: "1 solid #e2e8f0", borderBottom: "1 solid #e2e8f0" },
    colStudent: { width: "32%" },
    colNum: { width: "13%", textAlign: "center" },
    colRemarks: { width: "16%" },
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

export function GradebookDocument({ className, rows }: GradebookDocumentProps) {
    const generatedAt = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

    return (
        <Document title={`Gradebook - ${className}`}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>Your School</Text>
                        <Text style={styles.brandSub}>Gradebook Summary</Text>
                    </View>
                    <View>
                        <Text style={styles.docTitle}>GRADEBOOK</Text>
                        <Text style={styles.docDate}>Generated {generatedAt}</Text>
                    </View>
                </View>

                <View style={styles.classBlock}>
                    <Text style={styles.className}>{className}</Text>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, styles.colStudent]}>Student</Text>
                        <Text style={[styles.th, styles.colNum]}>Assignment</Text>
                        <Text style={[styles.th, styles.colNum]}>Exam</Text>
                        <Text style={[styles.th, styles.colNum]}>Final</Text>
                        <Text style={[styles.th, styles.colNum]}>Letter</Text>
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
                                <Text style={[styles.td, styles.colNum]}>{r.examAvg !== null ? `${r.examAvg}%` : "—"}</Text>
                                <Text style={[styles.td, styles.colNum]}>{r.finalGrade ?? "—"}</Text>
                                <Text style={[styles.td, styles.colNum, { color: letterColor(r.letterGrade), fontWeight: 700 }]}>
                                    {r.letterGrade ?? "—"}
                                </Text>
                                <Text style={[styles.td, styles.colRemarks]}>{r.remarks ?? "—"}</Text>
                            </View>
                        ))
                    )}
                </View>

                <Text style={styles.footer}>
                    This is a computer-generated gradebook summary from the school portal.
                </Text>
            </Page>
        </Document>
    );
}
