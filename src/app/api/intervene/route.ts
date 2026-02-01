import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3030';

/**
 * Intervention request body
 */
export interface InterventionRequest {
  /** The action to perform */
  action: 'inject' | 'pause' | 'stop';
  /** Session key (optional, defaults to 'main') */
  sessionKey?: string;
  /** Instruction to inject (required for 'inject' action) */
  instruction?: string;
}

/**
 * Intervention response
 */
export interface InterventionResponse {
  success: boolean;
  message: string;
  timestamp: string;
  action: string;
  sessionKey: string;
}

/**
 * POST /api/intervene
 *
 * Send intervention commands to the OpenClaw gateway.
 * Supports three actions:
 * - inject: Send an instruction to the agent
 * - pause: Pause the current agent session
 * - stop: Stop the current agent session
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InterventionRequest;

    // Validate request
    if (!body.action) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: action' },
        { status: 400 }
      );
    }

    if (!['inject', 'pause', 'stop'].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be: inject, pause, or stop' },
        { status: 400 }
      );
    }

    if (body.action === 'inject' && !body.instruction?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Instruction is required for inject action' },
        { status: 400 }
      );
    }

    const sessionKey = body.sessionKey || 'main';

    // Build the request to the gateway
    const gatewayPayload = {
      action: body.action,
      sessionKey,
      ...(body.action === 'inject' && { instruction: body.instruction }),
    };

    // Send to gateway
    const gatewayResponse = await fetch(`${GATEWAY_URL}/intervene`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gatewayPayload),
    });

    if (!gatewayResponse.ok) {
      const errorText = await gatewayResponse.text();
      return NextResponse.json(
        {
          success: false,
          error: `Gateway error: ${gatewayResponse.status}`,
          details: errorText,
        },
        { status: gatewayResponse.status }
      );
    }

    // Parse gateway response
    const gatewayResult = await gatewayResponse.json();

    // Return success response
    const response: InterventionResponse = {
      success: true,
      message: getActionMessage(body.action),
      timestamp: new Date().toISOString(),
      action: body.action,
      sessionKey,
    };

    return NextResponse.json(response);
  } catch (error) {
    // Handle connection errors to gateway
    if (error instanceof Error) {
      const isConnectionError =
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('fetch failed') ||
        error.message.includes('network');

      if (isConnectionError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unable to connect to gateway',
            details: 'The OpenClaw gateway may not be running',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Get human-readable message for an action
 */
function getActionMessage(action: string): string {
  switch (action) {
    case 'inject':
      return 'Instruction sent to agent';
    case 'pause':
      return 'Agent paused';
    case 'stop':
      return 'Agent stopped';
    default:
      return 'Action completed';
  }
}

// Ensure dynamic behavior
export const dynamic = 'force-dynamic';
