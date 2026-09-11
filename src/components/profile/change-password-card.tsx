import { useState } from "react";
import { useLogout } from "@refinedev/core";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { PasswordStrengthMeter } from "@/components/password-strength-meter.tsx";
import { BACKEND_BASE_URL } from "@/constants";

/**
 * Self-service password change. The user proves ownership with their current
 * password (Better Auth's /auth/change-password verifies it against the stored
 * hash), sets a new one, and is then signed out so the next login uses the new
 * password. `revokeOtherSessions: true` also kills any other active sessions.
 */
export function ChangePasswordCard() {
  const { mutate: logout } = useLogout();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== next;
  const sameAsOld = next.length > 0 && next === current;
  const canSubmit =
    !!current && next.length >= 8 && next === confirm && !sameAsOld && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: next,
          revokeOtherSessions: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as Record<string, unknown>));
        const code = (data as { code?: string }).code;
        const message =
          code === "INVALID_PASSWORD"
            ? "Your current password is incorrect."
            : ((data as { message?: string }).message ??
              "Couldn't change your password. Please try again.");
        throw new Error(message);
      }

      toast.success("Password changed", {
        description: "Sign in again with your new password.",
      });
      // End this session too — the new password only becomes "current" on the
      // next sign-in.
      logout({ redirectPath: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't change your password.");
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Change password
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide passwords" : "Show passwords"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
            />
            <PasswordStrengthMeter password={next} className="pt-0.5" />
            {sameAsOld && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Pick a password different from your current one.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
            {mismatch && (
              <p className="text-xs text-red-600 dark:text-red-400">Passwords don&apos;t match yet.</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Changing your password signs you out on every device. You&apos;ll sign back in with the
            new one.
          </p>

          <Button type="submit" disabled={!canSubmit}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
