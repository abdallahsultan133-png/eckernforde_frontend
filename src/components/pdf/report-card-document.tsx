import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import schoolBadge from "@/assets/eckernforde-cambridge-badge.png";

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
    registrationNumber?: string | null;
    grades: GradeRow[];
    passCount: number;
    template?: {
        schoolName: string;
        schoolAddress: string | null;
        headmasterName: string | null;
        headmasterSignature: string | null;
    };
};

export type FormalTermResult = {
    title: string;
    termName: string;
    rows: Array<{
        id: number;
        score: number;
        schoolLevel?: "nursery" | "primary" | "secondary" | null;
        applicable: boolean;
        subject: { name: string };
        class: { id: number; name: string };
    }>;
    division?: string | null;
    totalPoints?: number | null;
    position?: { position: number; totalStudents: number; averageScore: number; divisionPoints: number | null } | null;
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
    formalTable: {
        borderTop: "1 solid #e2e8f0",
        borderLeft: "1 solid #e2e8f0",
    },
    formalHeader: {
        flexDirection: "row",
    },
    formalHeaderCell: {
        padding: 6,
        fontSize: 8,
        fontWeight: 700,
        color: "#ffffff",
        borderRight: "1 solid #ffffff55",
    },
    formalCell: {
        padding: 6,
        fontSize: 9,
        borderRight: "1 solid #e2e8f0",
        borderBottom: "1 solid #e2e8f0",
    },
    formalSubject: { width: "58%" },
    formalClass: { width: "27%" },
    formalScore: { width: "21%", textAlign: "center" },
    formalStatus: { width: "21%", textAlign: "center" },
    logo: { width: 42, height: 42, objectFit: "contain", marginRight: 10 },
    signatureRow: { flexDirection: "row", justifyContent: "space-between", gap: 20, borderTop: "1 solid #e2e8f0", paddingTop: 10, marginTop: 28 },
    signatureBlock: { width: "45%", textAlign: "center", fontSize: 8 },
});

export function ReportCardDocument({
    studentName,
    registrationNumber,
    grades,
    passCount,
    template,
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
                        <Text style={styles.brand}>Eckernforde Schools</Text>
                        {template?.schoolAddress ? <Text style={styles.brandSub}>{template.schoolAddress}</Text> : null}
                    </View>
                    <View>
                        <Text style={styles.docTitle}>REPORT CARD</Text>
                        <Text style={styles.docDate}>Generated {generatedAt}</Text>
                    </View>
                </View>

                <View style={styles.studentBlock}>
                    <Text style={styles.studentName}>{studentName}</Text>
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
                        <Text style={[styles.th, styles.colNum]}>Homework</Text>
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
                    {template?.headmasterName ? `${template.headmasterName} · ` : ""}{template?.headmasterSignature || "This is a computer-generated report card. Contact the school office for verification."}
                </Text>
            </Page>
        </Document>
    );
}

type FormalReportCardDocumentProps = {
    studentName: string;
    schoolName?: string;
    registrationNumber?: string | null;
    template?: {
        schoolName: string;
        schoolAddress: string | null;
        headmasterName: string | null;
        headmasterSignature: string | null;
        logoUrl?: string | null;
        accentColor?: string;
        showAttendance?: boolean;
        showRemarks?: boolean;
        showDivision?: boolean;
    };
    termResults: FormalTermResult[];
    academicYearName?: string;
    attendance?: { present: number; absent: number; late: number; excused: number; total: number };
};

/** PDF used by the student/parent Term Results page. It contains only the
 * published formal terms passed by the page, so an unpublished Annual term is
 * never rendered as an empty section. */
