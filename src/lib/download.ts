/** Trigger the browser's "Save as" for a Blob or a string payload. */
export function saveFile(filename: string, data: Blob | string, mime = "application/octet-stream") {
    const blob =
        typeof data === "string" ? new Blob([data], { type: `${mime};charset=utf-8;` }) : data;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revoke on a later tick so the download has a chance to start first.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
