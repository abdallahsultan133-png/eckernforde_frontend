import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { scorePassword, type PasswordScore } from "@/lib/password-strength";

type Props = {
    password: string;
    /** Hide the whole meter until the user has typed something. */
    className?: string;
};

// Bar fill + text colour per score. Index 0 (empty) is never rendered.
const TONES: Record<PasswordScore, { bar: string; text: string }> = {
    0: { bar: "bg-muted", text: "text-muted-foreground" },
    1: { bar: "bg-red-500", text: "text-red-600 dark:text-red-400" },
    2: { bar: "bg-orange-500", text: "text-orange-600 dark:text-orange-400" },
    3: { bar: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-500" },
    4: { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
};

/**
 * Four-segment strength bar for a password field. Segments fill and change
 * colour as the score rises (1 red → 4 green); a label and the top "do this
 * next" hint sit beneath. Scoring lives in lib/password-strength.ts.
 */
export function PasswordStrengthMeter({ password, className }: Props) {
    const { score, label, suggestions } = useMemo(() => scorePassword(password), [password]);

    if (!password) return null;

    const tone = TONES[score];

    return (
        <div className={cn("space-y-1.5", className)} aria-live="polite">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((seg) => (
                    <span
                        key={seg}
                        className={cn(
                            "h-1.5 flex-1 rounded-full transition-colors",
                            seg <= score ? tone.bar : "bg-muted",
                        )}
                    />
                ))}
            </div>
            <div className="flex items-baseline justify-between gap-3">
                <span className={cn("text-xs font-medium", tone.text)}>{label} password</span>
                {suggestions[0] && score < 4 && (
                    <span className="text-xs text-muted-foreground">{suggestions[0]}</span>
                )}
            </div>
        </div>
    );
}
