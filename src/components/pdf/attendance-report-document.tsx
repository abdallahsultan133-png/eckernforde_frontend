import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import secondaryBadge from "@/assets/eckernforde-cambridge-badge.png";

type ReportRow = {
    studentId: string;
    name: string;
    email: string;
    subjectName?: string;
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
    studentReport?: boolean;
    studentAccountReport?: boolean;
    allSubjectsReport?: boolean;
    studentName?: string;
    studentClassName?: string;
    subjectName?: string;
    reportDescription?: string;
    schoolName?: string;
    schoolBand?: "primary" | "secondary" | null;
    firstDate?: string | null;
    lastDate?: string | null;
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
    reportSubheading: { fontSize: 16, fontWeight: 700, textAlign: "center", textDecoration: "underline", marginTop: 2 },
    classSubjectHeading: { fontSize: 10, fontWeight: 700, textAlign: "center", marginTop: 4 },
    reportPeriod: { fontSize: 10, color: "#475569", textAlign: "center", marginTop: 3 },
    studentBlock: { marginBottom: 18, padding: 14, border: "1 solid #cbd5e1", backgroundColor: "#f8fafc" },
    studentName: { fontSize: 16, fontWeight: 700, marginBottom: 5 },
    studentMeta: { fontSize: 10, color: "#475569", marginTop: 2 },
    table: { borderTop: "1 solid #e2e8f0", borderLeft: "1 solid #e2e8f0" },
    tableRow: { flexDirection: "row" },
    tableHeaderRow: { flexDirection: "row", backgroundColor: "#0f172a" },
    th: { padding: 6, fontSize: 8, fontWeight: 700, color: "#ffffff", borderRight: "1 solid #1e293b" },
    studentTh: { fontSize: 9 },
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
    summary: { flexDirection: "column", marginBottom: 16, gap: 5 },
    studentDetails: { marginBottom: 12, gap: 4 },
    studentDetail: { fontSize: 10, color: "#0f172a", fontWeight: 700 },
    summaryRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
    summaryItem: { flexDirection: "row", alignItems: "center" },
    summaryLabel: { fontSize: 9, color: "#0f172a", fontWeight: 700 },
    summaryValue: { fontSize: 9, color: "#0f172a" },
    studentSummaryLabel: { fontSize: 10, color: "#0f172a", fontWeight: 700 },
    studentSummaryValue: { fontSize: 10, color: "#0f172a" },
    summarySeparator: { marginHorizontal: 6, fontSize: 9, color: "#64748b" },
    studentSummarySeparator: { marginHorizontal: 6, fontSize: 10, color: "#64748b" },
    studentDate: { marginTop: 4, fontSize: 9, textAlign: "center", textDecoration: "underline" },
    attendanceRate: { marginTop: 16, padding: 12, border: "1 solid #cbd5e1", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    attendanceRateLabel: { fontSize: 10, color: "#475569", fontWeight: 700 },
    attendanceRateValue: { fontSize: 20, fontWeight: 700 },
});

