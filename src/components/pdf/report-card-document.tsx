import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

type GradeRow = {
    id: number;
    classId: number;
    finalGrade: number | null;
    letterGrade: string | null;
    remarks: string | null;
    assignmentAvg: number | null;
    examAvg: number | null;
    class: { id: number; name: string };
};

type ReportCardDocumentProps = {
    studentName: string;
    studentEmail: string;
    registrationNumber?: string | null;
    grades: GradeRow[];
    passCount: number;
};

const letterColor = (letter: string | null) => {
    if (!letter) return "#475569";
    if (letter === "A") return "#047857";
    if (letter === "B") return "#1d4ed8";
    if (letter === "C") return "#b45309";
    return "#b91c1c";
};

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#0f172a",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottom: "2 solid #0f172a",
        paddingBottom: 12,
        marginBottom: 20,
    },
    brand: {
        fontSize: 18,
        fontWeight: 700,
    },
    brandSub: {
        fontSize: 9,
        color: "#64748b",
        marginTop: 2,
    },
    docTitle: {
        fontSize: 12,
        fontWeight: 700,
        textAlign: "right",
    },
    docDate: {
        fontSize: 9,
        color: "#64748b",
        textAlign: "right",
        marginTop: 2,
    },
    studentBlock: {
        marginBottom: 20,
        padding: 12,
        backgroundColor: "#f8fafc",
        borderRadius: 4,
    },
    studentName: {
        fontSize: 14,
        fontWeight: 700,
        marginBottom: 2,
    },
    studentMeta: {
        fontSize: 9,
        color: "#475569",
    },
    statsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        padding: 10,
        border: "1 solid #e2e8f0",
        borderRadius: 4,
        alignItems: "center",
    },
    statValue: {
        fontSize: 20,
        fontWeight: 700,
    },
    statLabel: {
        fontSize: 8,
        color: "#64748b",
        marginTop: 2,
    },
    table: {
        borderTop: "1 solid #e2e8f0",
        borderLeft: "1 solid #e2e8f0",
    },
    tableRow: {
        flexDirection: "row",
    },
    tableHeaderRow: {
        flexDirection: "row",
        backgroundColor: "#0f172a",
    },
    th: {
        padding: 6,
        fontSize: 8,
        fontWeight: 700,
        color: "#ffffff",
        borderRight: "1 solid #1e293b",
    },
    td: {
        padding: 6,
        fontSize: 9,
        borderRight: "1 solid #e2e8f0",
        borderBottom: "1 solid #e2e8f0",
    },
    colClass: { width: "30%" },
    colNum: { width: "13%", textAlign: "center" },
    colRemarks: { width: "18%" },
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

export function ReportCardDocument({
    studentName,
    studentEmail,
    registrationNumber,
    grades,
    passCount,
}: ReportCardDocumentProps) {
    const generatedAt = new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <Document title={`Report Card - ${studentName}`}>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>Your School</Text>
                        <Text style={styles.brandSub}>Academic Report Card</Text>
                    </View>
                    <View>
                        <Text style={styles.docTitle}>REPORT CARD</Text>
                        <Text style={styles.docDate}>Generated {generatedAt}</Text>
                    </View>
                </View>

                <View style={styles.studentBlock}>
                    <Text style={styles.studentName}>{studentName}</Text>
                    <Text style={styles.studentMeta}>{studentEmail}</Text>
                    {registrationNumber ? (
                        <Text style={styles.studentMeta}>Registration No: {registrationNumber}</Text>
                    ) : null}
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{grades.length}</Text>
                        <Text style={styles.statLabel}>CLASSES GRADED</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{passCount}/{grades.length}</Text>
                        <Text style={styles.statLabel}>CLASSES PASSED</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, styles.colClass]}>Class</Text>
                        <Text style={[styles.th, styles.colNum]}>Assignment</Text>
                        <Text style={[styles.th, styles.colNum]}>Exam</Text>
                        <Text style={[styles.th, styles.colNum]}>Final</Text>
                        <Text style={[styles.th, styles.colNum]}>Grade</Text>
                        <Text style={[styles.th, styles.colRemarks]}>Remarks</Text>
                    </View>
                    {grades.length === 0 ? (
                        <View style={styles.tableRow}>
                            <Text style={{ ...styles.td, width: "100%", textAlign: "center", color: "#94a3b8" }}>
                                No grades recorded yet.
                            </Text>
                        </View>
                    ) : (
                        grades.map((g) => (
                            <View style={styles.tableRow} key={g.id}>
                                <Text style={[styles.td, styles.colClass]}>{g.class.name}</Text>
                                <Text style={[styles.td, styles.colNum]}>{g.assignmentAvg !== null ? `${g.assignmentAvg}%` : "—"}</Text>
                                <Text style={[styles.td, styles.colNum]}>{g.examAvg !== null ? `${g.examAvg}%` : "—"}</Text>
                                <Text style={[styles.td, styles.colNum]}>{g.finalGrade ?? "—"}</Text>
                                <Text style={[styles.td, styles.colNum, { color: letterColor(g.letterGrade), fontWeight: 700 }]}>
                                    {g.letterGrade ?? "—"}
                                </Text>
                                <Text style={[styles.td, styles.colRemarks]}>{g.remarks ?? "—"}</Text>
                            </View>
                        ))
                    )}
                </View>

                <Text style={styles.footer}>
                    This is a computer-generated report card. Contact the school office for verification.
                </Text>
            </Page>
        </Document>
    );
}
