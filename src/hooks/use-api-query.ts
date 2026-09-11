import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { BACKEND_BASE_URL } from "@/constants";

/**
 * Fetches `${BACKEND_BASE_URL}${path}` with the session cookie attached.
 * Throws with the backend's error/message field on non-2xx so react-query's
 * error state is populated correctly.
 */
export async function fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${BACKEND_BASE_URL}${path}`, { credentials: "include" });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? body?.message ?? "Request failed");
    }
    return res.json() as Promise<T>;
}

/**
 * Thin wrapper around useQuery for our REST backend — reuses Refine's own
 * QueryClient (it's already in the tree via <Refine>), so this gets the same
 * caching/dedup/refetch behavior as Refine's own useList/useOne, without
 * hand-rolled fetch + useState + useEffect per page.
 *
 * Pass `path: null` to skip the request (e.g. while a dependent id is unknown).
 *
 * Dashboard aggregate endpoints (`/dashboard/*`) are given a longer stale window
 * by default: they roll up counts/trends that don't move second-to-second, and
 * the dashboard is the most-revisited screen. A 2-minute stale window means
 * navigating away and back paints instantly from cache with no refetch and no
 * skeleton flash. Any caller can still override via `options`.
 */
export function useApiQuery<T>(
    path: string | null,
    options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
) {
    const isDashboardAggregate = path?.startsWith("/dashboard/") ?? false;

    return useQuery<T, Error>({
        queryKey: [path],
        queryFn: () => fetchJson<T>(path as string),
        enabled: path !== null && (options?.enabled ?? true),
        ...(isDashboardAggregate ? { staleTime: 120_000, gcTime: 600_000 } : {}),
        ...options,
    });
}
