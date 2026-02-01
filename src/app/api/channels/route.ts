import { NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3030';

/**
 * Channel configuration
 */
interface ChannelInfo {
  id: string;
  name: string;
  connected: boolean;
  icon: string;
  color: string;
  bgColor: string;
  lastActivity?: string;
  unreadCount?: number;
}

/**
 * Default channel configurations
 * Used when gateway doesn't provide status info
 */
const DEFAULT_CHANNELS: ChannelInfo[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    connected: false,
    icon: 'MessageCircle',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'discord',
    name: 'Discord',
    connected: false,
    icon: 'Hash',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
  },
  {
    id: 'signal',
    name: 'Signal',
    connected: false,
    icon: 'Lock',
    color: 'text-blue-300',
    bgColor: 'bg-blue-400/10',
  },
  {
    id: 'email',
    name: 'Email',
    connected: false,
    icon: 'Mail',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
];

/**
 * GET /api/channels
 *
 * List available channels and their connection status.
 *
 * Returns:
 * - channels: Array of channel info including connection status
 */
export async function GET() {
  try {
    // Try to get channel status from gateway
    const response = await fetch(`${GATEWAY_URL}/channels`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();

      // Merge gateway data with default config
      const channels = DEFAULT_CHANNELS.map((defaultChannel) => {
        const gatewayChannel = data.channels?.find(
          (c: { id: string }) => c.id === defaultChannel.id
        );

        if (gatewayChannel) {
          return {
            ...defaultChannel,
            connected: gatewayChannel.connected ?? false,
            lastActivity: gatewayChannel.lastActivity,
            unreadCount: gatewayChannel.unreadCount ?? 0,
          };
        }

        return defaultChannel;
      });

      return NextResponse.json({ channels });
    }

    // Gateway doesn't support /channels endpoint - return defaults
    // Try to infer connection status from message activity
    const messagesResponse = await fetch(`${GATEWAY_URL}/messages?limit=1`);

    if (messagesResponse.ok) {
      // Gateway is reachable but doesn't have channel endpoint
      // Return defaults with connected=false (we don't know actual status)
      return NextResponse.json({ channels: DEFAULT_CHANNELS });
    }

    // Gateway not reachable
    return NextResponse.json({
      channels: DEFAULT_CHANNELS,
      warning: 'Unable to verify channel status - gateway not reachable',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError =
      message.includes('ECONNREFUSED') ||
      message.includes('fetch failed') ||
      message.includes('network');

    if (isConnectionError) {
      // Return defaults when gateway is down
      return NextResponse.json({
        channels: DEFAULT_CHANNELS,
        warning: 'Gateway not reachable - showing default channel status',
      });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch channel status',
        message,
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
