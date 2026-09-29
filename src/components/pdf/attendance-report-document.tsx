import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import secondaryBadge from "@/assets/eckernforde-cambridge-badge.png";

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
    subjectName?: string;
    studentName?: string;
    studentReport?: boolean;
    schoolName?: string;
    schoolBand?: "primary" | "secondary" | null;
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
    brand: { fontSize: 18, fontWeight: 700, textDecoration: "underline" },
    studentHeader: { flexDirection: "column", alignItems: "center", textAlign: "center" },
    studentBrand: { alignItems: "center", textAlign: "center" },
    docTitle: { fontSize: 12, fontWeight: 700, textAlign: "right" },
    studentReportTitle: { fontSize: 12, fontWeight: 700, textAlign: "center", textDecoration: "underline" },
    docDate: { fontSize: 9, color: "#64748b", textAlign: "right", marginTop: 2 },
    classBlock: { marginBottom: 20, padding: 12, backgroundColor: "#f8fafc", borderRadius: 4 },
    className: { fontSize: 14, fontWeight: 700 },
    studentBlock: { marginBottom: 18, padding: 14, border: "1 solid #cbd5e1", backgroundColor: "#f8fafc" },
    studentName: { fontSize: 16, fontWeight: 700, marginBottom: 5 },
    studentMeta: { fontSize: 10, color: "#475569", marginTop: 2 },
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
    summary: { flexDirection: "row", marginBottom: 16, border: "1 solid #cbd5e1", backgroundColor: "#f8fafc" },
    summaryItem: { width: "25%", padding: 9, borderRight: "1 solid #cbd5e1", borderTop: "3 solid #64748b" },
    summaryLabel: { fontSize: 8, color: "#475569", fontWeight: 700 },
    summaryValue: { marginTop: 3, fontSize: 14, fontWeight: 700 },
    attendanceRate: { marginTop: 16, padding: 12, border: "1 solid #cbd5e1", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    attendanceRateLabel: { fontSize: 10, color: "#475569", fontWeight: 700 },
    attendanceRateValue: { fontSize: 20, fontWeight: 700 },
});

export function AttendanceReportDocument({ className, rows, subjectName, studentName, studentReport = false, schoolName = "School Portal", schoolBand }: AttendanceReportDocumentProps) {
    const generatedAt = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    const totals = rows.reduce((summary, row) => ({
        present: summary.present + row.presentCount,
        absent: summary.absent + row.absentCount,
        late: summary.late + row.lateCount,
        excused: summary.excused + row.excusedCount,
    }), { present: 0, absent: 0, late: 0, excused: 0 });
    const badge = schoolBand === "primary" ? "/eckernforde-english-medium-primary-badge.png" : secondaryBadge;
    const displaySchoolName = schoolName.trim().toUpperCase();
    const student = studentReport ? rows[0] : undefined;
    const studentRate = student?.attendanceRate ?? null;
    const attendanceSubject = subjectName || className;

    return (
        <Document title={`${studentReport ? "Student Attendance Report" : "Attendance Report"} - ${className}`}>
            <Page size="A4" style={styles.page}>
                <View style={[styles.header, studentReport ? styles.studentHeader : {}]}>
                    <View style={studentReport ? styles.studentBrand : { flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Image src={badge} style={{ width: studentReport ? 76 : 42, height: studentReport ? 76 : 42, objectFit: "contain", marginBottom: studentReport ? 6 : 0 }} />
                        <View style={studentReport ? { alignItems: "center" } : {}}>
                          <Text style={[styles.brand, studentReport ? { textAlign: "center" } : {}]}>{displaySchoolName}</Text>
                        </View>
                    </View>
                    {studentReport ? (
                        <View style={{ alignItems: "center", marginTop: 8 }}>
                            <Text style={styles.studentReportTitle}>STUDENT ATTENDANCE REPORT</Text>
                            <Text style={[styles.docDate, { textAlign: "center" }]}>Generated {generatedAt}</Text>
                        </View>
                    ) : <View>
                        <Text style={styles.docTitle}>ATTENDANCE REPORT</Text>
                        <Text style={styles.docDate}>Generated {generatedAt}</Text>
                    </View>}
                </View>

                {studentReport ? (
                    <>
                        <View style={styles.studentBlock}>
                            <Text style={styles.studentName}>{studentName || student?.name || "Student"}</Text>
                            <Text style={styles.studentMeta}>Subject: {attendanceSubject}</Text>
                            <Text style={styles.studentMeta}>Class: {className}</Text>
                        </View>
                        <View style={styles.summary}>
                            <View style={[styles.summaryItem, { borderTopColor: "#15803d" }]}><Text style={styles.summaryLabel}>PRESENT</Text><Text style={[styles.summaryValue, { color: "#15803d" }]}>{student?.presentCount ?? 0}</Text></View>
                            <View style={[styles.summaryItem, { borderTopColor: "#dc2626" }]}><Text style={styles.summaryLabel}>ABSENT</Text><Text style={[styles.summaryValue, { color: "#dc2626" }]}>{student?.absentCount ?? 0}</Text></View>
                            <View style={[styles.summaryItem, { borderTopColor: "#ca8a04" }]}><Text style={styles.summaryLabel}>LATE</Text><Text style={[styles.summaryValue, { color: "#ca8a04" }]}>{student?.lateCount ?? 0}</Text></View>
                            <View style={[styles.summaryItem, { borderRight: 0, borderTopColor: "#2563eb" }]}><Text style={styles.summaryLabel}>EXCUSED</Text><Text style={[styles.summaryValue, { color: "#2563eb" }]}>{student?.excusedCount ?? 0}</Text></View>
                        </View>
                        <View style={styles.attendanceRate}>
                            <Text style={styles.attendanceRateLabel}>Attendance rate for this subject</Text>
                            <Text style={[styles.attendanceRateValue, { color: rateColor(studentRate) }]}>{studentRate === null ? "—" : `${studentRate}%`}</Text>
                        </View>
                    </>
                ) : <>
                    <View style={styles.classBlock}>
                        <Text style={styles.className}>{className}</Text>
                    </View>

                    <View style={styles.summary}>
                        <View style={[styles.summaryItem, { borderTopColor: "#15803d" }]}><Text style={styles.summaryLabel}>PRESENT</Text><Text style={[styles.summaryValue, { color: "#15803d" }]}>{totals.present}</Text></View>
                        <View style={[styles.summaryItem, { borderTopColor: "#dc2626" }]}><Text style={styles.summaryLabel}>ABSENT</Text><Text style={[styles.summaryValue, { color: "#dc2626" }]}>{totals.absent}</Text></View>
                        <View style={[styles.summaryItem, { borderTopColor: "#ca8a04" }]}><Text style={styles.summaryLabel}>LATE</Text><Text style={[styles.summaryValue, { color: "#ca8a04" }]}>{totals.late}</Text></View>
                        <View style={[styles.summaryItem, { borderRight: 0, borderTopColor: "#2563eb" }]}><Text style={styles.summaryLabel}>EXCUSED</Text><Text style={[styles.summaryValue, { color: "#2563eb" }]}>{totals.excused}</Text></View>
                    </View>
                </>}

                {!studentReport && <View style={styles.table}>
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
                </View>}

                <Text style={styles.footer}>
                    This is a computer-generated attendance report.
                </Text>
            </Page>
        </Document>
    );
}
