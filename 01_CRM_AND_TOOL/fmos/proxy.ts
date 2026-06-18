import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * FMOS auth gate (Next 16 proxy). FAIL-OPEN by design.
 *
 * Goal: stop UNAUTHENTICATED visitors from reading app pages, without ever
 * locking out a legitimate user. Every Supabase read here is guarded so that
 * an error (RLS policy change, missing profile row, transient DB issue, missing
 * env) ALLOWS the request through instead of blocking it. We redirect ONLY on a
 * confirmed no-session, or a positively-known wrong role.
 *
 * This is the fix for the earlier lockouts: the previous version used an
 * unguarded getUser() + `.single()` on profiles, so any SQL/RLS change that
 * broke that read took down the whole gate. It no longer can.
 */

/**
 * HOST-SPLIT (marketing site ⟷ FMOS app).
 *
 * The marketing site lives under app/site/* but must serve at CLEAN root paths
 * on the marketing domain (fortunemarq.com/, /about, /services, /work, /contact,
 * /privacy-policy, /terms-of-service). The FMOS app stays on its own host
 * (fmos.fortunemarq.com) and everywhere else.
 *
 * On a marketing host we rewrite every clean path → the internal /site/* page,
 * and seal off the app (any non-marketing path → /site/<path> → site 404). Infra
 * routes (_next, api, robots/sitemap/favicon, static files) pass through.
 *
 * Local/mobile preview: set MARKETING_PREVIEW_LOCAL=1 so localhost is treated as
 * the marketing host (lets you see the clean URLs in a browser). Off by default,
 * so normal local FMOS dev is unaffected.
 */
const MARKETING_HOSTS = new Set(
  (process.env.MARKETING_HOSTS || "fortunemarq.com,www.fortunemarq.com")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
)

function hostnameOf(request: NextRequest): string {
  return (request.headers.get("host") || "").split(":")[0].toLowerCase()
}

function isMarketingHost(request: NextRequest): boolean {
  if (process.env.MARKETING_PREVIEW_LOCAL === "1") return true
  return MARKETING_HOSTS.has(hostnameOf(request))
}

/** Infra paths that must never be host-rewritten. */
function isInfraPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname) // any file with an extension (assets)
  )
}

const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin',
  telecaller: '/sales',
  strategist: '/strategist',
  pm: '/projects',
  staff: '/staff',
  client: '/client/dashboard',
}

// Routes that must work without a session.
// - /lp/*            public landing pages (lead capture)
// - /client/report/* magic-link client reports (token-validated server-side)
// - /api/*           route handlers enforce their own auth (cookies or CRON_SECRET)
const PUBLIC_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/lp/',
  '/site/',
  '/p/',
  '/a/',
  '/inv/',
  '/client/report/',
  '/api/',
  '/_next',
]

// Areas any signed-in staff member may use regardless of role.
// NOTE: /sales and /staff are role HOMES (see ROLE_ROUTES), NOT shared — they were
// previously listed here, which let any signed-in role into them. Removed so the
// owning role (+ admin) is the only one that can enter:
//   /sales  → telecaller + admin
//   /staff  → staff + admin
const SHARED_AREAS = ['/tasks', '/projects', '/attendance']

function isPublic(pathname: string): boolean {
  if (pathname === '/') return true // root page handles its own auth redirect
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix.replace(/\/$/, '') || pathname.startsWith(prefix)
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Host-split: marketing host serves the /site/* pages at clean root paths ──
  if (isMarketingHost(request)) {
    if (isInfraPath(pathname)) return NextResponse.next()
    // Already an internal /site path (or someone hit it directly) — serve as-is.
    if (pathname === "/site" || pathname.startsWith("/site/")) return NextResponse.next()
    const url = request.nextUrl.clone()
    url.pathname = pathname === "/" ? "/site" : `/site${pathname}`
    return NextResponse.rewrite(url)
  }

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Misconfiguration must never lock anyone out.
  if (!url || !anon) return NextResponse.next()

  const response = NextResponse.next()

  let supabase
  try {
    supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })
  } catch {
    return response // fail-open
  }

  // ── Auth gate ──────────────────────────────────────────────
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) return response // fail-open on verify/transient errors
    user = data.user
  } catch {
    return response // fail-open
  }

  // Confirmed: no session. Deny by default for non-public routes.
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Best-effort role routing (fully fail-open) ─────────────
  // Only act on a positively-known role. Unknown role → allow through.
  let role: string | undefined
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (error) return response // RLS/permission/transient → allow, never lock out
    role = (profile as { role?: string } | null)?.role
  } catch {
    return response // fail-open
  }

  // Unknown role (no row yet, RLS block) → allow through. No lockout.
  if (!role) return response

  // Admin can access everything.
  if (role === 'admin') return response

  const allowedBase = ROLE_ROUTES[role] ?? null

  // /admin is admin-only — send other (known) roles to their own dashboard.
  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL(allowedBase ?? '/', request.url))
  }

  // Keep users out of other roles' home areas, except shared ones.
  if (allowedBase) {
    const foreignBases = Object.values(ROLE_ROUTES).filter(
      (base) => base !== '/admin' && base !== allowedBase
    )
    const inForeignArea = foreignBases.some((base) => pathname.startsWith(base))
    const inSharedArea = SHARED_AREAS.some((area) => pathname.startsWith(area))
    if (inForeignArea && !inSharedArea) {
      return NextResponse.redirect(new URL(allowedBase, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
