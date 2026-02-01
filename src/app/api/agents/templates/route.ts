import { NextRequest, NextResponse } from 'next/server';
import {
  getTemplates,
  createTemplate,
  validateTemplate,
  type AgentTemplate,
} from '@/lib/agents';

/**
 * GET /api/agents/templates
 * List all templates (built-in + custom)
 */
export async function GET() {
  try {
    const templates = getTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error listing templates:', error);
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/templates
 * Create a new custom template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'description', 'task', 'model', 'icon'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate template content
    const validation = validateTemplate(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid template', details: validation.errors },
        { status: 400 }
      );
    }

    // Create template with defaults
    const templateData: Omit<AgentTemplate, 'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt'> = {
      name: body.name,
      description: body.description,
      task: body.task,
      model: body.model || 'claude-sonnet-4-20250514',
      thinking: body.thinking ?? true,
      timeout: body.timeout ?? 300,
      icon: body.icon,
      maxTurns: body.maxTurns ?? 20,
    };

    const template = createTemplate(templateData);
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
