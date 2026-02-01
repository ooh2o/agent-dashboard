import { NextRequest, NextResponse } from 'next/server';
import { sanitizeObject } from '@/lib/sanitize';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3030';

/**
 * GET /api/messages
 *
 * List messages across all channels with optional filtering.
 *
 * Query parameters:
 * - channel: Filter by specific channel (telegram, discord, signal, email)
 * - threadId: Filter by thread ID
 * - limit: Maximum number of messages to return (default: 50, max: 100)
 * - before: Cursor for pagination (message ID to fetch before)
 * - search: Search query to filter messages by content
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build query params for gateway
    const params = new URLSearchParams();

    const channel = searchParams.get('channel');
    if (channel) {
      params.set('channel', channel);
    }

    const threadId = searchParams.get('threadId');
    if (threadId) {
      params.set('threadId', threadId);
    }

    // Limit with bounds checking
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 100);
    params.set('limit', String(limit));

    const before = searchParams.get('before');
    if (before) {
      params.set('before', before);
    }

    const search = searchParams.get('search');
    if (search) {
      params.set('search', search);
    }

    const queryString = params.toString();
    const targetUrl = `${GATEWAY_URL}/messages${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Sanitize message content to prevent XSS
    const sanitizedData = sanitizeObject(data);

    return NextResponse.json(sanitizedData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError =
      message.includes('ECONNREFUSED') ||
      message.includes('fetch failed') ||
      message.includes('network');

    return NextResponse.json(
      {
        error: isConnectionError
          ? 'Unable to connect to gateway'
          : 'Failed to fetch messages',
        message,
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
