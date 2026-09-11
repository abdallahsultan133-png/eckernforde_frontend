import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

type ReportRow = {
    studentId: string;
    name: string;
    email: string;
    totalMarked: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    attendanceRate: number | null;
};

type AttendanceReportDocumentProps = {
    className: string;
    rows: ReportRow[];
};

const rateColor = (rate: number | null) => {
    if (rate === null) return "#475569";
    if (rate >= 90) return "#047857";
    if (rate >= 75) return "#b45309";
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
    colStudent: { width: "34%" },
    colNum: { width: "13%", textAlign: "center" },
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

export function AttendanceReportDocument({ className, rows }: AttendanceReportDocumentProps) {
    const generatedAt = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

    return (
        <Document title={`Attendance Report - ${className}`}>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>Your School</Text>
                        <Text style={styles.brandSub}>Attendance Report</Text>
                    </View>
                    <View>
                        <Text style={styles.docTitle}>ATTENDANCE REPORT</Text>
                        <Text style={styles.docDate}>Generated {generatedAt}</Text>
                    </View>
                </View>

                <View style={styles.classBlock}>
                    <Text style={styles.className}>{className}</Text>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, styles.colStudent]}>Student</Text>
                        <Text style={[styles.th, styles.colNum]}>Present</Text>
                        <Text style={[styles.th, styles.colNum]}>Absent</Text>
                        <Text style={[styles.th, styles.colNum]}>Late</Text>
                        <Text style={[styles.th, styles.colNum]}>Excused</Text>
                        <Text style={[styles.th, styles.colNum]}>Rate</Text>
                    </View>
                    {rows.length === 0 ? (
                        <View style={styles.tableRow}>
                            <Text style={{ ...styles.td, width: "100%", textAlign: "center", color: "#94a3b8" }}>
                                No enrolled students to report on yet.
                            </Text>
                        </View>
                    ) : (
                        rows.map((r) => (
                            <View style={styles.tableRow} key={r.studentId}>
                                <Text style={[styles.td, styles.colStudent]}>{r.name}</Text>
                                <Text style={[styles.td, styles.colNum]}>{r.presentCount}</Text>
                                <Text style={[styles.td, styles.colNum]}>{r.absentCount}</Text>
                                <Text style={[styles.td, styles.colNum]}>{r.lateCount}</Text>
                                <Text style={[styles.td, styles.colNum]}>{r.excusedCount}</Text>
                                <Text style={[styles.td, styles.colNum, { color: rateColor(r.attendanceRate), fontWeight: 700 }]}>
                                    {r.attendanceRate === null ? "—" : `${r.attendanceRate}%`}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                <Text style={styles.footer}>
                    This is a computer-generated attendance report from the school portal.
                </Text>
            </Page>
        </Document>
    );
}
