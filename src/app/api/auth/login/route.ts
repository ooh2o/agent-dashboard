import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  validateToken,
  isAuthRequired,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
} from '@/lib/auth';

/**
 * Login request body
 */
interface LoginRequest {
  token: string;
}

/**
 * POST /api/auth/login
 *
 * Authenticate with a token and receive a session cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Check if auth is required
    if (!isAuthRequired()) {
      return NextResponse.json({
        success: true,
        message: 'Authentication not required',
        authRequired: false,
      });
    }

    // Parse request body
    const body = (await request.json()) as LoginRequest;

    if (!body.token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate the token
    if (!validateToken(body.token)) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Set the auth cookie
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, body.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}

/**
 * GET /api/auth/login
 *
 * Check current auth status
 */
export async function GET() {
  try {
    const authRequired = isAuthRequired();

    if (!authRequired) {
      return NextResponse.json({
        authenticated: true,
        authRequired: false,
      });
    }

    // Check if there's a valid auth cookie
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const authenticated = validateToken(token);

    return NextResponse.json({
      authenticated,
      authRequired: true,
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      authRequired: isAuthRequired(),
    });
  }
}

export const dynamic = 'force-dynamic';
