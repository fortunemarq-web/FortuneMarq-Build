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

const PROTECTED_ROUTES = ['/admin', '/sales', '/strategist', '/projects', '/staff', '/client']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
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

  // Not logged in — redirect to login
  if (!user) {
    const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    if (isProtected) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // Get user role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const allowedBase = role ? ROLE_ROUTES[role] : null

  // Admin can access everything
  if (role === 'admin') return response

  // Redirect to correct dashboard if accessing wrong route
  if (allowedBase && !pathname.startsWith(allowedBase)) {
    const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    if (isProtected) {
      return NextResponse.redirect(new URL(allowedBase, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
