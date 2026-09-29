export type PortalSchoolBand = "primary" | "secondary" | null | undefined;

export const GENERAL_SCHOOL_NAME = "Eckernforde Schools";

export function portalSchoolName(band: PortalSchoolBand): string {
  if (band === "secondary") return "Eckernforde Cambridge Secondary School";
  if (band === "primary") return "Eckernforde English Medium Primary School";
  return GENERAL_SCHOOL_NAME;
}

export function portalSchoolTagline(band: PortalSchoolBand): string {
  if (band === "secondary") return "Cambridge Secondary School";
  if (band === "primary") return "English Medium Primary School";
  return "School Portal";
}

export function schoolBandFromResults(rows: Array<{ schoolLevel?: string | null; class?: { name?: string | null } | null }>, secondarySignal = false): PortalSchoolBand {
  if (rows.some((row) => row.schoolLevel === "secondary")) return "secondary";
  if (rows.some((row) => row.schoolLevel === "primary" || row.schoolLevel === "nursery")) return "primary";
  if (rows.some((row) => /^form\b/i.test(row.class?.name ?? ""))) return "secondary";
  if (rows.some((row) => /^(grade|standard|class)\b/i.test(row.class?.name ?? ""))) return "primary";
  if (secondarySignal) return "secondary";
  return null;
}
