import {
  PRESET_TEMPLATES,
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  canSpawnAgent,
  addAgent,
  getAgent,
  updateAgent,
  removeAgent,
  getRunningAgents,
  validateTemplate,
  formatAgentDuration,
  getAgentStatusColor,
  type AgentTemplate,
  type AgentInstance,
} from '../agents';

describe('Agent Templates', () => {
  describe('PRESET_TEMPLATES', () => {
    it('contains expected preset templates', () => {
      expect(PRESET_TEMPLATES.length).toBeGreaterThanOrEqual(4);

      const templateIds = PRESET_TEMPLATES.map((t) => t.id);
      expect(templateIds).toContain('research');
      expect(templateIds).toContain('code-review');
      expect(templateIds).toContain('data-analyst');
      expect(templateIds).toContain('writer');
    });

    it('all preset templates are marked as built-in', () => {
      for (const template of PRESET_TEMPLATES) {
        expect(template.isBuiltIn).toBe(true);
      }
    });

    it('all preset templates have required fields', () => {
      for (const template of PRESET_TEMPLATES) {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.model).toBeDefined();
        expect(template.icon).toBeDefined();
        expect(template.timeout).toBeGreaterThan(0);
      }
    });
  });

  describe('getTemplates', () => {
    it('returns all preset templates', () => {
      const templates = getTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(PRESET_TEMPLATES.length);
    });
  });

  describe('getTemplate', () => {
    it('returns a template by id', () => {
      const template = getTemplate('research');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Research Agent');
    });

    it('returns undefined for non-existent template', () => {
      const template = getTemplate('non-existent');
      expect(template).toBeUndefined();
    });
  });

  describe('createTemplate', () => {
    it('creates a new custom template', () => {
      const templateData = {
        name: 'Test Agent',
        description: 'A test agent',
        task: 'Do testing',
        model: 'claude-sonnet-4-20250514' as const,
        thinking: true,
        timeout: 300,
        icon: 'bot',
      };

      const created = createTemplate(templateData);

      expect(created.id).toMatch(/^custom-/);
      expect(created.name).toBe('Test Agent');
      expect(created.isBuiltIn).toBe(false);
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateTemplate', () => {
    it('updates a custom template', () => {
      const created = createTemplate({
        name: 'Update Test',
        description: 'Test',
        task: 'Test',
        model: 'claude-sonnet-4-20250514' as const,
        thinking: true,
        timeout: 300,
        icon: 'bot',
      });

      const updated = updateTemplate(created.id, { name: 'Updated Name' });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Updated Name');
    });

    it('returns null for non-existent template', () => {
      const result = updateTemplate('non-existent', { name: 'Test' });
      expect(result).toBeNull();
    });
  });

  describe('deleteTemplate', () => {
    it('deletes a custom template', () => {
      const created = createTemplate({
        name: 'Delete Test',
        description: 'Test',
        task: 'Test',
        model: 'claude-sonnet-4-20250514' as const,
        thinking: true,
        timeout: 300,
        icon: 'bot',
      });

      const deleted = deleteTemplate(created.id);
      expect(deleted).toBe(true);

      const template = getTemplate(created.id);
      expect(template).toBeUndefined();
    });

    it('returns false for built-in templates', () => {
      const deleted = deleteTemplate('research');
      expect(deleted).toBe(false);
    });

    it('returns false for non-existent template', () => {
      const deleted = deleteTemplate('non-existent');
      expect(deleted).toBe(false);
    });
  });
});

describe('Agent Instances', () => {
  beforeEach(() => {
    // Clear running agents before each test
    const agents = getRunningAgents();
    for (const agent of agents) {
      removeAgent(agent.id);
    }
  });

  describe('canSpawnAgent', () => {
    it('allows spawning when under limit', () => {
      const result = canSpawnAgent();
      expect(result.allowed).toBe(true);
    });

    it('prevents spawning when at limit', () => {
      // Add 5 running agents
      for (let i = 0; i < 5; i++) {
        addAgent({
          id: `test-agent-${i}`,
          templateId: 'general',
          templateName: 'General Agent',
          task: 'Test task',
          status: 'running',
          startTime: new Date(),
          output: '',
        });
      }

      const result = canSpawnAgent();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Maximum concurrent agents');
    });
  });

  describe('addAgent and getAgent', () => {
    it('adds and retrieves an agent', () => {
      const agent: AgentInstance = {
        id: 'test-agent',
        templateId: 'general',
        templateName: 'General Agent',
        task: 'Test task',
        status: 'running',
        startTime: new Date(),
        output: '',
      };

      addAgent(agent);
      const retrieved = getAgent('test-agent');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-agent');
    });
  });

  describe('updateAgent', () => {
    it('updates an agent', () => {
      const agent: AgentInstance = {
        id: 'update-test',
        templateId: 'general',
        templateName: 'General Agent',
        task: 'Test task',
        status: 'running',
        startTime: new Date(),
        output: '',
      };

      addAgent(agent);
      const updated = updateAgent('update-test', {
        status: 'completed',
        output: 'Done!',
      });

      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('completed');
      expect(updated?.output).toBe('Done!');
    });

    it('returns null for non-existent agent', () => {
      const result = updateAgent('non-existent', { status: 'completed' });
      expect(result).toBeNull();
    });
  });

  describe('removeAgent', () => {
    it('removes an agent', () => {
      const agent: AgentInstance = {
        id: 'remove-test',
        templateId: 'general',
        templateName: 'General Agent',
        task: 'Test task',
        status: 'completed',
        startTime: new Date(),
        output: '',
      };

      addAgent(agent);
      const removed = removeAgent('remove-test');

      expect(removed).toBe(true);
      expect(getAgent('remove-test')).toBeUndefined();
    });

    it('returns false for non-existent agent', () => {
      const removed = removeAgent('non-existent');
      expect(removed).toBe(false);
    });
  });
});

describe('Template Validation', () => {
  describe('validateTemplate', () => {
    it('validates a valid template', () => {
      const result = validateTemplate({
        name: 'Test Agent',
        description: 'A test agent',
        task: 'Do something useful',
        timeout: 300,
        maxTurns: 20,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects name that is too long', () => {
      const result = validateTemplate({
        name: 'A'.repeat(51),
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template name must be 50 characters or less');
    });

    it('rejects description that is too long', () => {
      const result = validateTemplate({
        description: 'A'.repeat(201),
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description must be 200 characters or less');
    });

    it('rejects dangerous commands in task', () => {
      const result = validateTemplate({
        task: 'rm -rf /',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task contains potentially dangerous command patterns');
    });

    it('rejects invalid timeout', () => {
      const result = validateTemplate({
        timeout: 10, // Too short
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Timeout must be between 30 and 3600 seconds');
    });

    it('rejects invalid maxTurns', () => {
      const result = validateTemplate({
        maxTurns: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Max turns must be between 1 and 100');
    });
  });
});

describe('Utility Functions', () => {
  describe('formatAgentDuration', () => {
    it('formats seconds correctly', () => {
      const start = new Date();
      const end = new Date(start.getTime() + 45000);
      expect(formatAgentDuration(start, end)).toBe('45s');
    });

    it('formats minutes and seconds correctly', () => {
      const start = new Date();
      const end = new Date(start.getTime() + 125000);
      expect(formatAgentDuration(start, end)).toBe('2m 5s');
    });

    it('formats hours and minutes correctly', () => {
      const start = new Date();
      const end = new Date(start.getTime() + 3725000);
      expect(formatAgentDuration(start, end)).toBe('1h 2m');
    });
  });

  describe('getAgentStatusColor', () => {
    it('returns correct colors for each status', () => {
      expect(getAgentStatusColor('running').text).toBe('text-green-400');
      expect(getAgentStatusColor('failed').text).toBe('text-red-400');
      expect(getAgentStatusColor('completed').text).toBe('text-blue-400');
      expect(getAgentStatusColor('starting').text).toBe('text-yellow-400');
    });
  });
});
