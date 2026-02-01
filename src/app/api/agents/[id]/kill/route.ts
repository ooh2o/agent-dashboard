import { NextRequest, NextResponse } from 'next/server';
import { getAgent, updateAgent } from '@/lib/agents';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3030';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/agents/[id]/kill
 * Kill a running agent
 */
export async function POST(
  _request: NextRequest,
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

    // Check if agent is in a killable state
    if (!['running', 'starting', 'paused', 'queued'].includes(agent.status)) {
      return NextResponse.json(
        { error: `Cannot kill agent in '${agent.status}' state` },
        { status: 400 }
      );
    }

    // Try to stop via gateway if we have a session key
    if (agent.sessionKey) {
      try {
        const gatewayResponse = await fetch(
          `${GATEWAY_URL}/agents/${agent.sessionKey}/stop`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!gatewayResponse.ok) {
          console.warn(`Gateway stop returned ${gatewayResponse.status}`);
        }
      } catch (gatewayError) {
        console.warn('Failed to stop agent via gateway:', gatewayError);
        // Continue with local state update even if gateway fails
      }
    }

    // Update local state
    const updatedAgent = updateAgent(id, {
      status: 'killed',
      endTime: new Date(),
    });

    if (!updatedAgent) {
      return NextResponse.json(
        { error: 'Failed to update agent state' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: updatedAgent.id,
        status: updatedAgent.status,
        endTime: updatedAgent.endTime?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error killing agent:', error);
    return NextResponse.json(
      { error: 'Failed to kill agent' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
