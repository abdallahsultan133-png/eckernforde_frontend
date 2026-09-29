import { useMemo } from "react";
import { BookOpen, FileText, GraduationCap, Megaphone, PanelsTopLeft, type LucideIcon } from "lucide-react";
import { useGetIdentity } from "@refinedev/core";
import { useApiQuery } from "@/hooks/use-api-query.ts";
import { PORTAL_PAGES } from "@/lib/portal-page";
import { isStaff } from "@/lib/roles";
import type { User } from "@/types";

type SearchClass = { id: number; name: string; subject?: { name?: string | null } | null };
type SearchSubject = { id: number; name: string; code?: string | null };
type SearchHomework = { id: number; title: string; class?: { name?: string | null } | null; subject?: { name?: string | null } | null };
type SearchAnnouncement = { id: number; title: string; body?: string | null };
type SearchStudent = { id: string; name: string; email?: string | null };

export type PortalSearchResult = {
  id: string;
  label: string;
  subtitle: string;
  path: string;
  kind: "page" | "class" | "subject" | "homework" | "announcement";
  icon: LucideIcon;
  keywords: string;
};

const PAGE_ALIASES: Record<string, string> = {
  "/parent/reports": "report reports academic grades results transcript",
  "/parent/reports/view": "report reports academic grades results transcript",
  "/parent": "report reports homework attendance children family records",
  "/parent/homework": "homework assignments learning submissions children",
  "/parent/attendance": "attendance present absent records children",
  "/grades/report-card": "report reports report card grades results transcript",
  "/grades/term-results": "report reports results grades academic progress transcript",
  "/grades/term-results/record": "report reports results grades record assessment",
  "/grades": "grade grades report reports homework assessment mark score",
  "/attendance/report": "report reports attendance present absent summary history",
  "/attendance": "attendance present absent register records",
  "/insights": "report reports analytics performance progress results",
  "/portal/history": "history report reports academic records previous years",
  "/profile": "profile settings account personal security",
  "/portal/setup": "form class school level primary secondary context",
  "/classes": "class classes subject subjects learning spaces",
  "/subjects": "subject subjects curriculum learning",
  "/activity": "activity updates announcements notifications",
  "/messages": "messages communication chat inbox",
};

function resultMatches(result: PortalSearchResult, query: string) {
  const haystack = `${result.label} ${result.subtitle} ${result.path} ${result.keywords}`.toLowerCase();
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.some((token) => haystack.includes(token));
}

function resultScore(result: PortalSearchResult, query: string) {
  const normalizedQuery = query.toLowerCase();
  const haystack = `${result.label} ${result.subtitle} ${result.path} ${result.keywords}`.toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const matchedTokens = tokens.filter((token) => haystack.includes(token)).length;
  const exactLabel = result.label.toLowerCase() === normalizedQuery ? 40 : 0;
  const labelStart = result.label.toLowerCase().startsWith(normalizedQuery) ? 20 : 0;
  const pagePriority = result.kind === "page" ? 4 : 0;
  return matchedTokens * 10 + exactLabel + labelStart + pagePriority;
}

/**
 * Searches destinations and live portal records for the text currently typed
 * into the header search. The same result set feeds both the inline dropdown
 * and the command palette so the two search surfaces never disagree.
 */
export function usePortalSearch(searchTerm: string, enabled: boolean) {
  const { data: identity } = useGetIdentity<User>();
  const canSearchStudents = isStaff(identity?.role);
  const { data: classes } = useApiQuery<{ data: SearchClass[] }>(enabled ? "/classes?limit=100" : null);
  const { data: subjects } = useApiQuery<{ data: SearchSubject[] }>(enabled ? "/subjects?limit=100" : null);
  const { data: homework } = useApiQuery<{ data: SearchHomework[] }>(enabled ? "/homework?limit=100" : null);
  const { data: announcements } = useApiQuery<{ data: SearchAnnouncement[] }>(enabled ? "/announcements?limit=100" : null);
  const { data: students } = useApiQuery<{ data: SearchStudent[] }>(
    enabled && canSearchStudents ? `/users/students?search=${encodeURIComponent(searchTerm.trim())}` : null,
  );

  return useMemo(() => {
    const query = searchTerm.trim();
    if (!query) return [];

    const pageResults: PortalSearchResult[] = PORTAL_PAGES.map((page) => ({
      id: `page-${page.path}`,
      label: page.title,
      subtitle: page.description,
      path: page.path,
      kind: "page",
      icon: page.path === "/portal" ? PanelsTopLeft : FileText,
      keywords: `${page.path} ${PAGE_ALIASES[page.path] ?? ""}`,
    }));
    const classResults: PortalSearchResult[] = (classes?.data ?? []).map((item) => ({
      id: `class-${item.id}`,
      label: item.name,
      subtitle: item.subject?.name ? `Class · ${item.subject.name}` : "Class",
      path: `/classes/show/${item.id}`,
      kind: "class",
      icon: GraduationCap,
      keywords: `${item.name} ${item.subject?.name ?? ""} class classes form`,
    }));
    const subjectResults: PortalSearchResult[] = (subjects?.data ?? []).map((item) => ({
      id: `subject-${item.id}`,
      label: item.name,
      subtitle: item.code ? `Subject · ${item.code}` : "Subject",
      path: "/subjects",
      kind: "subject",
      icon: BookOpen,
      keywords: `${item.name} ${item.code ?? ""} subject subjects curriculum`,
    }));
    const homeworkResults: PortalSearchResult[] = (homework?.data ?? []).map((item) => ({
      id: `homework-${item.id}`,
      label: item.title,
      subtitle: `Homework${item.subject?.name ? ` · ${item.subject.name}` : ""}${item.class?.name ? ` · ${item.class.name}` : ""}`,
      path: `/homework/${item.id}`,
      kind: "homework",
      icon: FileText,
      keywords: `${item.title} ${item.subject?.name ?? ""} ${item.class?.name ?? ""} homework assignment task`,
    }));
    const announcementResults: PortalSearchResult[] = (announcements?.data ?? []).map((item) => ({
      id: `announcement-${item.id}`,
      label: item.title,
      subtitle: "Announcement",
      path: "/announcements",
      kind: "announcement",
      icon: Megaphone,
      keywords: `${item.title} ${item.body ?? ""} announcement news update`,
    }));
    const studentResults: PortalSearchResult[] = (students?.data ?? []).map((item) => ({
      id: `student-${item.id}`,
      label: item.name,
      subtitle: "Student profile",
      path: `/students/${item.id}`,
      kind: "page",
      icon: GraduationCap,
      keywords: `${item.name} ${item.email ?? ""} student profile academic record`,
    }));

    return [...pageResults, ...classResults, ...subjectResults, ...homeworkResults, ...announcementResults, ...studentResults]
      .filter((result) => resultMatches(result, query))
      .sort((left, right) => resultScore(right, query) - resultScore(left, query))
      .slice(0, 30);
  }, [announcements?.data, classes?.data, homework?.data, searchTerm, students?.data, subjects?.data]);
}

usePortalSearch.displayName = "usePortalSearch";
