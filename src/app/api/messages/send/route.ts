import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  rateLimits,
  getClientIdentifier,
} from '@/lib/rate-limiter';
import { sanitizeMessageContent } from '@/lib/sanitize';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4280';

/**
 * Valid channel types
 */
const VALID_CHANNELS = ['telegram', 'discord', 'signal', 'email'] as const;
type Channel = (typeof VALID_CHANNELS)[number];

function isValidChannel(channel: string): channel is Channel {
  return VALID_CHANNELS.includes(channel as Channel);
}

/**
 * Send message request body
 */
interface SendMessageRequest {
  channel: Channel;
  content: string;
  threadId?: string;
}

/**
 * Maximum message content length
 */
const MAX_CONTENT_LENGTH = 4000;

/**
 * POST /api/messages/send
 *
 * Send a message to a channel.
 *
 * Request body:
 * - channel: Target channel (telegram, discord, signal, email)
 * - content: Message content (max 4000 characters)
 * - threadId: Optional thread ID for replies
 *
 * Rate limited: 10 messages per minute per client
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `message-send:${clientId}`,
      rateLimits.messageSend
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many messages. Please wait ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetAt),
          },
        }
      );
    }

    // Parse and validate request body
    const body = (await request.json()) as SendMessageRequest;

    if (!body.channel) {
      return NextResponse.json(
        { error: 'Missing required field: channel' },
        { status: 400 }
      );
    }

    if (!isValidChannel(body.channel)) {
      return NextResponse.json(
        {
          error: 'Invalid channel',
          message: `Channel must be one of: ${VALID_CHANNELS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!body.content?.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: content' },
        { status: 400 }
      );
    }

    if (body.content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        {
          error: 'Content too long',
          message: `Message content must be ${MAX_CONTENT_LENGTH} characters or less`,
        },
        { status: 400 }
      );
    }

    // Sanitize content before sending
    const sanitizedContent = sanitizeMessageContent(body.content.trim());

    // Build gateway request
    const gatewayPayload = {
      channel: body.channel,
      content: sanitizedContent,
      ...(body.threadId && { threadId: body.threadId }),
    };

    // Send to gateway
    const response = await fetch(`${GATEWAY_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(gatewayPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to send message', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(
      {
        success: true,
        ...data,
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.resetAt),
        },
      }
    );
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
          : 'Failed to send message',
        message,
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
