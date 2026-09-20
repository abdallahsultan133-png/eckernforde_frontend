"use client";
import { useState } from "react";
import { Link } from "react-router";
import { Loader2, LogIn } from "lucide-react";
import { useLink, useLogin } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "./google-sign-in-button";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordField } from "@/components/auth/password-field";
import "@/components/auth/auth.css";
import { BACKEND_BASE_URL } from "@/constants";

export const SignInForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const LinkFromRefine = useLink();
  const { mutate: login } = useLogin();
  const handleSignIn = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    login({ email: email.trim(), password }, { onSettled: () => setLoading(false) });
  };

  return <AuthLayout signInWelcome>
    {!BACKEND_BASE_URL && <div className="auth-alert" role="alert"><strong>Portal connection is not configured.</strong><br />Set <code>VITE_BACKEND_BASE_URL</code> in the frontend environment, then restart the app.</div>}
    <form onSubmit={handleSignIn} className="auth-form">
      <div className="auth-field">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
      <PasswordField id="password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
      <div className="auth-form-row">
        <span className="auth-field-hint">Your school account is protected.</span>
        <LinkFromRefine to="/forgot-password" className="auth-inline-link">Forgot password?</LinkFromRefine></div>
      <Button type="submit" className="auth-submit" disabled={loading || !BACKEND_BASE_URL}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />}{loading ? "Signing in..." : "Sign in"}</Button>
    </form>
    {BACKEND_BASE_URL && <div className="mt-3 flex justify-center"><GoogleSignInButton asLink /></div>}
    <p className="auth-switch">Don't have an account? <Link to="/register">Create an account</Link></p>
  </AuthLayout>;
};
SignInForm.displayName = "SignInForm";
