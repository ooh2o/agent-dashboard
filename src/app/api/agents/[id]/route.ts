import { NextRequest, NextResponse } from 'next/server';
import { getAgent, updateAgent, removeAgent } from '@/lib/agents';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4280';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/agents/[id]
 * Get a specific agent by ID
 */
export async function GET(
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

    // Try to get updated status from gateway
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
          // Update local state with gateway data
          updateAgent(id, {
            status: mapGatewayStatus(data.status),
            output: data.output || agent.output,
            tokensUsed: data.tokens,
            progress: data.progress,
          });
        }
      } catch {
        // Use local state if gateway unavailable
      }
    }

    // Get fresh agent data
    const freshAgent = getAgent(id);

    return NextResponse.json({
      agent: {
        id: freshAgent!.id,
        templateId: freshAgent!.templateId,
        templateName: freshAgent!.templateName,
        task: freshAgent!.task,
        status: freshAgent!.status,
        startTime: freshAgent!.startTime instanceof Date
          ? freshAgent!.startTime.toISOString()
          : freshAgent!.startTime,
        endTime: freshAgent!.endTime instanceof Date
          ? freshAgent!.endTime.toISOString()
          : freshAgent!.endTime,
        sessionKey: freshAgent!.sessionKey,
        progress: freshAgent!.progress,
        tokensUsed: freshAgent!.tokensUsed,
        error: freshAgent!.error,
      },
    });
  } catch (error) {
    console.error('Error getting agent:', error);
    return NextResponse.json(
      { error: 'Failed to get agent' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/[id]
 * Remove an agent from the list (cleanup after completion)
 */
export async function DELETE(
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

    // Only allow removing completed/failed/killed agents
    if (['running', 'starting', 'queued'].includes(agent.status)) {
      return NextResponse.json(
        { error: 'Cannot remove active agent. Kill it first.' },
        { status: 400 }
      );
    }

    const removed = removeAgent(id);
    if (!removed) {
      return NextResponse.json(
        { error: 'Failed to remove agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing agent:', error);
    return NextResponse.json(
      { error: 'Failed to remove agent' },
      { status: 500 }
    );
  }
}

function mapGatewayStatus(gatewayStatus: string): 'queued' | 'starting' | 'running' | 'paused' | 'completed' | 'failed' | 'killed' {
  const statusMap: Record<string, 'queued' | 'starting' | 'running' | 'paused' | 'completed' | 'failed' | 'killed'> = {
    active: 'running',
    running: 'running',
    starting: 'starting',
    paused: 'paused',
    completed: 'completed',
    failed: 'failed',
    stopped: 'killed',
  };
  return statusMap[gatewayStatus] || 'running';
}

export const dynamic = 'force-dynamic';
