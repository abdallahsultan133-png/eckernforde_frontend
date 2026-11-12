import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/layout/breadcrumb.tsx";
import { cn } from "@/lib/utils.ts";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router";

export interface PageBackLink {
  to: string;
  label: string;
}

/**
 * Returns the logical parent for portal detail/workflow pages. This keeps
 * navigation useful even when a page was opened directly or from a bookmark.
 */
export function pageBackLink(pathname: string): PageBackLink | null {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/attendance/qr" || path.startsWith("/attendance/qr/")) {
    return { to: "/attendance", label: "Back to Attendance" };
  }

  if (path === "/homework/grades") {
    return null;
  }

  if (path === "/homework/create") {
    return null;
  }

  const homeworkReport = path.match(/^\/homework\/([^/]+)\/report$/);
  if (homeworkReport) {
    return null;
  }

  if (/^\/homework\/[^/]+$/.test(path)) {
    return { to: "/homework", label: "Back to Homework" };
  }

  if (path === "/subjects/create") {
    return null;
  }

  if (/^\/subjects\/edit\/[^/]+$/.test(path)) {
    return { to: "/subjects", label: "Back to Subjects" };
  }

  if (/^\/classes\/[^/]+\/enroll$/.test(path)) {
    return { to: "/classes", label: "Back to Classes" };
  }

  if (path === "/announcements/create") {
    return null;
  }

  const reportCardStudent = path.match(/^\/grades\/report-card\/([^/]+)$/);
  if (reportCardStudent) {
    return { to: `/students/${reportCardStudent[1]}`, label: "Back to Student Profile" };
  }

  if (path === "/portal/exams") {
    return { to: "/portal", label: "Back to Dashboard" };
  }

  if (path === "/grades/report-card") {
    return { to: "/grades", label: "Back to Grades" };
  }

  if (path === "/grades/term-results") {
    return { to: "/grades", label: "Back to Grades" };
  }

  if (path === "/grades/term-results/record") {
    return { to: "/portal", label: "Back to Dashboard" };
  }

  if (/^\/portal\/history\/[^/]+$/.test(path)) {
    return { to: "/portal/history", label: "Back to Academic History" };
  }

  if (/^\/students\/[^/]+$/.test(path)) {
    return { to: "/students", label: "Back to Students" };
  }

  if (path === "/portal/setup") {
    return { to: "/portal", label: "Back to Dashboard" };
  }

  if ([
    "/admin/audit-logs",
    "/admin/admissions",
    "/admin/publish-results",
    "/admin/publications",
    "/admin/public-events",
    "/admin/report-card-template",
    "/admin/password-recovery",
  ].includes(path)) {
    return null;
  }

  if (/^\/admin\/[^/]+$/.test(path)) {
    return { to: "/portal", label: "Back to Dashboard" };
  }

  return null;
}

interface PageHeaderProps {
  title: ReactNode;
  /** One-line context under the title. */
  description?: ReactNode;
  /** Right-aligned slot for primary actions (buttons, filters). */
  actions?: ReactNode;
  /** Render the Refine breadcrumb trail above the title. */
  breadcrumb?: boolean;
  /** Extra node between breadcrumb and title (e.g. a "back" link, a status row). */
  above?: ReactNode;
  /** Explicit parent destination. When omitted, nested portal routes use an automatic parent. */
  backTo?: string;
  /** Accessible/display label for the explicit back destination. */
  backLabel?: string;
  /** Whether the automatic or explicit back link should be shown. */
  showBackLink?: boolean;
  /** Compact context above the title, such as a class or academic period. */
  eyebrow?: ReactNode;
  /** Optional metadata below the description. */
  metadata?: ReactNode;
  className?: string;
}

/**
 * The one page-title block. Replaces the several hand-rolled variants across
 * pages — `<h1 className="text-2xl…">`, `motion.div` + `.page-title`, the
 * `ListViewHeader`/`ShowViewHeader` combos — so every screen's masthead has the
 * same type scale, spacing and responsive behaviour.
 */
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb = false,
  above,
  backTo,
  backLabel = "Go back",
  showBackLink = true,
  eyebrow,
  metadata,
  className,
}: PageHeaderProps) {
  const { pathname } = useLocation();
  const backLink = showBackLink ? (backTo ? { to: backTo, label: backLabel } : breadcrumb ? pageBackLink(pathname) : null) : null;

  return (
    <header className={cn("space-y-3", className)}>
      {breadcrumb && <Breadcrumb />}
      {backLink && (
        <Link
          to={backLink.to}
          className="inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLink.label}
        </Link>
      )}
      {above}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          {eyebrow && (
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h1>
          {description && (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          )}
          {metadata && <div className="pt-1 text-sm text-muted-foreground">{metadata}</div>}
        </div>
        {actions && (
          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

PageHeader.displayName = "PageHeader";
