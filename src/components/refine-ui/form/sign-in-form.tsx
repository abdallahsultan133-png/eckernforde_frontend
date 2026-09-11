"use client";

import { useState } from "react";
import { Eye, EyeOff, GraduationCap, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLink, useLogin } from "@refinedev/core";
import { GoogleSignInButton } from "./google-sign-in-button";
import { APP_NAME, BACKEND_BASE_URL } from "@/constants";

export const SignInForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const Link = useLink();
  const { mutate: login } = useLogin();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    login({ email, password }, { onSettled: () => setLoading(false) });
  };

  return (
    <div className="flex min-h-screen bg-[#f7f4ee] text-[#172b3a]">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#172b3a] p-12 text-white xl:p-16">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ba4a32]">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-serif text-2xl font-semibold tracking-tight">{APP_NAME}</span>
        </div>

        <div className="space-y-10">
          <h1 className="font-display text-4xl font-bold leading-tight">
            A secure place for<br />the school day.
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Personal academic information, teaching tools and family updates are available only to authorised members of the school community.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Students", desc: "Learning, attendance and notices" },
              { label: "Teachers", desc: "Classes, assessment and reports" },
              { label: "Parents", desc: "Linked-child information" },
              { label: "Administrators", desc: "Secure school operations" },
            ].map((f) => (
              <div key={f.label} className="border border-white/15 bg-white/5 p-4">
                <p className="font-semibold text-sm">{f.label}</p>
                <p className="text-xs text-primary-foreground/60 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/45">© {new Date().getFullYear()} {APP_NAME}. Secure school portal.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-[#f7f4ee]">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ba4a32] text-white shadow-sm">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-serif text-lg font-semibold tracking-tight">{APP_NAME}</span>
          </div>

          <div>
            <h2 className="font-serif text-4xl font-semibold tracking-tight">Portal sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">Use the school account issued to you.</p>
          </div>

          {!BACKEND_BASE_URL && <div role="alert" className="border border-amber-700/30 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">Portal connection is not configured.</p><p className="mt-1 leading-5">Set <code className="font-mono text-xs">VITE_BACKEND_BASE_URL</code> in the frontend environment, then restart the dev server.</p></div>}

          {BACKEND_BASE_URL && <GoogleSignInButton />}

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              or continue with email
            </span>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-11 w-full bg-[#172b3a] text-base hover:bg-[#ba4a32]" disabled={loading || !BACKEND_BASE_URL}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="flex gap-3 border-t border-[#172b3a]/15 pt-5 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#ba4a32]" aria-hidden="true" />
            <p>Need access? Contact the school office. Accounts and permissions are managed by the school.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

SignInForm.displayName = "SignInForm";
