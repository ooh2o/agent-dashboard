import { NextRequest, NextResponse } from 'next/server'
import {
  listWorkflows,
  createWorkflow,
  getAuditLogs,
} from '@/lib/workflow-engine'
import { validateWorkflow, type WorkflowCreateInput } from '@/lib/workflows'

export const dynamic = 'force-dynamic'

// GET /api/workflows - List all workflows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAudit = searchParams.get('audit') === 'true'

    const workflows = listWorkflows()

    const response: {
      workflows: typeof workflows
      audit?: ReturnType<typeof getAuditLogs>
    } = { workflows }

    if (includeAudit) {
      response.audit = getAuditLogs(undefined, 50)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error listing workflows:', error)
    return NextResponse.json(
      { error: 'Failed to list workflows' },
      { status: 500 }
    )
  }
}

// POST /api/workflows - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WorkflowCreateInput

    // Validate the workflow
    const validation = validateWorkflow(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const workflow = createWorkflow({
      name: body.name,
      description: body.description,
      trigger: body.trigger,
      actions: body.actions,
      enabled: body.enabled ?? false,
    })

    return NextResponse.json({ workflow }, { status: 201 })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}
