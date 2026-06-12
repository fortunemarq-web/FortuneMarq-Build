import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
  '/client/report/',
  '/api/',
  '/_next',
]

// Areas any signed-in staff member may use regardless of role
const SHARED_AREAS = ['/tasks', '/projects', '/attendance', '/staff', '/sales']

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

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Deny by default: every non-public route requires a session.
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const allowedBase = role ? ROLE_ROUTES[role] : null

  // Admin can access everything
  if (role === 'admin') return response

  // /admin is admin-only — send everyone else to their own dashboard
  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL(allowedBase ?? '/', request.url))
  }

  // Keep users out of other roles' home areas, except shared ones
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
