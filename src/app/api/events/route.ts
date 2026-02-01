import { NextRequest } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3030';

/**
 * SSE Proxy Route
 *
 * Proxies SSE events from the OpenClaw gateway to the client.
 * This allows the dashboard to receive real-time updates without
 * exposing the gateway directly or dealing with CORS issues.
 *
 * GET /api/events
 * Returns: Server-Sent Events stream
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // Track if the stream is still active
  let isActive = true;
  let gatewayConnection: { reader: ReadableStreamDefaultReader<Uint8Array> } | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (data: string) => {
        if (!isActive) return;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          isActive = false;
        }
      };

      // Send initial connection event
      emit(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

      // Keep-alive interval
      const keepAlive = setInterval(() => {
        if (!isActive) {
          clearInterval(keepAlive);
          return;
        }
        emit(': keepalive\n\n');
      }, 15000);

      try {
        // Connect to the gateway SSE endpoint
        const gatewayResponse = await fetch(`${GATEWAY_URL}/events`, {
          headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          // @ts-expect-error - signal for fetch abort
          signal: request.signal,
        });

        if (!gatewayResponse.ok) {
          emit(`data: ${JSON.stringify({ type: 'error', data: { message: 'Failed to connect to gateway' } })}\n\n`);
          clearInterval(keepAlive);
          controller.close();
          return;
        }

        const reader = gatewayResponse.body?.getReader();
        if (!reader) {
          emit(`data: ${JSON.stringify({ type: 'error', data: { message: 'No response body from gateway' } })}\n\n`);
          clearInterval(keepAlive);
          controller.close();
          return;
        }

        gatewayConnection = { reader };
        const decoder = new TextDecoder();

        // Read and forward events from gateway
        while (isActive) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          emit(text);
        }
      } catch (error) {
        if (isActive) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          emit(`data: ${JSON.stringify({ type: 'error', data: { message } })}\n\n`);
        }
      } finally {
        clearInterval(keepAlive);
        isActive = false;
        try {
          controller.close();
        } catch {
          // Ignore close errors
        }
      }
    },

    cancel() {
      isActive = false;
      if (gatewayConnection?.reader) {
        gatewayConnection.reader.cancel().catch(() => {});
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// Disable body parsing for this route
export const dynamic = 'force-dynamic';
