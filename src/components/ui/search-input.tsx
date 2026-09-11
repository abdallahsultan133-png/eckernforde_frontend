import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
    value: string;
    onChange: (value: string) => void;
    containerClassName?: string;
    /** Shows a spinner in place of the search icon — e.g. while a debounced query is in flight. */
    loading?: boolean;
    /**
     * Global key that focuses this field from anywhere on the page (like
     * GitHub/Linear's "/" search shortcut), shown as a hint badge when idle.
     * Ignored while focus is already inside an editable element. Pass `null`
     * to disable.
     */
    shortcut?: string | null;
}

/**
 * Pill-shaped search field used across list pages (classes, subjects, users).
 * A plain bordered <Input> reads as an afterthought at the top of a list; this
 * gives search its own visual weight — icon that highlights on focus, a clear
 * button once there's a query, a loading state for debounced/async filtering,
 * and a "/" shortcut so power users don't need to reach for the mouse.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ value, onChange, className, containerClassName, placeholder = "Search...", loading = false, shortcut = "/", onFocus, onBlur, ...props }, ref) => {
        const localRef = React.useRef<HTMLInputElement>(null);
        const [focused, setFocused] = React.useState(false);

        const setRefs = React.useCallback((node: HTMLInputElement | null) => {
            localRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }, [ref]);

        React.useEffect(() => {
            if (!shortcut) return;
            const handler = (e: KeyboardEvent) => {
                if (e.key !== shortcut || e.metaKey || e.ctrlKey || e.altKey) return;
                const active = document.activeElement as HTMLElement | null;
                const isEditable = !!active && (
                    active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable
                );
                if (isEditable) return;
                e.preventDefault();
                localRef.current?.focus();
            };
            window.addEventListener("keydown", handler);
            return () => window.removeEventListener("keydown", handler);
        }, [shortcut]);

        return (
            <div
                className={cn(
                    "group relative flex h-9 w-full items-center rounded-full border border-input bg-background/60 shadow-xs transition-all focus-within:border-ring focus-within:bg-background focus-within:shadow-sm focus-within:ring-[3px] focus-within:ring-ring/50",
                    containerClassName
                )}
            >
                <span className="pointer-events-none absolute left-3.5 flex h-4 w-4 shrink-0 items-center justify-center">
                    <AnimatePresence mode="wait" initial={false}>
                        {loading ? (
                            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </motion.span>
                        ) : (
                            <motion.span key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                <Search className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                            </motion.span>
                        )}
                    </AnimatePresence>
                </span>
                <input
                    ref={setRefs}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={(e) => { setFocused(true); onFocus?.(e); }}
                    onBlur={(e) => { setFocused(false); onBlur?.(e); }}
                    placeholder={placeholder}
                    className={cn(
                        "h-full w-full rounded-full bg-transparent pl-10 pr-8 text-sm text-foreground outline-none placeholder:text-muted-foreground",
                        className
                    )}
                    {...props}
                />
                <AnimatePresence mode="wait" initial={false}>
                    {value ? (
                        <motion.button
                            key="clear"
                            type="button"
                            onClick={() => onChange("")}
                            aria-label="Clear search"
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </motion.button>
                    ) : shortcut && !focused ? (
                        <motion.kbd
                            key="shortcut"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            aria-hidden="true"
                            className="pointer-events-none absolute right-2.5 hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block"
                        >
                            {shortcut}
                        </motion.kbd>
                    ) : null}
                </AnimatePresence>
            </div>
        );
    }
);

SearchInput.displayName = "SearchInput";
