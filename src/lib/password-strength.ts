/**
 * Heuristic password-strength score, shared by every "choose a new password"
 * screen (profile change-password, reset-password).
 *
 * Rules, in plain terms:
 *   • Under 8 characters is always "Weak", no matter how varied.
 *   • Past 8, the score climbs with character variety (lower / upper / digit /
 *     symbol) and with length (bonus at 12, another at 16).
 *   • "Strong" is reserved for genuinely long *and* varied passwords —
 *     16+ characters using all four character classes.
 */

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export type PasswordStrength = {
    /** 0 = empty field, 1 = weak, 2 = fair, 3 = good, 4 = strong. */
    score: PasswordScore;
    /** "" when empty, otherwise "Weak" | "Fair" | "Good" | "Strong". */
    label: string;
    /** Whether it clears the app's hard minimum (8 characters). */
    meetsMinimum: boolean;
    /** Up to three short, ordered "do this next" hints. */
    suggestions: string[];
};

const LABELS = ["", "Weak", "Fair", "Good", "Strong"] as const;

export function scorePassword(password: string): PasswordStrength {
    if (!password) {
        return { score: 0, label: "", meetsMinimum: false, suggestions: [] };
    }

    const len = password.length;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const classes = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

    const suggestions: string[] = [];
    if (len < 8) suggestions.push("Use at least 8 characters");
    else if (len < 16) suggestions.push("Longer is stronger — aim for 16+");
    if (!hasLower || !hasUpper) suggestions.push("Mix upper and lower case");
    if (!hasDigit) suggestions.push("Add a number");
    if (!hasSymbol) suggestions.push("Add a symbol (! ? # …)");

    const meetsMinimum = len >= 8;

    // Below the hard minimum it's Weak, full stop — however varied.
    if (!meetsMinimum) {
        return { score: 1, label: "Weak", meetsMinimum, suggestions: suggestions.slice(0, 3) };
    }

    // Length sets the ceiling; character variety decides whether it's reached.
    const varied = classes >= 3;
    let score: PasswordScore;
    if (len < 12) score = varied ? 2 : 1; //  8–11 chars: at best "Fair"
    else if (len < 16) score = varied ? 3 : 2; // 12–15 chars: at best "Good"
    else score = varied ? 4 : 3; //             16+   chars: "Strong" possible

    // "Strong" is reserved for the full mix (lower + upper + digit + symbol).
    if (score === 4 && classes < 4) score = 3;

    return { score, label: LABELS[score], meetsMinimum, suggestions: suggestions.slice(0, 3) };
}
