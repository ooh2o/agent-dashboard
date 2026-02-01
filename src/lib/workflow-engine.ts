// Workflow Engine - Execution and rate limiting

import type {
  Workflow,
  WorkflowRun,
  Action,
  ActionResult,
  EventTriggerType,
} from './workflows'

// In-memory storage (replace with database in production)
const workflows: Map<string, Workflow> = new Map()
const workflowRuns: Map<string, WorkflowRun[]> = new Map()
let auditLogs: AuditLogEntry[] = []

// Rate limiting
const rateLimitMap: Map<string, { count: number; resetAt: number }> = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 executions per minute per workflow

export interface AuditLogEntry {
  id: string
  timestamp: string
  workflowId: string
  workflowName: string
  action: 'create' | 'update' | 'delete' | 'run' | 'enable' | 'disable'
  details?: Record<string, unknown>
  userId?: string
}

// Initialize with some sample workflows
function initializeDefaults() {
  if (workflows.size === 0) {
    const sampleWorkflow: Workflow = {
      id: 'wf-sample-1',
      name: 'Error Alert Notification',
      description: 'Send notification when errors occur',
      trigger: { type: 'event', eventType: 'error' },
      actions: [
        {
          type: 'notify',
          title: 'Agent Error',
          message: 'An error occurred in the agent pipeline',
          priority: 'high',
        },
      ],
      enabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runCount: 0,
    }
    workflows.set(sampleWorkflow.id, sampleWorkflow)
  }
}

initializeDefaults()

// Rate limiting functions

export function checkRateLimit(workflowId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const limit = rateLimitMap.get(workflowId)

  if (!limit || now >= limit.resetAt) {
    rateLimitMap.set(workflowId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true }
  }

  if (limit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((limit.resetAt - now) / 1000) }
  }

  limit.count++
  return { allowed: true }
}

// Audit logging functions

export function logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  const logEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  }
  auditLogs.unshift(logEntry)
  // Keep last 1000 entries
  if (auditLogs.length > 1000) {
    auditLogs = auditLogs.slice(0, 1000)
  }
}

export function getAuditLogs(workflowId?: string, limit = 100): AuditLogEntry[] {
  let logs = auditLogs
  if (workflowId) {
    logs = logs.filter(l => l.workflowId === workflowId)
  }
  return logs.slice(0, limit)
}

// Workflow CRUD operations

