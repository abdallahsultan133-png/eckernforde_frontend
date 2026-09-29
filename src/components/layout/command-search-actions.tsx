import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useKBar, useRegisterActions, type Action } from "kbar";
import { usePortalSearch } from "@/hooks/use-portal-search.ts";

/** Registers the same whole-portal result set used by the inline search. */
export function CommandSearchActions() {
  const navigate = useNavigate();
  const { visualState, searchQuery } = useKBar((state) => ({
    visualState: state.visualState,
    searchQuery: state.searchQuery,
  }));
  const results = usePortalSearch(searchQuery, visualState !== "hidden" && searchQuery.trim().length > 0);

  const actions = useMemo<Action[]>(() => results.map((result) => ({
    id: result.id,
    name: result.label,
    subtitle: result.subtitle,
    section: result.kind === "page" ? "Portal" : "Portal records",
    icon: <result.icon className="h-4 w-4" />,
    keywords: result.keywords,
    perform: () => navigate(result.path),
  })), [navigate, results]);

  useRegisterActions(actions, [actions]);
  return null;
}

CommandSearchActions.displayName = "CommandSearchActions";
