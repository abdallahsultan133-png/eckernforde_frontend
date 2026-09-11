import { useEffect, useState } from "react";

/** Returns `value`, but delayed by `delayMs` after the last change — for
 * search-as-you-type inputs that shouldn't fire a request on every keystroke. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(t);
    }, [value, delayMs]);

    return debounced;
}
