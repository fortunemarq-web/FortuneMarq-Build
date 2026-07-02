"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import FortuneMarqLogo from "@/components/ui/fortune-marq-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <FortuneMarqLogo size="lg" showText={false} />
          <h1 className="mt-5 font-display text-xl font-semibold tracking-tight text-slate-900">
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter your work email and we&rsquo;ll send you a reset link.
          </p>
        </div>

        <Card className="p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-brand-deep" />
              <p className="text-sm text-slate-700">
                If an account exists for <span className="font-semibold">{email}</span>, a reset link
                is on its way. Check your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-danger-line bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                  {error}
                </div>
              )}
              <div>
                <Label htmlFor="email">Email address</Label>
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
                    className="h-11 pl-10"
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" size="lg" disabled={loading} className="mt-2 h-11 w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          )}
        </Card>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
