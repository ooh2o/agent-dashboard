import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * POST /api/auth/logout
 *
 * Log out by clearing the auth cookie
 */
export async function POST() {
  try {
    const cookieStore = await cookies();

    // Clear the auth cookie by setting it to expire immediately
    cookieStore.set(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
