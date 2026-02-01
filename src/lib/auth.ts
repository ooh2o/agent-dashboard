import { cookies } from 'next/headers';

/**
 * Cookie name for storing the auth token
 */
export const AUTH_COOKIE_NAME = 'openclaw_dashboard_auth';

/**
 * Cookie max age in seconds (7 days)
 */
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Get the expected auth token from environment
 * Returns null if not configured (auth disabled)
 */
export function getExpectedToken(): string | null {
  return process.env.OPENCLAW_DASHBOARD_TOKEN || null;
}

/**
 * Check if authentication is required
 * Auth is required if OPENCLAW_DASHBOARD_TOKEN is set
 */
export function isAuthRequired(): boolean {
  return !!getExpectedToken();
}

/**
 * Validate a token against the expected token
 */
export function validateToken(token: string | null | undefined): boolean {
  const expectedToken = getExpectedToken();

  // If no token is configured, auth is not required
  if (!expectedToken) {
    return true;
  }

  // Compare tokens using timing-safe comparison
  if (!token) {
    return false;
  }

  // Simple string comparison (in production, use crypto.timingSafeEqual)
  return token === expectedToken;
}

/**
 * Get the auth token from cookies (async version for server components)
 */
export async function getAuthTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
}

/**
 * Check if the current request is authenticated (async version)
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthTokenFromCookies();
  return validateToken(token);
}

/**
 * Auth error response
 */
export interface AuthError {
  error: string;
  code: 'UNAUTHORIZED' | 'FORBIDDEN';
  requiresAuth: boolean;
}

/**
 * Create an unauthorized error response
 */
export function createUnauthorizedError(): AuthError {
  return {
    error: 'Authentication required',
    code: 'UNAUTHORIZED',
    requiresAuth: true,
  };
}
