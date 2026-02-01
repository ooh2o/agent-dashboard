import { NextRequest, NextResponse } from 'next/server';
import {
  getTemplate,
  canSpawnAgent,
  addAgent,
  validateTemplate,
  type AgentInstance,
} from '@/lib/agents';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4280';

/**
 * POST /api/agents/spawn
 * Spawn a new agent from a template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.templateId) {
      return NextResponse.json(
        { error: 'Missing required field: templateId' },
        { status: 400 }
      );
    }

    // Get template
    const template = getTemplate(body.templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check resource limits
    const canSpawn = canSpawnAgent();
    if (!canSpawn.allowed) {
      return NextResponse.json(
        { error: canSpawn.reason },
        { status: 429 }
      );
    }

    // Build the task (template default + override)
    const task = body.task
      ? template.task
        ? `${template.task}\n\n${body.task}`
        : body.task
      : template.task;

    if (!task) {
      return NextResponse.json(
        { error: 'No task provided and template has no default task' },
        { status: 400 }
      );
    }

    // Validate the task content
    const validation = validateTemplate({ task });
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid task content', details: validation.errors },
        { status: 400 }
      );
    }

    // Create agent instance
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const agent: AgentInstance = {
      id: agentId,
      templateId: template.id,
      templateName: template.name,
      task,
      status: 'starting',
      startTime: new Date(),
      output: '',
    };

    // Add to running agents
    addAgent(agent);

    // Spawn via gateway
    try {
      const gatewayResponse = await fetch(`${GATEWAY_URL}/agents/spawn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task,
          model: body.model || template.model,
          template: template.id,
          maxTurns: body.maxTurns || template.maxTurns,
          thinking: template.thinking,
          agentId, // Pass our ID for tracking
        }),
      });

      if (!gatewayResponse.ok) {
        const error = await gatewayResponse.json().catch(() => ({}));
        throw new Error(error.message || 'Gateway spawn failed');
      }

      const gatewayData = await gatewayResponse.json();

      // Update agent with session key if provided
      agent.sessionKey = gatewayData.sessionKey || gatewayData.id;
      agent.status = 'running';

      return NextResponse.json({
        agent: {
          id: agent.id,
          templateId: agent.templateId,
          templateName: agent.templateName,
          task: agent.task,
          status: agent.status,
          startTime: agent.startTime.toISOString(),
          sessionKey: agent.sessionKey,
        },
      }, { status: 201 });
    } catch (gatewayError) {
      // Gateway error - still track the agent but mark as failed
      agent.status = 'failed';
      agent.error = gatewayError instanceof Error
        ? gatewayError.message
        : 'Failed to connect to gateway';

      return NextResponse.json(
        {
          error: 'Failed to spawn agent via gateway',
          details: agent.error,
          agent: {
            id: agent.id,
            status: agent.status,
          },
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error spawning agent:', error);
    return NextResponse.json(
      { error: 'Failed to spawn agent' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
