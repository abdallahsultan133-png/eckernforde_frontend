export type AcademixLetter = "A" | "B" | "C" | "D" | "F";

/** Academix secondary score bands. */
export function letterForScore(score: number | null | undefined): AcademixLetter | null {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  if (score >= 75) return "A";
  if (score >= 65) return "B";
  if (score >= 45) return "C";
  if (score >= 30) return "D";
  return "F";
}
