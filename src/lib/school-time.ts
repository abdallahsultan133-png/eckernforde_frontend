export const schoolDate = (date: Date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Dar_es_Salaam", year: "numeric", month: "2-digit", day: "2-digit",
}).format(date);

export function lessonState(start: string, end: string | null, now: number) {
  if (now < Date.parse(start)) return "Upcoming";
  if (!end) return "Started";
  return now < Date.parse(end) ? "In progress" : "Completed";
}
