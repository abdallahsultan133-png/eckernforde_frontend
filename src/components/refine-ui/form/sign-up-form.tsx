"use client";
import { useState } from "react";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useLink, useNotification, useRegister } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordField } from "@/components/auth/password-field";
import "@/components/auth/auth.css";
import { BACKEND_BASE_URL } from "@/constants";
import { friendlyAuthError } from "@/lib/auth-messages";

export const SignUpForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const LinkFromRefine = useLink();
  const { open } = useNotification();
  const { mutate: register } = useRegister();
  const handleSignUp = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match. Check both password fields and try again."); return; }
    if (password.length < 8) { setError("Use a password with at least 8 characters."); return; }
    setLoading(true);
    register({ name: `${firstName.trim()} ${lastName.trim()}`.trim(), email: email.trim(), password }, {
      onError: (registrationError) => {
        const message = friendlyAuthError(registrationError, "We could not create the account. Please check your details and try again.");
        setError(message);
        open?.({ type: "error", message: "Registration could not be completed", description: message });
      },
      onSettled: () => setLoading(false),
    });
  };

  return <AuthLayout title="Create your account" description="Join the school portal.">
    {!BACKEND_BASE_URL && <div className="auth-alert" role="alert"><strong>Portal connection is not configured.</strong><br />Set <code>VITE_BACKEND_BASE_URL</code> in the frontend environment, then restart the app.</div>}
    {error && <div className="auth-form-error" role="alert">{error}</div>}
    <form onSubmit={handleSignUp} className="auth-form">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="auth-field"><Label htmlFor="firstName">First name</Label><Input id="firstName" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></div><div className="auth-field"><Label htmlFor="lastName">Last name</Label><Input id="lastName" autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required /></div></div>
      <div className="auth-field"><Label htmlFor="register-email">Email address</Label><Input id="register-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
      <PasswordField id="register-password" label="Password" value={password} onChange={setPassword} autoComplete="new-password" hint="Use at least 8 characters." />
      <PasswordField id="confirm-password" label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" error={confirmPassword && confirmPassword !== password ? "Passwords do not match yet." : undefined} />
      <Button type="submit" className="auth-submit" disabled={loading || !BACKEND_BASE_URL}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />}{loading ? "Creating account..." : "Create account"}</Button>
    </form>
    <p className="auth-switch">Already have an account? <LinkFromRefine to="/login" className="auth-inline-link">Sign in</LinkFromRefine></p>
    <p className="auth-security"><ShieldCheck aria-hidden="true" /> New accounts start with student access. School administrators manage role changes and permissions.</p>
  </AuthLayout>;
};
SignUpForm.displayName = "SignUpForm";
