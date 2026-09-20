import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useUpdatePassword } from "@refinedev/core";
import { ArrowLeft, Eye, EyeOff, GraduationCap, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthMeter } from "@/components/password-strength-meter.tsx";
import { APP_NAME } from "@/constants";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const linkError = params.get("error");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const { mutate: updatePassword, isPending } = useUpdatePassword();
  const invalidLink = !token || !!linkError;
  const handleSubmit = (event: React.FormEvent) => { event.preventDefault(); updatePassword({ password, confirmPassword, token }); };

  return <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12"><div className="w-full max-w-md space-y-8">
    <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><GraduationCap className="h-4 w-4" /></div><span className="font-serif text-lg font-semibold tracking-tight">{APP_NAME}</span></div>
    {invalidLink ? <div className="space-y-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"><TriangleAlert className="h-6 w-6" /></div><div><h2 className="font-display text-2xl font-bold tracking-tight">This link isn't valid</h2><p className="mt-2 text-sm text-muted-foreground">Password reset links expire after 1 hour and can only be used once. Request a fresh one and try again.</p></div><Button asChild className="h-11 w-full"><Link to="/forgot-password">Request a new link</Link></Button><Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link></div> : <>
      <div><h2 className="font-display text-3xl font-bold tracking-tight">Choose a new password</h2><p className="mt-2 text-sm text-muted-foreground">Pick something at least 8 characters long. You'll use it to sign in next time.</p></div>
      <form onSubmit={handleSubmit} className="space-y-5"><div className="space-y-2"><Label htmlFor="password">New password</Label><div className="relative"><Input id="password" type={show ? "text" : "password"} autoComplete="new-password" placeholder="********" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} className="h-11 pr-10" /><button type="button" onClick={() => setShow((value) => !value)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><PasswordStrengthMeter password={password} /></div>
        <div className="space-y-2"><Label htmlFor="confirm">Confirm new password</Label><Input id="confirm" type={show ? "text" : "password"} autoComplete="new-password" placeholder="********" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} className="h-11" />{confirmPassword && confirmPassword !== password && <p className="text-xs text-red-600 dark:text-red-400">Passwords don't match yet.</p>}</div>
        <Button type="submit" className="h-11 w-full text-base" disabled={isPending || password.length < 8 || password !== confirmPassword}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isPending ? "Updating..." : "Update password"}</Button>
      </form><Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
    </>}
  </div></div>;
};

export default ResetPassword;
