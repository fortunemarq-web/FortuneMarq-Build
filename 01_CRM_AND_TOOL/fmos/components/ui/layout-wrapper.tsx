"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "./app-sidebar";
import TopBar from "./top-bar";

// Routes that should NOT show the sidebar (public / standalone routes).
// Keep in sync with PUBLIC_PREFIXES in proxy.ts (which enforces auth —
// this list only controls chrome).
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/lp",
  "/client/report",
];

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Check if current route is a public route or the root redirect page
  const isPublicRoute =
    pathname === "/" ||
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));

  // For public routes, render children only (full screen)
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, render with sidebar.
  // The shell is locked to the viewport; <main> is the only scroll
  // container, so the sidebar never scrolls away and pages can't
  // overscroll into blank space.
  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 print:block print:h-auto print:overflow-visible">
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <AppSidebar />

      {/* Main Content Area: top bar + scrollable main */}
      <div className="flex flex-1 min-w-0 flex-col print:block">
        {/* Desktop top bar: breadcrumbs + global search + notifications */}
        <TopBar />
        <main className="flex-1 w-full min-w-0 overflow-y-auto pt-14 md:pt-0 print:overflow-visible print:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
