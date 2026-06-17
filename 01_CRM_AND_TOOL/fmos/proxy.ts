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
