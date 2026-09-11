import { createContext, useContext } from "react";

export type DownloadContextValue = {
    /**
     * Full flow: shows "Preparing download" with a spinner while `produce()`
     * builds the payload, then saves the file and shows "Downloaded".
     */
    download: (
        name: string,
        produce: () => Promise<Blob | string> | Blob | string,
        opts?: { mime?: string },
    ) => Promise<void>;
    /**
     * Narration only — for downloads the browser fires itself (a
     * `PDFDownloadLink` anchor). Shows the spinner briefly, then "Downloaded —
     * your file will start automatically."
     */
    narrateDownload: (name: string) => void;
};

export const DownloadContext = createContext<DownloadContextValue | null>(null);

export function useDownload(): DownloadContextValue {
    const ctx = useContext(DownloadContext);
    if (!ctx) throw new Error("useDownload must be used within <DownloadDialogProvider>");
    return ctx;
}
