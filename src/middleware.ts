import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * API routes that don't require authentication
 */
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
];

/**
 * Public page routes that don't require authentication
 */
const PUBLIC_PAGE_ROUTES = [
  '/login',
];

/**
 * Middleware to protect API routes with token-based authentication
 *
 * When OPENCLAW_DASHBOARD_TOKEN is set in environment:
 * - API routes require a valid auth cookie
 * - Page routes redirect to /login if not authenticated
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the expected token from environment
  const expectedToken = process.env.OPENCLAW_DASHBOARD_TOKEN;

  // If no token is configured, skip auth check
  if (!expectedToken) {
    return NextResponse.next();
  }

  // Check if this is a public route
  if (
    PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route)) ||
    PUBLIC_PAGE_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // Get the auth token from cookie
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Check if authenticated
  const isAuthenticated = authToken === expectedToken;

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          requiresAuth: true,
        },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Handle page routes - redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Configure which routes the middleware runs on
 */
export const config = {
  matcher: [
    // Match API routes (except static files)
    '/api/:path*',
    // Match page routes (except static files and _next)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
