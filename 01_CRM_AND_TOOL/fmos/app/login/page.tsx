"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Loader2, Lock, Mail, AlertCircle } from "lucide-react";
import FortuneMarqLogo from "@/components/ui/fortune-marq-logo";
import { logAudit } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Get user role and redirect to appropriate dashboard
  const redirectBasedOnRole = useCallback(async (userId: string) => {
    try {
      // First, try to get role from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      let role = (profile as any)?.role;

      // If no role found in profiles, check if user is a client
      if (!role) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: client } = await supabase
            .from("clients")
            .select("id")
            .eq("primary_email", user.email)
            .single();

          if (client) {
            role = "client";
          }
        }
      }

      // Default to staff if no role found
      if (!role) {
        role = "staff";
      }

      const roleRoutes: Record<string, string> = {
        admin: "/admin",
        telecaller: "/sales",
        strategist: "/strategist",
        pm: "/projects",
        staff: "/staff",
        client: "/client/dashboard",
      };

      const redirectPath = roleRoutes[role] || "/staff";
      // Honor the ?next deep-link the auth gate (proxy.ts) sets, if it's a safe
      // internal path — otherwise fall back to the role's home.
      const next = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next") : null;
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safeNext || redirectPath);
    } catch (err) {
      console.error("Role fetch error:", err);
      router.push("/staff");
    }
  }, [supabase, router]);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // User is already logged in, redirect based on role
          await redirectBasedOnRole(user.id);
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [supabase, redirectBasedOnRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        await logAudit({
          action: 'login',
          resourceType: 'profile',
          resourceId: data.user.id,
          resourceLabel: `User login: ${email}`
        });
        await redirectBasedOnRole(data.user.id);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking auth
  if (isCheckingAuth) {
    return (
      <div className="fmos-dark flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="fmos-dark relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Muted green glows for depth behind the glass card. */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand/20 blur-[110px]" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[36%] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-brand-deep/25 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand/14 blur-[110px]" />
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo & Branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <FortuneMarqLogo size="lg" showText={false} logoPath="/Logo.png" />
          <h1 className="mt-5 font-display text-xl font-semibold tracking-tight text-white">
            Sign in to FortuneMarq
          </h1>
          <p className="mt-1.5 text-sm text-white/60">
            Enter your work email to access your workspace
          </p>
        </div>

        <Card className="border-white/10 bg-white/[0.06] p-6 shadow-[0_28px_80px_-24px_rgba(0,0,0,0.75)] ring-1 ring-white/10 backdrop-blur-2xl sm:p-8">
          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-danger-line bg-danger-soft px-3.5 py-2.5"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <Label htmlFor="email" className="text-white/90">Email address</Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/90">Password</Label>
                <Link href="/forgot-password" className="text-xs font-medium text-brand hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="mt-2 h-11 w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </Card>

        {/* Bottom text */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} FortuneMarq · Internal workspace
        </p>
      </div>
    </div>
  );
}
