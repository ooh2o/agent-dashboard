// Workflow Automation Data Models

export type TriggerType = 'schedule' | 'event' | 'manual'

export type EventTriggerType =
  | 'tool_call'
  | 'error'
  | 'session_start'
  | 'session_end'
  | 'agent_spawn'
  | 'agent_complete'
  | 'cost_threshold'
  | 'memory_write'

export type ActionType =
  | 'send_message'
  | 'spawn_agent'
  | 'pause_agent'
  | 'notify'
  | 'run_command'

export interface ScheduleTrigger {
  type: 'schedule'
  cron: string
  timezone?: string
}

export interface EventTrigger {
  type: 'event'
  eventType: EventTriggerType
  filter?: Record<string, unknown>
}

export interface ManualTrigger {
  type: 'manual'
}

export type Trigger = ScheduleTrigger | EventTrigger | ManualTrigger

export interface SendMessageAction {
  type: 'send_message'
  channel: 'telegram' | 'discord' | 'signal' | 'email' | 'sms'
  message: string
  recipient?: string
}

export interface SpawnAgentAction {
  type: 'spawn_agent'
  agentType: string
  prompt: string
  model?: string
  maxTurns?: number
}

export interface PauseAgentAction {
  type: 'pause_agent'
  agentId?: string
  all?: boolean
}

export interface NotifyAction {
  type: 'notify'
  title: string
  message: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
}

export interface RunCommandAction {
  type: 'run_command'
  command: string
  timeout?: number
}

export type Action =
  | SendMessageAction
  | SpawnAgentAction
  | PauseAgentAction
  | NotifyAction
  | RunCommandAction

export interface WorkflowRun {
  id: string
  workflowId: string
  startedAt: string
  completedAt?: string
  status: 'running' | 'completed' | 'failed'
  trigger: 'scheduled' | 'event' | 'manual'
  results: ActionResult[]
  error?: string
}

export interface ActionResult {
  actionIndex: number
  actionType: ActionType
  status: 'success' | 'failed' | 'skipped'
  output?: unknown
  error?: string
  duration: number
}

export interface Workflow {
  id: string
  name: string
  description?: string
  trigger: Trigger
  actions: Action[]
  enabled: boolean
  createdAt: string
  updatedAt: string
  lastRun?: string
  lastRunStatus?: 'success' | 'failed'
  runCount: number
}

export interface WorkflowCreateInput {
  name: string
  description?: string
  trigger: Trigger
  actions: Action[]
  enabled?: boolean
}

export interface WorkflowUpdateInput {
  name?: string
  description?: string
  trigger?: Trigger
  actions?: Action[]
  enabled?: boolean
}

// Validation utilities

const ALLOWED_COMMANDS = [
  'openclaw',
  'git status',
  'git log',
  'ls',
  'pwd',
  'date',
  'echo',
  'cat',
  'head',
  'tail',
  'wc',
  'curl',
  'wget',
]