export function AttendanceReportDocument({ className, rows, studentReport = false, studentAccountReport = false, allSubjectsReport = false, studentName, studentClassName, subjectName, reportDescription, schoolName = "School Portal", schoolBand, firstDate, lastDate }: AttendanceReportDocumentProps) {
    const generatedAt = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    const totals = rows.reduce((summary, row) => ({
        present: summary.present + Number(row.presentCount || 0),
        absent: summary.absent + Number(row.absentCount || 0),
        late: summary.late + Number(row.lateCount || 0),
        excused: summary.excused + Number(row.excusedCount || 0),
    }), { present: 0, absent: 0, late: 0, excused: 0 });
    const badge = schoolBand === "primary" ? "/eckernforde-english-medium-primary-badge.png" : secondaryBadge;
    const displaySchoolName = schoolName.trim().toUpperCase();
    const formatDate = (value?: string | null) => value
        ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
        : null;
    const formattedFirstDate = formatDate(firstDate);
    const formattedLastDate = formatDate(lastDate);
    const attendancePeriod = formattedFirstDate && formattedLastDate
        ? formattedFirstDate === formattedLastDate
            ? formattedFirstDate
            : `${formattedFirstDate} – ${formattedLastDate}`
        : null;

    return (
        <Document title={`${displaySchoolName} - ${(reportDescription || "ATTENDANCE REPORT").toUpperCase()}`}>
            <Page size="A4" style={styles.page}>
                <View style={[styles.header, styles.studentHeader]}>
                    <View style={styles.studentBrand}>
                        <Image src={badge} style={{ width: 76, height: 76, objectFit: "contain", marginBottom: 6 }} />
                        <View style={{ alignItems: "center" }}>
                          <Text style={[styles.brand, { textAlign: "center" }]}>{displaySchoolName}</Text>
                          <Text style={styles.reportSubheading}>ATTENDANCE REPORT</Text>
                          {studentAccountReport && attendancePeriod && <Text style={styles.studentDate}>Attendance recorded: {attendancePeriod}</Text>}
                        </View>
                    </View>
                    <View style={{ alignItems: "center" }}>
                        {!studentReport && <>
                            <Text style={styles.classSubjectHeading}>{`CLASS: ${className.toUpperCase()}${subjectName ? `  |  SUBJECT: ${subjectName.toUpperCase()}` : ""}`}</Text>
                            {attendancePeriod && <Text style={styles.reportPeriod}>Attendance recorded: {attendancePeriod}</Text>}
                        </>}
                    </View>
                </View>

                {studentReport && <View style={styles.studentDetails}>
                    <Text style={styles.studentDetail}>Student Name: {studentName ?? rows[0]?.name ?? "Student"}</Text>
                    {studentAccountReport && <>
                        <Text style={styles.studentDetail}>{schoolBand === "secondary" ? "Form" : "Class"}: {studentClassName ?? className}</Text>
                        <Text style={styles.studentDetail}>Subjects: {allSubjectsReport ? "All Subjects" : (subjectName ?? "Not specified")}</Text>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}><Text style={styles.studentSummaryLabel}>Total present: </Text><Text style={styles.studentSummaryValue}>{totals.present}</Text></View>
                            <Text style={styles.studentSummarySeparator}>||</Text>
                            <View style={styles.summaryItem}><Text style={styles.studentSummaryLabel}>Total absent: </Text><Text style={styles.studentSummaryValue}>{totals.absent}</Text></View>
                        </View>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}><Text style={styles.studentSummaryLabel}>Total late: </Text><Text style={styles.studentSummaryValue}>{totals.late}</Text></View>
                            <Text style={styles.studentSummarySeparator}>||</Text>
                            <View style={styles.summaryItem}><Text style={styles.studentSummaryLabel}>Total excused: </Text><Text style={styles.studentSummaryValue}>{totals.excused}</Text></View>
                        </View>
                    </>}
                    {!studentAccountReport && <>
                        <Text style={styles.studentDetail}>Subject: {allSubjectsReport ? "All Subjects" : (subjectName ?? "Not specified")}</Text>
                        <Text style={styles.studentDetail}>{schoolBand === "secondary" ? "Form" : "Class"}: {studentClassName ?? className}</Text>
                        {attendancePeriod && <Text style={styles.reportPeriod}>Attendance recorded: {attendancePeriod}</Text>}
                    </>}
                </View>}

                {!studentAccountReport && <View style={styles.summary}>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Total present: </Text><Text style={styles.summaryValue}>{totals.present}</Text></View>
                            <Text style={styles.summarySeparator}>|</Text>
                            <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Total absent: </Text><Text style={styles.summaryValue}>{totals.absent}</Text></View>
                        </View>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Total late: </Text><Text style={styles.summaryValue}>{totals.late}</Text></View>
                            <Text style={styles.summarySeparator}>|</Text>
                            <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Total excused: </Text><Text style={styles.summaryValue}>{totals.excused}</Text></View>
                        </View>
                </View>}

                <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, studentAccountReport ? styles.studentTh : {}, styles.colStudent]}>{allSubjectsReport ? "Subjects" : "Student"}</Text>
                        <Text style={[styles.th, studentAccountReport ? styles.studentTh : {}, styles.colNum]}>Present</Text>
                        <Text style={[styles.th, studentAccountReport ? styles.studentTh : {}, styles.colNum]}>Absent</Text>
                        <Text style={[styles.th, studentAccountReport ? styles.studentTh : {}, styles.colNum]}>Late</Text>
                        <Text style={[styles.th, studentAccountReport ? styles.studentTh : {}, styles.colNum]}>Excused</Text>
                        <Text style={[styles.th, studentAccountReport ? styles.studentTh : {}, styles.colNum]}>Rate</Text>
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
                                <Text style={[styles.td, styles.colStudent]}>{allSubjectsReport ? r.subjectName : r.name}</Text>
                                <Text style={[styles.td, styles.colNum]}>{Number(r.presentCount || 0)}</Text>
                                <Text style={[styles.td, styles.colNum]}>{Number(r.absentCount || 0)}</Text>
                                <Text style={[styles.td, styles.colNum]}>{Number(r.lateCount || 0)}</Text>
                                <Text style={[styles.td, styles.colNum]}>{Number(r.excusedCount || 0)}</Text>
                                <Text style={[styles.td, styles.colNum, { color: rateColor(r.attendanceRate), fontWeight: 700 }]}>
                                    {r.attendanceRate === null ? "—" : `${r.attendanceRate}%`}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                <Text style={styles.footer}>
                    Generated {generatedAt}{"\n"}
                    This is a computer-generated attendance report.
                </Text>
            </Page>
        </Document>
    );
}
