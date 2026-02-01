import { NextRequest, NextResponse } from 'next/server';
import { sanitizeObject } from '@/lib/sanitize';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3030';

/**
 * Valid channel types
 */
const VALID_CHANNELS = ['telegram', 'discord', 'signal', 'email'] as const;
type Channel = (typeof VALID_CHANNELS)[number];

function isValidChannel(channel: string): channel is Channel {
  return VALID_CHANNELS.includes(channel as Channel);
}

type RouteContext = {
  params: Promise<{ channel: string }>;
};

/**
 * GET /api/messages/[channel]
 *
 * Get messages from a specific channel.
 *
 * Path parameters:
 * - channel: Channel name (telegram, discord, signal, email)
 *
 * Query parameters:
 * - threadId: Filter by thread ID
 * - limit: Maximum number of messages (default: 50, max: 100)
 * - before: Cursor for pagination
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { channel } = await context.params;

    // Validate channel
    if (!isValidChannel(channel)) {
      return NextResponse.json(
        {
          error: 'Invalid channel',
          message: `Channel must be one of: ${VALID_CHANNELS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Build query params for gateway
    const params = new URLSearchParams();
    params.set('channel', channel);

    const threadId = searchParams.get('threadId');
    if (threadId) {
      params.set('threadId', threadId);
    }

    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 100);
    params.set('limit', String(limit));

    const before = searchParams.get('before');
    if (before) {
      params.set('before', before);
    }

    const queryString = params.toString();
    const targetUrl = `${GATEWAY_URL}/messages?${queryString}`;

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

    // Sanitize message content
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
