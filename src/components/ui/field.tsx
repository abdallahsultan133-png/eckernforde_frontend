import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

import { Label } from "@/components/ui/label.tsx";
import { cn } from "@/lib/utils.ts";

type FieldProps = {
    label: ReactNode;
    /** Adds a "*" marker and wires `aria-required` onto the control. */
    required?: boolean;
    /** Helper text rendered under the control and linked via `aria-describedby`. */
    hint?: ReactNode;
    /**
     * Provide when the control's id is managed by hand (e.g. a Radix
     * `<SelectTrigger id=…>`). The label points at it and no id is injected.
     */
    htmlFor?: string;
    /** The form control. A single element gets `id` / `aria-*` injected automatically. */
    children: ReactNode;
    className?: string;
};

/**
 * Pairs a visible `<Label>` with a form control and guarantees the two are
 * programmatically associated — the thing a bare `<Label>X</Label><Input/>`
 * never did. Injects `id`, `aria-required` and `aria-describedby` into a
 * single-element child; for compound controls pass `htmlFor` and set the id
 * on the focusable node yourself.
 */
export function Field({ label, required, hint, htmlFor, children, className }: FieldProps) {
    const autoId = useId();
    const id = htmlFor ?? autoId;
    const hintId = hint ? `${id}-hint` : undefined;

    const control =
        !htmlFor && isValidElement(children)
            ? cloneElement(children as ReactElement<Record<string, unknown>>, {
                  id,
                  "aria-required": required || undefined,
                  "aria-describedby":
                      [hintId, (children.props as Record<string, unknown>)["aria-describedby"]]
                          .filter(Boolean)
                          .join(" ") || undefined,
              })
            : children;

    return (
        <div className={cn("space-y-2", className)}>
            <Label htmlFor={id}>
                {label}
                {required && (
                    <span aria-hidden="true" className="text-destructive">
                        *
                    </span>
                )}
            </Label>
            {control}
            {hint && (
                <p id={hintId} className="text-xs text-muted-foreground">
                    {hint}
                </p>
            )}
        </div>
    );
}
