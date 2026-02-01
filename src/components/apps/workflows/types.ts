import type {
  Workflow,
  WorkflowRun,
  Trigger,
  Action,
  ActionType,
  EventTriggerType,
} from '@/lib/workflows'

export type { Workflow, WorkflowRun, Trigger, Action, ActionType, EventTriggerType }

export type WorkflowTab = 'list' | 'builder' | 'history'

export interface WorkflowFormState {
  name: string
  description: string
  trigger: Trigger
  actions: Action[]
  enabled: boolean
}

export interface DragItem {
  index: number
  type: 'action'
}

export const DEFAULT_TRIGGER: Trigger = { type: 'manual' }

export const DEFAULT_ACTIONS: Record<ActionType, Action> = {
  send_message: {
    type: 'send_message',
    channel: 'telegram',
    message: '',
  },
  spawn_agent: {
    type: 'spawn_agent',
    agentType: 'general',
    prompt: '',
  },
  pause_agent: {
    type: 'pause_agent',
    all: true,
  },
  notify: {
    type: 'notify',
    title: '',
    message: '',
    priority: 'normal',
  },
  run_command: {
    type: 'run_command',
    command: '',
  },
}
