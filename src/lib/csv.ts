function csvEscape(value: unknown): string {
    const s = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T extends Record<string, unknown>>(
    rows: T[],
    columns: Array<{ key: keyof T; label: string }>
): string {
    const header = columns.map((c) => csvEscape(c.label)).join(",");
    const body = rows.map((row) => columns.map((c) => csvEscape(row[c.key])).join(",")).join("\n");
    return `${header}\n${body}`;
}

export function downloadCsv(filename: string, csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Parses the first column out of a CSV/plain-text list — good enough for
 * values that never contain commas or quotes (e.g. emails), which is all
 * this app currently needs bulk-import for. Skips a header row if its first
 * cell matches one of `headerNames` (case-insensitive).
 */
export function parseSingleColumnCsv(text: string, headerNames: string[] = []): string[] {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const firstCell = lines[0]?.split(",")[0]?.trim().replace(/^"|"$/g, "").toLowerCase() ?? "";
    const startIndex = headerNames.map((h) => h.toLowerCase()).includes(firstCell) ? 1 : 0;

    return lines
        .slice(startIndex)
        .map((line) => line.split(",")[0]?.trim().replace(/^"|"$/g, "") ?? "")
        .filter(Boolean);
}
