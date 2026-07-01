"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [status, setStatus] = useState("Initializing...");
  const router = useRouter();

  let supabase;
  try {
    supabase = createClient();
  } catch (error: any) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas text-slate-900">
        <div className="max-w-md rounded-xl border border-danger-line bg-danger-soft p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-danger">Configuration Error</h2>
          <p className="text-sm text-slate-600">{error.message}</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        setStatus("Checking authentication...");

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Not logged in, redirect to login
          setStatus("Redirecting to login...");
          router.replace("/login");
          return;
        }

        // User is logged in, get their role
        setStatus("Loading your dashboard...");

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        let role = (profile as any)?.role;

        // If no role found in profiles, check if user is a client
        if (!role && user.email) {
          const { data: client } = await supabase
            .from("clients")
            .select("id")
            .eq("primary_email", user.email)
            .single();

          if (client) {
            role = "client";
          }
        }

        // Default to staff if no role found
        if (!role) {
          role = "staff";
        }

        // Role-based redirect
        const roleRoutes: Record<string, string> = {
          admin: "/admin",
          telecaller: "/sales",
          strategist: "/strategist",
          pm: "/projects",
          staff: "/staff",
          client: "/client/dashboard",
        };

        const redirectPath = roleRoutes[role] || "/staff";
        router.replace(redirectPath);
      } catch (error) {
        console.error("Auth check error:", error);
        // On error, redirect to login
        router.replace("/login");
      }
    };

    checkAuthAndRedirect();
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas">
      {/* Loading Content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center">
          <img
            src="/logo-icon-dark.png"
            alt="FortuneMarq"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-brand-deep" />
          <p className="text-sm text-slate-600">{status}</p>
        </div>
      </div>
    </div>
  );
}
