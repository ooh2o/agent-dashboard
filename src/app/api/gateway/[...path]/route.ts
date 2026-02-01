import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3030';

/**
 * Gateway Proxy Route
 *
 * Proxies all requests to the OpenClaw gateway API.
 * Handles GET, POST, PUT, PATCH, DELETE methods.
 *
 * Example:
 *   /api/gateway/sessions -> http://localhost:3030/sessions
 *   /api/gateway/agents/123 -> http://localhost:3030/agents/123
 */

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyRequest(
  request: NextRequest,
  context: RouteContext,
  method: string
) {
  const { path } = await context.params;
  const pathString = path.join('/');
  const url = new URL(request.url);
  const queryString = url.search;

  const targetUrl = `${GATEWAY_URL}/${pathString}${queryString}`;

  try {
    // Build request options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    // Include body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch {
        // No body to parse
      }
    }

    // Make request to gateway
    const response = await fetch(targetUrl, fetchOptions);

    // Get response data
    const contentType = response.headers.get('content-type');
    let data: unknown;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return response with same status
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'X-Gateway-Status': String(response.status),
      },
    });
  } catch (error) {
    console.error(`Gateway proxy error [${method} /${pathString}]:`, error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError =
      message.includes('ECONNREFUSED') ||
      message.includes('fetch failed') ||
      message.includes('network');

    return NextResponse.json(
      {
        error: isConnectionError
          ? 'Unable to connect to gateway'
          : 'Gateway request failed',
        message,
        path: `/${pathString}`,
      },
      {
        status: isConnectionError ? 503 : 500,
      }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, 'GET');
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, 'POST');
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, 'PUT');
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, 'PATCH');
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, 'DELETE');
}

// Ensure dynamic rendering
export const dynamic = 'force-dynamic';