export function FormalReportCardDocument({
    studentName,
    schoolName: suppliedSchoolName,
    registrationNumber,
    template,
    termResults,
    academicYearName,
    attendance,
}: FormalReportCardDocumentProps) {
    const accent = template?.accentColor ?? "#0f172a";
    const schoolName = (suppliedSchoolName || "School Portal").toUpperCase();
    // The official report-card PDF always uses the school's supplied badge,
    // even when an older saved template contains an empty or broken logo URL.
    const schoolLogo = schoolBadge;

    return (
        <Document title={`Report Card - ${studentName}`}>
            <Page size="A4" style={styles.page}>
                <View style={[styles.header, { borderBottomColor: accent, flexDirection: "column", alignItems: "center" }]}>
                    <View style={{ width: "100%", alignItems: "center" }}>
                        <Image src={schoolLogo} style={{ width: 88, height: 88, objectFit: "contain", alignSelf: "center", marginBottom: 6 }} />
                        <Text style={[styles.brand, { color: accent, textDecoration: "underline", textAlign: "center" }]}>{schoolName}</Text>
                        {template?.schoolAddress ? <Text style={[styles.brandSub, { textAlign: "center" }]}>{template.schoolAddress}</Text> : null}
                    </View>
                    <View style={{ alignItems: "center", marginTop: 8 }}>
                        <Text style={[styles.docTitle, { color: accent }]}>STUDENT REPORT CARD</Text>
                        <Text style={styles.docDate}>Academic year {academicYearName || "—"}</Text>
                    </View>
                </View>
                <View style={styles.studentBlock}>
                    <Text style={styles.studentName}>{studentName}</Text>
                    {registrationNumber ? <Text style={styles.studentMeta}>Registration No: {registrationNumber}</Text> : null}
                    {termResults[0]?.rows[0]?.class.name ? <Text style={styles.studentMeta}>Class / Form: {termResults[0].rows[0].class.name}</Text> : null}
                    {termResults.find((term) => term.title === "Midterm") ? <Text style={styles.studentMeta}>Midterm: {termResults.find((term) => term.title === "Midterm")?.division ? `Division ${termResults.find((term) => term.title === "Midterm")?.division} · ${termResults.find((term) => term.title === "Midterm")?.totalPoints ?? ""} points` : "Division pending"}</Text> : null}
                    {termResults.find((term) => term.title === "Terminal") ? <Text style={styles.studentMeta}>Terminal: {termResults.find((term) => term.title === "Terminal")?.division ? `Division ${termResults.find((term) => term.title === "Terminal")?.division} · ${termResults.find((term) => term.title === "Terminal")?.totalPoints ?? ""} points` : "Division pending"}</Text> : null}
                </View>
                {termResults.map((term) => (
                    <View key={`${term.title}-${term.termName}`} style={{ marginBottom: 18, paddingBottom: 12, borderBottom: "1 solid #e2e8f0" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: 700, color: accent }}>{term.title === "Midterm" ? "PART 1 · MIDTERM" : "PART 2 · TERMINAL"}</Text>
                                <Text style={styles.docDate}>{term.termName}</Text>
                            </View>
                        </View>
                        <View style={styles.formalTable}>
                            <View style={[styles.formalHeader, { backgroundColor: accent }]}>
                                <Text style={[styles.formalHeaderCell, styles.formalSubject]}>Subject</Text>
                                <Text style={[styles.formalHeaderCell, styles.formalScore]}>Marks</Text>
                                <Text style={[styles.formalHeaderCell, styles.formalStatus]}>Grade</Text>
                            </View>
                            {term.rows.map((row) => (
                                <View style={styles.tableRow} key={row.id}>
                                    <Text style={[styles.formalCell, styles.formalSubject]}>{row.subject.name}</Text>
                                    <Text style={[styles.formalCell, styles.formalScore]}>{row.score}</Text>
                                    <Text style={[styles.formalCell, styles.formalStatus]}>{row.applicable ? (row.score >= 75 ? "A" : row.score >= 65 ? "B" : row.score >= 45 ? "C" : row.score >= 30 ? "D" : "F") : "Excluded"}</Text>
                                </View>
                            ))}
                        </View>
                        {template?.showDivision !== false ? <Text style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: accent }}>{term.division ? `Division ${term.division}${term.totalPoints != null ? ` · ${term.totalPoints} points` : ""}` : "Division pending (marks required)"}</Text> : null}
                        {term.position ? <Text style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: accent }}>Position: {term.position.position} of {term.position.totalStudents} · {term.position.divisionPoints !== null ? `${term.position.divisionPoints} division points` : `Average ${term.position.averageScore}%`}</Text> : null}
                    </View>
                ))}
                {template?.showAttendance ? <View style={{ border: "1 solid #e2e8f0", padding: 8, marginTop: 4 }}><Text style={{ color: accent, fontWeight: 700 }}>Attendance</Text><Text style={styles.studentMeta}>{attendance && attendance.total > 0 ? `Present ${attendance.present} · Absent ${attendance.absent} · Late ${attendance.late} · Excused ${attendance.excused}` : "No attendance records are available for this report."}</Text></View> : null}
                {template?.showRemarks ? <View style={{ border: "1 solid #e2e8f0", padding: 8, marginTop: 8 }}><Text style={{ color: accent, fontWeight: 700 }}>Teacher remarks</Text><Text style={styles.studentMeta}>No teacher remarks have been recorded for this report.</Text></View> : null}
                <View style={styles.signatureRow}>
                    <View style={styles.signatureBlock}><Text style={{ borderBottom: "1 solid #94a3b8", paddingBottom: 6 }}>Class teacher</Text><Text>Class teacher signature</Text></View>
                    <View style={styles.signatureBlock}><Text style={{ borderBottom: "1 solid #94a3b8", paddingBottom: 6 }}>{template?.headmasterSignature || "Headmaster signature"}</Text><Text>{template?.headmasterName || "Headmaster"}</Text></View>
                </View>
                <Text style={styles.footer}>
                    {template?.headmasterName ? `${template.headmasterName} Â· ` : ""}{template?.headmasterSignature || "This is a computer-generated report card. Contact the school office for verification."}
                </Text>
            </Page>
        </Document>
    );
}
