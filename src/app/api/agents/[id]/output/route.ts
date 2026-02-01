import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/agents';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3030';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/agents/[id]/output
 * Get the output of an agent (supports streaming via SSE)
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const agent = getAgent(id);

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const stream = url.searchParams.get('stream') === 'true';

    // For streaming output, proxy SSE from gateway
    if (stream && agent.sessionKey) {
      try {
        const gatewayResponse = await fetch(
          `${GATEWAY_URL}/agents/${agent.sessionKey}/stream`,
          {
            headers: { 'Accept': 'text/event-stream' },
          }
        );

        if (gatewayResponse.ok && gatewayResponse.body) {
          // Create a TransformStream to proxy the SSE
          const { readable, writable } = new TransformStream();
          const writer = writable.getWriter();

          // Proxy the stream
          (async () => {
            const reader = gatewayResponse.body!.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                await writer.write(value);
              }
            } catch (err) {
              console.error('Stream error:', err);
            } finally {
              await writer.close();
            }
          })();

          return new Response(readable, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }
      } catch {
        // Gateway streaming not available, fall back to polling
      }
    }

    // Non-streaming: fetch current output
    let output = agent.output || '';
    let gatewayOutput = null;

    if (agent.sessionKey) {
      try {
        const gatewayResponse = await fetch(
          `${GATEWAY_URL}/agents/${agent.sessionKey}`,
          {
            headers: { 'Accept': 'application/json' },
          }
        );

        if (gatewayResponse.ok) {
          const data = await gatewayResponse.json();
          gatewayOutput = data.output;
          output = gatewayOutput || output;
        }
      } catch {
        // Use local output if gateway unavailable
      }
    }

    return NextResponse.json({
      id: agent.id,
      status: agent.status,
      output,
      startTime: agent.startTime instanceof Date
        ? agent.startTime.toISOString()
        : agent.startTime,
      endTime: agent.endTime instanceof Date
        ? agent.endTime.toISOString()
        : agent.endTime,
      tokensUsed: agent.tokensUsed,
    });
  } catch (error) {
    console.error('Error getting agent output:', error);
    return NextResponse.json(
      { error: 'Failed to get agent output' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
