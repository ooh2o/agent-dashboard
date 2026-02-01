import { NextResponse } from 'next/server';
import { getRunningAgents, type AgentInstanceStatus, type AgentInstance } from '@/lib/agents';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3030';

/**
 * GET /api/agents/running
 * List all running agents with their current status
 */
export async function GET() {
  try {
    const localAgents = getRunningAgents();

    // Try to sync with gateway for more accurate status
    try {
      const gatewayResponse = await fetch(`${GATEWAY_URL}/agents`, {
        headers: { 'Accept': 'application/json' },
      });

      if (gatewayResponse.ok) {
        const gatewayData = await gatewayResponse.json();
        const gatewayAgents = gatewayData.agents || [];

        // Merge gateway status with local agents
        const agents: AgentInstance[] = localAgents.map((agent) => {
          const gatewayAgent = gatewayAgents.find(
            (ga: { id?: string; sessionKey?: string }) =>
              ga.id === agent.sessionKey || ga.sessionKey === agent.sessionKey
          );

          if (gatewayAgent) {
            return {
              ...agent,
              status: mapGatewayStatus(gatewayAgent.status),
              tokensUsed: gatewayAgent.tokens as { input: number; output: number } | undefined,
              progress: gatewayAgent.progress as number | undefined,
            };
          }
          return agent;
        });

        return NextResponse.json({
          agents: agents.map(serializeAgent),
          synced: true,
        });
      }
    } catch {
      // Gateway unavailable, return local state
    }

    return NextResponse.json({
      agents: localAgents.map(serializeAgent),
      synced: false,
    });
  } catch (error) {
    console.error('Error listing running agents:', error);
    return NextResponse.json(
      { error: 'Failed to list running agents' },
      { status: 500 }
    );
  }
}

function mapGatewayStatus(gatewayStatus: string): AgentInstanceStatus {
  const statusMap: Record<string, AgentInstanceStatus> = {
    active: 'running',
    running: 'running',
    starting: 'starting',
    paused: 'paused',
    completed: 'completed',
    failed: 'failed',
    stopped: 'killed',
    queued: 'queued',
    killed: 'killed',
  };
  return statusMap[gatewayStatus] || 'running';
}

function serializeAgent(agent: AgentInstance) {
  return {
    id: agent.id,
    templateId: agent.templateId,
    templateName: agent.templateName,
    task: agent.task,
    status: agent.status,
    startTime: agent.startTime instanceof Date
      ? agent.startTime.toISOString()
      : agent.startTime,
    endTime: agent.endTime instanceof Date
      ? agent.endTime.toISOString()
      : agent.endTime,
    sessionKey: agent.sessionKey,
    progress: agent.progress,
    tokensUsed: agent.tokensUsed,
    error: agent.error,
  };
}

export const dynamic = 'force-dynamic';