const FORBIDDEN_PATTERNS = [
  /rm\s+(-rf?|--recursive)/i,
  /rmdir/i,
  /mkfs/i,
  /dd\s+if=/i,
  />\s*\/dev\//i,
  /chmod\s+777/i,
  /sudo/i,
  /eval/i,
  /exec/i,
  /\$\(/,
  /`[^`]+`/,
  /&&/,
  /\|\|/,
  /;/,
  /\|/,
  />/,
  />>/,
  /</,
]

export function validateCommand(command: string): { valid: boolean; error?: string } {
  const trimmed = command.trim().toLowerCase()

  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(command)) {
      return { valid: false, error: 'Command contains forbidden pattern' }
    }
  }

  // Check if command starts with allowed prefix
  const isAllowed = ALLOWED_COMMANDS.some(allowed =>
    trimmed.startsWith(allowed.toLowerCase())
  )

  if (!isAllowed) {
    return { valid: false, error: 'Command not in allowed list' }
  }

  return { valid: true }
}

export function validateAction(action: Action): { valid: boolean; error?: string } {
  switch (action.type) {
    case 'run_command':
      return validateCommand(action.command)

    case 'send_message':
      if (!action.message || action.message.length > 4000) {
        return { valid: false, error: 'Message must be 1-4000 characters' }
      }
      break

    case 'spawn_agent':
      if (!action.prompt || action.prompt.length > 10000) {
        return { valid: false, error: 'Prompt must be 1-10000 characters' }
      }
      if (action.maxTurns && (action.maxTurns < 1 || action.maxTurns > 100)) {
        return { valid: false, error: 'Max turns must be 1-100' }
      }
      break

    case 'notify':
      if (!action.title || action.title.length > 200) {
        return { valid: false, error: 'Title must be 1-200 characters' }
      }
      if (!action.message || action.message.length > 1000) {
        return { valid: false, error: 'Message must be 1-1000 characters' }
      }
      break

    case 'pause_agent':
      // Valid as-is
      break
  }

  return { valid: true }
}

export function validateWorkflow(workflow: WorkflowCreateInput): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!workflow.name || workflow.name.length < 1 || workflow.name.length > 100) {
    errors.push('Name must be 1-100 characters')
  }

  if (workflow.description && workflow.description.length > 500) {
    errors.push('Description must be at most 500 characters')
  }

  if (!workflow.trigger) {
    errors.push('Trigger is required')
  } else if (workflow.trigger.type === 'schedule') {
    if (!workflow.trigger.cron) {
      errors.push('Cron expression is required for schedule trigger')
    } else if (!isValidCron(workflow.trigger.cron)) {
      errors.push('Invalid cron expression')
    }
  } else if (workflow.trigger.type === 'event') {
    if (!workflow.trigger.eventType) {
      errors.push('Event type is required for event trigger')
    }
  }

  if (!workflow.actions || workflow.actions.length === 0) {
    errors.push('At least one action is required')
  } else if (workflow.actions.length > 10) {
    errors.push('Maximum 10 actions allowed')
  } else {
    for (let i = 0; i < workflow.actions.length; i++) {
      const result = validateAction(workflow.actions[i])
      if (!result.valid) {
        errors.push(`Action ${i + 1}: ${result.error}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

function isValidCron(expression: string): boolean {
  // Basic cron validation (5 or 6 fields)
  const parts = expression.trim().split(/\s+/)
  if (parts.length < 5 || parts.length > 6) {
    return false
  }

  // Very basic field validation
  const cronPattern = /^[\d,\-\*\/]+$/
  return parts.every(part => cronPattern.test(part) || part === '?' || part === 'L' || part === 'W')
}

// Cron expression helpers

export const CRON_PRESETS = [
  { label: 'Every minute', cron: '* * * * *' },
  { label: 'Every 5 minutes', cron: '*/5 * * * *' },
  { label: 'Every 15 minutes', cron: '*/15 * * * *' },
  { label: 'Every 30 minutes', cron: '*/30 * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
  { label: 'Daily at midnight', cron: '0 0 * * *' },
  { label: 'Daily at 9 AM', cron: '0 9 * * *' },
  { label: 'Weekly on Monday', cron: '0 0 * * 1' },
  { label: 'Monthly on 1st', cron: '0 0 1 * *' },
]

export function describeCron(expression: string): string {
  const preset = CRON_PRESETS.find(p => p.cron === expression)
  if (preset) return preset.label

  const parts = expression.split(' ')
  if (parts.length < 5) return expression

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts

  if (minute === '*' && hour === '*') return 'Every minute'
  if (minute.startsWith('*/') && hour === '*') return `Every ${minute.slice(2)} minutes`
  if (minute === '0' && hour === '*') return 'Every hour'
  if (minute === '0' && hour.startsWith('*/')) return `Every ${hour.slice(2)} hours`
  if (minute === '0' && hour !== '*' && dayOfMonth === '*' && dayOfWeek === '*') {
    return `Daily at ${hour}:00`
  }

  return expression
}

// Event type descriptions

export const EVENT_DESCRIPTIONS: Record<EventTriggerType, string> = {
  tool_call: 'When an agent calls a tool',
  error: 'When an error occurs',
  session_start: 'When a new session starts',
  session_end: 'When a session ends',
  agent_spawn: 'When a subagent is spawned',
  agent_complete: 'When an agent completes',
  cost_threshold: 'When cost exceeds threshold',
  memory_write: 'When memory is written',
}

// Action type descriptions

export const ACTION_DESCRIPTIONS: Record<ActionType, string> = {
  send_message: 'Send a message via a channel',
  spawn_agent: 'Spawn a new AI agent',
  pause_agent: 'Pause running agent(s)',
  notify: 'Send a notification',
  run_command: 'Run a safe command',
}
