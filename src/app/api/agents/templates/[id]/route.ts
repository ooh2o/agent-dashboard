import { NextRequest, NextResponse } from 'next/server';
import {
  getTemplate,
  updateTemplate,
  deleteTemplate,
  validateTemplate,
} from '@/lib/agents';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/agents/templates/[id]
 * Get a specific template by ID
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const template = getTemplate(id);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error getting template:', error);
    return NextResponse.json(
      { error: 'Failed to get template' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/agents/templates/[id]
 * Update a custom template
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Check if template exists and is not built-in
    const existing = getTemplate(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (existing.isBuiltIn) {
      return NextResponse.json(
        { error: 'Cannot modify built-in templates' },
        { status: 403 }
      );
    }

    // Validate updates
    const validation = validateTemplate(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid template update', details: validation.errors },
        { status: 400 }
      );
    }

    const template = updateTemplate(id, {
      name: body.name,
      description: body.description,
      task: body.task,
      model: body.model,
      thinking: body.thinking,
      timeout: body.timeout,
      icon: body.icon,
      maxTurns: body.maxTurns,
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents/templates/[id]
 * Delete a custom template
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Check if template exists and is not built-in
    const existing = getTemplate(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (existing.isBuiltIn) {
      return NextResponse.json(
        { error: 'Cannot delete built-in templates' },
        { status: 403 }
      );
    }

    const deleted = deleteTemplate(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
