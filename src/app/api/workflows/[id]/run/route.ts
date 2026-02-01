import { NextRequest, NextResponse } from 'next/server'
import {
  getWorkflow,
  executeWorkflow,
  checkRateLimit,
} from '@/lib/workflow-engine'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/workflows/[id]/run - Manually trigger a workflow
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const workflow = getWorkflow(id)
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check rate limit
    const rateLimit = checkRateLimit(id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
          },
        }
      )
    }

    // Execute the workflow
    const run = await executeWorkflow(id, 'manual')

    return NextResponse.json({
      run,
      workflow: getWorkflow(id), // Return updated workflow with new stats
    })
  } catch (error) {
    console.error('Error running workflow:', error)
    return NextResponse.json(
      { error: 'Failed to run workflow' },
      { status: 500 }
    )
  }
}
