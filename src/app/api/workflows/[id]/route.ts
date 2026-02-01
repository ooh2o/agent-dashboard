import { NextRequest, NextResponse } from 'next/server'
import {
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getWorkflowRuns,
  getAuditLogs,
} from '@/lib/workflow-engine'
import {
  validateWorkflow,
  type WorkflowUpdateInput,
} from '@/lib/workflows'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/workflows/[id] - Get a single workflow
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeRuns = searchParams.get('runs') === 'true'
    const includeAudit = searchParams.get('audit') === 'true'

    const workflow = getWorkflow(id)
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    const response: {
      workflow: typeof workflow
      runs?: ReturnType<typeof getWorkflowRuns>
      audit?: ReturnType<typeof getAuditLogs>
    } = { workflow }

    if (includeRuns) {
      response.runs = getWorkflowRuns(id)
    }

    if (includeAudit) {
      response.audit = getAuditLogs(id, 50)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    )
  }
}

// PUT /api/workflows/[id] - Update a workflow
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = (await request.json()) as WorkflowUpdateInput

    const existing = getWorkflow(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Validate the merged workflow
    const merged = {
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      trigger: body.trigger ?? existing.trigger,
      actions: body.actions ?? existing.actions,
      enabled: body.enabled ?? existing.enabled,
    }

    const validation = validateWorkflow(merged)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const workflow = updateWorkflow(id, body)
    if (!workflow) {
      return NextResponse.json(
        { error: 'Failed to update workflow' },
        { status: 500 }
      )
    }

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

// DELETE /api/workflows/[id] - Delete a workflow
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const existing = getWorkflow(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    const deleted = deleteWorkflow(id)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete workflow' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}
