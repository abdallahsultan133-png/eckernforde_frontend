import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Loader2, TriangleAlert } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DownloadContext, type DownloadContextValue } from "@/hooks/use-download.ts";
import { saveFile } from "@/lib/download.ts";
import { cn } from "@/lib/utils";

type Phase = "idle" | "preparing" | "done" | "error";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const MIN_SPINNER_MS = 700;
const AUTO_CLOSE_MS = 4500;

/**
 * One app-wide "Downloading …" dialog: a spinning circle while the file is
 * prepared, then a green check + "Your <name> download will start
 * automatically." Wrap the app once; call it via `useDownload()`.
 */
export function DownloadDialogProvider({ children }: { children: ReactNode }) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [name, setName] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearAutoClose = () => {
        if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
        autoCloseTimer.current = null;
    };

    const close = useCallback(() => {
        clearAutoClose();
        setPhase("idle");
    }, []);

    const toDone = useCallback(() => {
        setPhase("done");
        clearAutoClose();
        autoCloseTimer.current = setTimeout(() => setPhase("idle"), AUTO_CLOSE_MS);
    }, []);

    const download = useCallback<DownloadContextValue["download"]>(
        async (fileName, produce, opts) => {
            clearAutoClose();
            setErrorMessage(null);
            setName(fileName);
            setPhase("preparing");
            try {
                const [payload] = await Promise.all([
                    Promise.resolve(produce()),
                    wait(MIN_SPINNER_MS),
                ]);
                saveFile(fileName, payload, opts?.mime);
                toDone();
            } catch (err) {
                setErrorMessage(err instanceof Error ? err.message : null);
                setPhase("error");
            }
        },
        [toDone],
    );

    const narrateDownload = useCallback<DownloadContextValue["narrateDownload"]>(
        (fileName) => {
            clearAutoClose();
            setErrorMessage(null);
            setName(fileName);
            setPhase("preparing");
            setTimeout(toDone, 900);
        },
        [toDone],
    );

    const value = useMemo<DownloadContextValue>(
        () => ({ download, narrateDownload }),
        [download, narrateDownload],
    );

    const open = phase !== "idle";
    const busy = phase === "preparing";

    return (
        <DownloadContext.Provider value={value}>
            {children}
            <Dialog
                open={open}
                onOpenChange={(next) => {
                    // Can't dismiss while the file is still being prepared.
                    if (!next && !busy) close();
                }}
            >
                <DialogContent
                    showCloseButton={!busy}
                    onEscapeKeyDown={(e) => busy && e.preventDefault()}
                    onPointerDownOutside={(e) => busy && e.preventDefault()}
                    className="max-w-sm"
                >
                    <div className="flex flex-col items-center gap-4 pt-2 text-center">
                        <div
                            className={cn(
                                "flex h-16 w-16 items-center justify-center rounded-full",
                                phase === "done" &&
                                    "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
                                phase === "error" &&
                                    "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
                                busy && "bg-muted text-muted-foreground",
                            )}
                        >
                            {busy ? (
                                <Loader2 className="h-7 w-7 animate-spin" />
                            ) : phase === "done" ? (
                                <Check className="h-8 w-8" strokeWidth={2.5} />
                            ) : (
                                <TriangleAlert className="h-7 w-7" />
                            )}
                        </div>

                        <DialogHeader className="items-center gap-1.5">
                            <DialogTitle className="text-xl">
                                {busy ? "Downloading" : phase === "done" ? "Download complete" : "Download failed"}
                            </DialogTitle>
                            <DialogDescription className="text-center">
                                {busy ? (
                                    <>
                                        Getting <span className="font-medium text-foreground">{name}</span> ready — this
                                        will only take a moment…
                                    </>
                                ) : phase === "done" ? (
                                    <>
                                        <span className="font-medium text-foreground">{name}</span> was downloaded
                                        successfully.
                                    </>
                                ) : (
                                    errorMessage ?? "Something went wrong while preparing the file. Please try again."
                                )}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    {!busy && (
                        <DialogFooter className="sm:justify-center">
                            <Button variant="outline" onClick={close} className="min-w-24">
                                Close
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </DownloadContext.Provider>
    );
}