export function listWorkflows(): Workflow[] {
  return Array.from(workflows.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function getWorkflow(id: string): Workflow | undefined {
  return workflows.get(id)
}

export function createWorkflow(input: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'runCount'>): Workflow {
  const id = `wf-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const now = new Date().toISOString()
  const workflow: Workflow = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
    runCount: 0,
    enabled: input.enabled ?? false,
  }
  workflows.set(id, workflow)
  logAudit({
    workflowId: id,
    workflowName: workflow.name,
    action: 'create',
    details: { trigger: workflow.trigger.type, actionCount: workflow.actions.length },
  })
  return workflow
}

export function updateWorkflow(id: string, updates: Partial<Workflow>): Workflow | null {
  const existing = workflows.get(id)
  if (!existing) return null

  const updated: Workflow = {
    ...existing,
    ...updates,
    id, // Prevent ID change
    createdAt: existing.createdAt, // Prevent creation date change
    updatedAt: new Date().toISOString(),
  }
  workflows.set(id, updated)

  const action = updates.enabled !== undefined && updates.enabled !== existing.enabled
    ? (updates.enabled ? 'enable' : 'disable')
    : 'update'

  logAudit({
    workflowId: id,
    workflowName: updated.name,
    action,
    details: { updates: Object.keys(updates) },
  })

  return updated
}

export function deleteWorkflow(id: string): boolean {
  const workflow = workflows.get(id)
  if (!workflow) return false

  workflows.delete(id)
  workflowRuns.delete(id)

  logAudit({
    workflowId: id,
    workflowName: workflow.name,
    action: 'delete',
  })

  return true
}

// Workflow execution

export async function executeWorkflow(
  workflowId: string,
  triggerSource: 'scheduled' | 'event' | 'manual'
): Promise<WorkflowRun> {
  const workflow = workflows.get(workflowId)
  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`)
  }

  const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const run: WorkflowRun = {
    id: runId,
    workflowId,
    startedAt: new Date().toISOString(),
    status: 'running',
    trigger: triggerSource,
    results: [],
  }

  // Store run
  const runs = workflowRuns.get(workflowId) || []
  runs.unshift(run)
  if (runs.length > 50) runs.length = 50 // Keep last 50 runs
  workflowRuns.set(workflowId, runs)

  try {
    for (let i = 0; i < workflow.actions.length; i++) {
      const action = workflow.actions[i]
      const startTime = Date.now()

      try {
        const output = await executeAction(action)
        run.results.push({
          actionIndex: i,
          actionType: action.type,
          status: 'success',
          output,
          duration: Date.now() - startTime,
        })
      } catch (error) {
        run.results.push({
          actionIndex: i,
          actionType: action.type,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        })
        // Continue to next action even if one fails
      }
    }

    run.status = run.results.some(r => r.status === 'failed') ? 'failed' : 'completed'
  } catch (error) {
    run.status = 'failed'
    run.error = error instanceof Error ? error.message : String(error)
  }

  run.completedAt = new Date().toISOString()

  // Update workflow stats
  workflow.lastRun = run.completedAt
  workflow.lastRunStatus = run.status === 'completed' ? 'success' : 'failed'
  workflow.runCount++
  workflows.set(workflowId, workflow)

  logAudit({
    workflowId,
    workflowName: workflow.name,
    action: 'run',
    details: {
      runId,
      trigger: triggerSource,
      status: run.status,
      actionResults: run.results.map(r => ({ type: r.actionType, status: r.status })),
    },
  })

  return run
}

async function executeAction(action: Action): Promise<unknown> {
  switch (action.type) {
    case 'notify':
      // In production, this would integrate with notification system
      console.log(`[Workflow] Notification: ${action.title} - ${action.message}`)
      return { sent: true, title: action.title }

    case 'send_message':
      // In production, this would send via the messaging system
      console.log(`[Workflow] Message to ${action.channel}: ${action.message}`)
      return { sent: true, channel: action.channel }

    case 'spawn_agent':
      // In production, this would call the gateway to spawn agent
      console.log(`[Workflow] Spawning agent: ${action.agentType}`)
      return { spawned: true, agentType: action.agentType }

    case 'pause_agent':
      // In production, this would call the intervene endpoint
      console.log(`[Workflow] Pausing agent: ${action.agentId || 'all'}`)
      return { paused: true, agentId: action.agentId }

    case 'run_command':
      // In production, this would execute via a sandboxed runner
      console.log(`[Workflow] Would run command: ${action.command}`)
      return { executed: true, command: action.command }

    default:
      throw new Error(`Unknown action type: ${(action as Action).type}`)
  }
}

// Get workflow runs

export function getWorkflowRuns(workflowId: string, limit = 20): WorkflowRun[] {
  const runs = workflowRuns.get(workflowId) || []
  return runs.slice(0, limit)
}

// Event matching for event triggers

export function matchEventTrigger(
  eventType: EventTriggerType,
  eventData?: Record<string, unknown>
): Workflow[] {
  return listWorkflows().filter(workflow => {
    if (!workflow.enabled) return false
    if (workflow.trigger.type !== 'event') return false
    if (workflow.trigger.eventType !== eventType) return false

    // Check filter if present
    if (workflow.trigger.filter && eventData) {
      return Object.entries(workflow.trigger.filter).every(
        ([key, value]) => eventData[key] === value
      )
    }

    return true
  })
}

// For scheduled workflows - get workflows due for execution

export function getScheduledWorkflows(): Workflow[] {
  return listWorkflows().filter(
    workflow => workflow.enabled && workflow.trigger.type === 'schedule'
  )
}
