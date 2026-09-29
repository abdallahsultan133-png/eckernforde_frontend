const SEARCH_HISTORY_KEY = "academix.portal.search-history";
const MAX_SEARCH_HISTORY = 6;

export function loadSearchHistory(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, MAX_SEARCH_HISTORY);
  } catch {
    return [];
  }
}

export function rememberSearch(term: string): string[] {
  const normalized = term.trim();
  if (!normalized) return loadSearchHistory();

  const history = [
    normalized,
    ...loadSearchHistory().filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
  ].slice(0, MAX_SEARCH_HISTORY);

  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Search still works when browser storage is unavailable.
  }

  return history;
}
