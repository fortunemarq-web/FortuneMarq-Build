"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2, Lock, Mail, AlertCircle } from "lucide-react";
import clsx from "clsx";
import FortuneMarqLogo from "@/components/ui/fortune-marq-logo";
import { logAudit } from "@/lib/audit";

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
      router.push(redirectPath);
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <FortuneMarqLogo size="lg" showText={false} />
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
            Sign in to FortuneMarq
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter your work email to access your workspace
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-ring"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-ring"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={clsx(
                "mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-colors",
                isLoading
                  ? "cursor-not-allowed bg-brand-deep/60"
                  : "bg-brand-deep hover:bg-brand-active active:bg-brand-deep"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Bottom text */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} FortuneMarq · Internal workspace
        </p>
      </div>
    </div>
  );
}
