import { useState } from "react";
import { Link } from "react-router";
import { useForgotPassword } from "@refinedev/core";
import { ArrowLeft, GraduationCap, Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/constants";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword(
      { email },
      { onSuccess: (data) => data?.success && setSent(true) },
    );
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="font-serif text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <MailCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">Check your email</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a
                link to reset your password. It expires in 1 hour.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Didn't get it? Check spam, or{" "}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                try a different address
              </button>
              .
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">Forgot password?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the email on your account and we'll send you a link to reset it.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <Button type="submit" className="h-11 w-full text-base" disabled={isPending || !email}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Sending…" : "Send reset link"}
              </Button>
            </form>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
