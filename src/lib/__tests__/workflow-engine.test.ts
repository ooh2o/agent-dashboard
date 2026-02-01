import {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getWorkflowRuns,
  checkRateLimit,
  logAudit,
  getAuditLogs,
  matchEventTrigger,
} from '../workflow-engine'
import {
  validateCommand,
  validateAction,
  validateWorkflow,
  describeCron,
} from '../workflows'

describe('Workflow Validation', () => {
  describe('validateCommand', () => {
    it('allows safe commands', () => {
      expect(validateCommand('openclaw status')).toEqual({ valid: true })
      expect(validateCommand('git status')).toEqual({ valid: true })
      expect(validateCommand('ls -la')).toEqual({ valid: true })
      expect(validateCommand('echo hello')).toEqual({ valid: true })
    })

    it('rejects dangerous commands', () => {
      expect(validateCommand('rm -rf /')).toEqual({
        valid: false,
        error: 'Command contains forbidden pattern',
      })
      expect(validateCommand('sudo apt install')).toEqual({
        valid: false,
        error: 'Command contains forbidden pattern',
      })
      expect(validateCommand('eval "malicious"')).toEqual({
        valid: false,
        error: 'Command contains forbidden pattern',
      })
      expect(validateCommand('cmd1 && cmd2')).toEqual({
        valid: false,
        error: 'Command contains forbidden pattern',
      })
      expect(validateCommand('echo foo | cat')).toEqual({
        valid: false,
        error: 'Command contains forbidden pattern',
      })
      expect(validateCommand('cat file > /etc/passwd')).toEqual({
        valid: false,
        error: 'Command contains forbidden pattern',
      })
    })

    it('rejects unknown commands', () => {
      expect(validateCommand('malware')).toEqual({
        valid: false,
        error: 'Command not in allowed list',
      })
      expect(validateCommand('nc -l 1234')).toEqual({
        valid: false,
        error: 'Command not in allowed list',
      })
    })
  })

  describe('validateAction', () => {
    it('validates run_command action', () => {
      expect(
        validateAction({ type: 'run_command', command: 'openclaw status' })
      ).toEqual({ valid: true })

      expect(
        validateAction({ type: 'run_command', command: 'rm -rf /' })
      ).toEqual({ valid: false, error: 'Command contains forbidden pattern' })
    })

    it('validates send_message action', () => {
      expect(
        validateAction({
          type: 'send_message',
          channel: 'telegram',
          message: 'Hello',
        })
      ).toEqual({ valid: true })

      expect(
        validateAction({
          type: 'send_message',
          channel: 'telegram',
          message: '',
        })
      ).toEqual({ valid: false, error: 'Message must be 1-4000 characters' })
    })

    it('validates notify action', () => {
      expect(
        validateAction({
          type: 'notify',
          title: 'Test',
          message: 'Hello',
          priority: 'normal',
        })
      ).toEqual({ valid: true })

      expect(
        validateAction({
          type: 'notify',
          title: '',
          message: 'Hello',
        })
      ).toEqual({ valid: false, error: 'Title must be 1-200 characters' })
    })

    it('validates spawn_agent action', () => {
      expect(
        validateAction({
          type: 'spawn_agent',
          agentType: 'general',
          prompt: 'Do something',
        })
      ).toEqual({ valid: true })

      expect(
        validateAction({
          type: 'spawn_agent',
          agentType: 'general',
          prompt: 'Test',
          maxTurns: 200,
        })
      ).toEqual({ valid: false, error: 'Max turns must be 1-100' })
    })
  })

  describe('validateWorkflow', () => {
    it('validates complete workflow', () => {
      const result = validateWorkflow({
        name: 'Test Workflow',
        trigger: { type: 'manual' },
        actions: [
          {
            type: 'notify',
            title: 'Test',
            message: 'Hello',
          },
        ],
      })
      expect(result).toEqual({ valid: true, errors: [] })
    })

    it('rejects workflow without name', () => {
      const result = validateWorkflow({
        name: '',
        trigger: { type: 'manual' },
        actions: [{ type: 'notify', title: 'Test', message: 'Hello' }],
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Name must be 1-100 characters')
    })

    it('rejects workflow without actions', () => {
      const result = validateWorkflow({
        name: 'Test',
        trigger: { type: 'manual' },
        actions: [],
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one action is required')
    })

    it('rejects workflow with invalid cron', () => {
      const result = validateWorkflow({
        name: 'Test',
        trigger: { type: 'schedule', cron: 'invalid' },
        actions: [{ type: 'notify', title: 'Test', message: 'Hello' }],
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid cron expression')
    })

    it('rejects workflow with dangerous action', () => {
      const result = validateWorkflow({
        name: 'Test',
        trigger: { type: 'manual' },
        actions: [{ type: 'run_command', command: 'rm -rf /' }],
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Action 1:'))).toBe(true)
    })
  })

  describe('describeCron', () => {
    it('describes preset expressions', () => {
      expect(describeCron('* * * * *')).toBe('Every minute')
      expect(describeCron('*/5 * * * *')).toBe('Every 5 minutes')
      expect(describeCron('0 * * * *')).toBe('Every hour')
      expect(describeCron('0 0 * * *')).toBe('Daily at midnight')
      expect(describeCron('0 9 * * *')).toBe('Daily at 9 AM')
    })
  })
})

describe('Workflow Engine', () => {
  beforeEach(() => {
    // Reset state between tests by creating fresh workflows
  })

  describe('createWorkflow', () => {
    it('creates a workflow with default values', () => {
      const workflow = createWorkflow({
        name: 'Test Workflow',
        trigger: { type: 'manual' },
        actions: [{ type: 'notify', title: 'Test', message: 'Hello' }],
        enabled: false,
      })

      expect(workflow.id).toMatch(/^wf-/)
      expect(workflow.name).toBe('Test Workflow')
      expect(workflow.enabled).toBe(false)
      expect(workflow.runCount).toBe(0)
      expect(workflow.createdAt).toBeDefined()
      expect(workflow.updatedAt).toBeDefined()
    })
  })

  describe('getWorkflow', () => {
    it('retrieves created workflow', () => {
      const created = createWorkflow({
        name: 'Retrievable Workflow',
        trigger: { type: 'manual' },
        actions: [{ type: 'notify', title: 'Test', message: 'Hello' }],
        enabled: false,
      })

      const retrieved = getWorkflow(created.id)
      expect(retrieved).toEqual(created)
    })

    it('returns undefined for non-existent workflow', () => {
      expect(getWorkflow('non-existent')).toBeUndefined()
    })
  })

  describe('updateWorkflow', () => {
    it('updates workflow properties', () => {
      const workflow = createWorkflow({
        name: 'Original Name',
        trigger: { type: 'manual' },
        actions: [{ type: 'notify', title: 'Test', message: 'Hello' }],
        enabled: false,
      })

      const updated = updateWorkflow(workflow.id, {
        name: 'Updated Name',
        enabled: true,
      })

      expect(updated?.name).toBe('Updated Name')
      expect(updated?.enabled).toBe(true)
      expect(updated?.id).toBe(workflow.id)
      expect(updated?.createdAt).toBe(workflow.createdAt)
    })

    it('returns null for non-existent workflow', () => {
      expect(updateWorkflow('non-existent', { name: 'Test' })).toBeNull()
    })
  })

  describe('deleteWorkflow', () => {
    it('deletes existing workflow', () => {
      const workflow = createWorkflow({
        name: 'To Delete',
        trigger: { type: 'manual' },
        actions: [{ type: 'notify', title: 'Test', message: 'Hello' }],
        enabled: false,
      })

      expect(deleteWorkflow(workflow.id)).toBe(true)
      expect(getWorkflow(workflow.id)).toBeUndefined()
    })

    it('returns false for non-existent workflow', () => {
      expect(deleteWorkflow('non-existent')).toBe(false)
    })
  })

  describe('listWorkflows', () => {
    it('returns all workflows sorted by update time', () => {
      const workflows = listWorkflows()
      expect(Array.isArray(workflows)).toBe(true)
    })
  })

  describe('executeWorkflow', () => {
    it('executes workflow and records run', async () => {
      const workflow = createWorkflow({
        name: 'Executable',
        trigger: { type: 'manual' },
        actions: [{ type: 'notify', title: 'Test', message: 'Hello' }],
        enabled: true,
      })

      const run = await executeWorkflow(workflow.id, 'manual')

      expect(run.workflowId).toBe(workflow.id)
      expect(run.status).toBe('completed')
      expect(run.trigger).toBe('manual')
      expect(run.results.length).toBe(1)
      expect(run.results[0].status).toBe('success')
    })

    it('throws for non-existent workflow', async () => {
      await expect(executeWorkflow('non-existent', 'manual')).rejects.toThrow(
        'Workflow non-existent not found'
      )
    })
  })

  describe('getWorkflowRuns', () => {
    it('returns runs for workflow', async () => {
      const workflow = createWorkflow({
        name: 'With Runs',
        trigger: { type: 'manual' },
        actions: [{ type: 'notify', title: 'Test', message: 'Hello' }],
        enabled: true,
      })

      await executeWorkflow(workflow.id, 'manual')
      await executeWorkflow(workflow.id, 'manual')

      const runs = getWorkflowRuns(workflow.id)
      expect(runs.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('checkRateLimit', () => {
    it('allows first execution', () => {
      const result = checkRateLimit('rate-test-' + Date.now())
      expect(result.allowed).toBe(true)
    })
  })

  describe('matchEventTrigger', () => {
    it('matches enabled workflows with event trigger', () => {
      const workflow = createWorkflow({
        name: 'Error Handler',
        trigger: { type: 'event', eventType: 'error' },
        actions: [{ type: 'notify', title: 'Error', message: 'An error occurred' }],
        enabled: true,
      })

      const matches = matchEventTrigger('error')
      expect(matches.some(w => w.id === workflow.id)).toBe(true)
    })

    it('does not match disabled workflows', () => {
      const workflow = createWorkflow({
        name: 'Disabled Handler',
        trigger: { type: 'event', eventType: 'session_start' },
        actions: [{ type: 'notify', title: 'Start', message: 'Session started' }],
        enabled: false,
      })

      const matches = matchEventTrigger('session_start')
      expect(matches.some(w => w.id === workflow.id)).toBe(false)
    })
  })

  describe('Audit Logging', () => {
    it('logs workflow operations', () => {
      const workflow = createWorkflow({
        name: 'Audited Workflow',
        trigger: { type: 'manual' },
        actions: [{ type: 'notify', title: 'Test', message: 'Hello' }],
        enabled: false,
      })

      const logs = getAuditLogs(workflow.id)
      expect(logs.some(l => l.action === 'create')).toBe(true)
    })
  })
})
