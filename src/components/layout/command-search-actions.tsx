import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useKBar, useRegisterActions, type Action } from "kbar";
import { useGetIdentity } from "@refinedev/core";
import { GraduationCap, UserRound } from "lucide-react";

import { useApiQuery } from "@/hooks/use-api-query.ts";
import { useDebouncedValue } from "@/hooks/use-debounced-value.ts";
import { isStaff } from "@/lib/roles.ts";
import type { User } from "@/types";

type ClassRow = { id: number; name: string; subject?: { name: string } | null };
type StudentRow = { id: string; name: string; email: string };

/**
 * Feeds live backend search results into the command palette (Ctrl/⌘-K) as
 * dynamic kbar actions, so it can actually find the entities its placeholder
 * promises — not just navigate to fixed pages.
 *
 * Only the endpoints that exist are queried: `/classes?search=` for everyone,
 * `/users/students?search=` for staff (that route is staff-only). Renders
 * nothing; it just registers actions while the palette is open.
 */
export function CommandSearchActions() {
  const navigate = useNavigate();
  const { data: identity } = useGetIdentity<User>();
  const staff = isStaff(identity?.role);

  const { searchQuery } = useKBar((state) => ({ searchQuery: state.searchQuery }));
  const q = useDebouncedValue(searchQuery.trim(), 250);
  const enabled = q.length >= 2;

  const { data: classData } = useApiQuery<{ data: ClassRow[] }>(
    enabled ? `/classes?search=${encodeURIComponent(q)}&limit=6` : null,
  );
  const { data: studentData } = useApiQuery<{ data: StudentRow[] }>(
    enabled && staff ? `/users/students?search=${encodeURIComponent(q)}` : null,
  );

  const actions = useMemo<Action[]>(() => {
    if (!enabled) return [];
    const list: Action[] = [];

    for (const c of (classData?.data ?? []).slice(0, 6)) {
      list.push({
        id: `search-class-${c.id}`,
        name: c.name,
        subtitle: c.subject?.name ? `Class · ${c.subject.name}` : "Class",
        section: "Classes",
        keywords: `${q} class ${c.subject?.name ?? ""}`,
        icon: <GraduationCap className="h-4 w-4" />,
        perform: () => navigate(`/classes/show/${c.id}`),
      });
    }

    if (staff) {
      for (const s of (studentData?.data ?? []).slice(0, 6)) {
        list.push({
          id: `search-student-${s.id}`,
          name: s.name,
          subtitle: s.email,
          section: "Students",
          keywords: `${q} student ${s.email}`,
          icon: <UserRound className="h-4 w-4" />,
          perform: () => navigate(`/students/${s.id}`),
        });
      }
    }

    return list;
  }, [enabled, q, classData, studentData, staff, navigate]);

  useRegisterActions(actions, [actions]);

  return null;
}

CommandSearchActions.displayName = "CommandSearchActions";
