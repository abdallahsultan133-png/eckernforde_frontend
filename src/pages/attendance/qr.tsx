import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useGetIdentity, useList } from "@refinedev/core";
import { toast } from "sonner";
import { QrCode, RefreshCw, CheckCircle2, Clock, Users, XCircle, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { PageContainer } from "@/components/layout/page-container.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { BACKEND_BASE_URL } from "@/constants";
import { UserRole, type User, type ClassDetails } from "@/types";

type QrSession = {
    token: string;
    expiresAt: string;
    classId: number;
    date: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const attendanceClassLabel = (classItem: ClassDetails) =>
    classItem.subject?.name ? `${classItem.subject.name} — ${classItem.name}` : classItem.name;

const QrAttendancePage = () => {
    const { token: routeToken } = useParams<{ token?: string }>();
    const { data: identity } = useGetIdentity<User>();
    const isTeacherOrAdmin = identity?.role === UserRole.TEACHER
        || identity?.role === UserRole.ADMIN
        || identity?.role === UserRole.SUPER_ADMIN;

    const [classId, setClassId] = useState("");
    const [session, setSession] = useState<QrSession | null>(null);
    const [generating, setGenerating] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const autoScannedRef = useRef(false);

    const { query: classesQuery } = useList<ClassDetails>({
        resource: "classes",
        pagination: { pageSize: 100 },
    });
    const classes = classesQuery?.data?.data ?? [];

    // Countdown timer
    useEffect(() => {
        if (!session) return;
        const update = () => {
            const remaining = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
            setSecondsLeft(remaining);
            if (remaining === 0) setSession(null);
        };
        update();
        const t = setInterval(update, 1000);
        return () => clearInterval(t);
    }, [session]);

    const generate = async () => {
        if (!classId) return toast.error("Select a class first.");
        setGenerating(true);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/attendance/qr/generate`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classId: Number(classId), date: todayISO(), expiryMinutes: 15 }),
            });
            if (!res.ok) throw new Error((await res.json())?.error ?? "Failed");
            const { data } = await res.json();
            setSession(data);
            toast.success("QR code generated — valid for 15 minutes.");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to generate QR");
        } finally {
            setGenerating(false);
        }
    };

    // Student: mark attendance by submitting the token (manually, or
    // automatically when opened via a scanned QR link with a :token param).
    const markViaToken = async (token: string) => {
        setScanning(true);
        setScanError(null);
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/attendance/qr/${token}`, {
                method: "POST",
                credentials: "include",
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? "Failed");
            setScanResult(json.message ?? "Attendance recorded!");
            toast.success(json.message ?? "Attendance recorded!");
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to record attendance";
            setScanError(message);
            toast.error(message);
        } finally {
            setScanning(false);
        }
    };

    // Scanning the QR opens this page with the token in the URL — mark
    // attendance automatically instead of making the student paste it in.
    useEffect(() => {
        if (routeToken && !autoScannedRef.current) {
            autoScannedRef.current = true;
            markViaToken(routeToken);
        }
    }, [routeToken]);

    const scanUrl = session
        ? `${window.location.origin}/attendance/qr/scan/${session.token}`
        : "";

    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const isExpiringSoon = secondsLeft > 0 && secondsLeft <= 60;

    return (
        <PageContainer className="qr-attendance space-y-6">
            <Breadcrumb />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">QR Attendance</h1>
                    <p className="text-sm text-muted-foreground">
                        {isTeacherOrAdmin
                            ? "Generate a QR code — students scan it to mark themselves present."
                            : "Enter the QR code token your teacher displayed to mark yourself present."}
                    </p>
                </div>
            </div>

            {isTeacherOrAdmin ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Generate panel */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <QrCode className="h-5 w-5" /> Generate QR Code
                            </CardTitle>
                        </CardHeader>
                        <Separator />
                        <CardContent className="mt-4 space-y-4">
                            <Select value={classId} onValueChange={setClassId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.subject?.name ?? c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button onClick={generate} disabled={generating || !classId} className="w-full">
                                {generating ? "Generating..." : session ? (
                                    <><RefreshCw className="mr-2 h-4 w-4" />Regenerate</>
                                ) : (
                                    <><QrCode className="mr-2 h-4 w-4" />Generate QR Code</>
                                )}
                            </Button>

                            {session && (
                                <div className="rounded-lg border p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                            <Clock className="h-4 w-4" />
                                            <span className={isExpiringSoon ? "text-red-600" : "text-muted-foreground"}>
                                                Expires in {mins}:{String(secs).padStart(2, "0")}
                                            </span>
                                        </div>
                                        <Badge variant="outline">{todayISO()}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Token: <code className="bg-muted px-1 rounded text-xs">{session.token.slice(0, 12)}…</code>
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* QR display panel */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" /> Display to Students
                            </CardTitle>
                        </CardHeader>
                        <Separator />
                        <CardContent className="mt-4 flex flex-col items-center justify-center min-h-[260px]">
                            {!session ? (
                                <div className="text-center text-sm text-muted-foreground space-y-2">
                                    <QrCode className="mx-auto h-12 w-12 text-muted-foreground/30" />
                                    <p>Generate a QR code to display here.</p>
                                    <p className="text-xs">Show this on your screen — students scan it with their phone.</p>
                                </div>
                            ) : secondsLeft === 0 ? (
                                <div className="text-center text-sm text-muted-foreground">
                                    <p className="text-red-500 font-medium">QR code expired.</p>
                                    <p className="text-xs mt-1">Generate a new one to continue.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <div className={`p-4 rounded-xl border-2 ${isExpiringSoon ? "border-red-400" : "border-primary/20"}`}>
                                        <QRCodeSVG
                                            value={scanUrl}
                                            size={200}
                                            level="M"
                                            includeMargin
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                        Students open the school portal → Attendance → QR Scan<br />
                                        or visit: <code className="bg-muted px-1 rounded">/attendance/qr/scan</code>
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                /* Student: auto-marks via the scanned link's token, or falls back to manual entry */
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Mark Your Attendance</CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="mt-4 space-y-4">
                        {scanResult ? (
                            <div className="flex flex-col items-center gap-3 py-4 text-center">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                <p className="font-semibold text-emerald-700 dark:text-emerald-400">{scanResult}</p>
                                <Button variant="outline" onClick={() => { setScanResult(null); setScanError(null); }}>Mark another</Button>
                            </div>
                        ) : routeToken && scanning ? (
                            <div className="flex flex-col items-center gap-3 py-4 text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Marking your attendance…</p>
                            </div>
                        ) : routeToken && scanError ? (
                            <div className="flex flex-col items-center gap-3 py-4 text-center">
                                <XCircle className="h-12 w-12 text-red-500" />
                                <p className="font-semibold text-red-700 dark:text-red-400">{scanError}</p>
                                <Button variant="outline" onClick={() => markViaToken(routeToken)}>Try again</Button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Ask your teacher for the token shown on their screen, then enter it below.
                                </p>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.currentTarget);
                                        const token = String(fd.get("token") ?? "").trim();
                                        if (token) markViaToken(token);
                                    }}
                                    className="space-y-3"
                                >
                                    <input
                                        name="token"
                                        placeholder="Paste QR token here"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                        required
                                    />
                                    <Button type="submit" className="w-full" disabled={scanning}>
                                        {scanning ? "Marking..." : "Mark Present"}
                                    </Button>
                                </form>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </PageContainer>
    );
};

export default QrAttendancePage;
