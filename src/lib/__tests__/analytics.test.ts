import {
  calculateCost,
  getTodayISO,
  getDateDaysAgo,
  createEmptyMetrics,
  aggregateActivities,
  aggregateToolBreakdown,
  calculatePercentChange,
  formatAsCSV,
  formatSessionsAsCSV,
  getToolCategory,
  COST_PER_MILLION,
} from '../analytics';
import type { ActivityEvent, EventType } from '@/lib/types';

describe('Analytics Calculations', () => {
  describe('calculateCost', () => {
    it('should calculate cost correctly for input and output tokens', () => {
      // 1M input tokens = $3, 1M output tokens = $15
      const cost = calculateCost(1_000_000, 1_000_000);
      expect(cost).toBe(COST_PER_MILLION.input + COST_PER_MILLION.output);
    });

    it('should return 0 for zero tokens', () => {
      expect(calculateCost(0, 0)).toBe(0);
    });

    it('should calculate proportionally for smaller token counts', () => {
      // 500k input = $1.50, 500k output = $7.50
      const cost = calculateCost(500_000, 500_000);
      expect(cost).toBe(9);
    });
  });

  describe('getTodayISO', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const today = getTodayISO();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getDateDaysAgo', () => {
    it('should return correct date for 0 days ago', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(getDateDaysAgo(0)).toBe(today);
    });

    it('should return correct date for 7 days ago', () => {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      const expected = date.toISOString().split('T')[0];
      expect(getDateDaysAgo(7)).toBe(expected);
    });
  });

  describe('createEmptyMetrics', () => {
    it('should create metrics with all zeros', () => {
      const metrics = createEmptyMetrics('2026-02-01');
      expect(metrics.date).toBe('2026-02-01');
      expect(metrics.tokens.input).toBe(0);
      expect(metrics.tokens.output).toBe(0);
      expect(metrics.tokens.total).toBe(0);
      expect(metrics.cost).toBe(0);
      expect(metrics.toolCalls).toBe(0);
      expect(metrics.sessions).toBe(0);
      expect(metrics.errors).toBe(0);
    });
  });

  describe('aggregateActivities', () => {
    const createActivity = (overrides: Partial<ActivityEvent> = {}): ActivityEvent => ({
      id: 'test-1',
      timestamp: new Date(),
      type: 'tool_call' as EventType,
      explanation: 'Test activity',
      ...overrides,
    });

    it('should count tool calls', () => {
      const activities = [
        createActivity({ type: 'tool_call' }),
        createActivity({ type: 'tool_call' }),
        createActivity({ type: 'thinking' }),
      ];
      const metrics = aggregateActivities(activities);
      expect(metrics.toolCalls).toBe(2);
    });

    it('should count errors', () => {
      const activities = [
        createActivity({ result: 'error' }),
        createActivity({ result: 'success' }),
        createActivity({ type: 'error' }),
      ];
      const metrics = aggregateActivities(activities);
      expect(metrics.errors).toBe(2);
    });

    it('should aggregate tokens', () => {
      const activities = [
        createActivity({ tokens: { input: 100, output: 50 } }),
        createActivity({ tokens: { input: 200, output: 100 } }),
      ];
      const metrics = aggregateActivities(activities);
      expect(metrics.tokens.input).toBe(300);
      expect(metrics.tokens.output).toBe(150);
      expect(metrics.tokens.total).toBe(450);
    });

    it('should calculate cost from aggregated tokens', () => {
      const activities = [
        createActivity({ tokens: { input: 1_000_000, output: 500_000 } }),
      ];
      const metrics = aggregateActivities(activities);
      // $3 per M input + $7.50 per 500k output = $10.50
      expect(metrics.cost).toBeCloseTo(10.5, 2);
    });

    it('should update existing metrics', () => {
      const existing = createEmptyMetrics('2026-02-01');
      existing.toolCalls = 5;
      existing.tokens = { input: 100, output: 50, total: 150 };

      const activities = [
        createActivity({ type: 'tool_call', tokens: { input: 100, output: 50 } }),
      ];

      const metrics = aggregateActivities(activities, existing);
      expect(metrics.toolCalls).toBe(6);
      expect(metrics.tokens.input).toBe(200);
      expect(metrics.tokens.output).toBe(100);
    });
  });

  describe('aggregateToolBreakdown', () => {
    const createActivity = (tool: string, overrides: Partial<ActivityEvent> = {}): ActivityEvent => ({
      id: 'test-1',
      timestamp: new Date(),
      type: 'tool_call' as EventType,
      tool,
      explanation: 'Test activity',
      ...overrides,
    });

    it('should count tool usage', () => {
      const activities = [
        createActivity('file_read'),
        createActivity('file_read'),
        createActivity('file_write'),
      ];
      const breakdown = aggregateToolBreakdown(activities);

      const fileRead = breakdown.find(t => t.tool === 'file_read');
      const fileWrite = breakdown.find(t => t.tool === 'file_write');

      expect(fileRead?.count).toBe(2);
      expect(fileWrite?.count).toBe(1);
    });

    it('should calculate average duration', () => {
      const activities = [
        createActivity('file_read', { durationMs: 100 }),
        createActivity('file_read', { durationMs: 200 }),
      ];
      const breakdown = aggregateToolBreakdown(activities);
      const fileRead = breakdown.find(t => t.tool === 'file_read');

      expect(fileRead?.avgDuration).toBe(150);
    });

    it('should calculate success rate', () => {
      const activities = [
        createActivity('file_read', { result: 'success' }),
        createActivity('file_read', { result: 'success' }),
        createActivity('file_read', { result: 'error' }),
      ];
      const breakdown = aggregateToolBreakdown(activities);
      const fileRead = breakdown.find(t => t.tool === 'file_read');

      expect(fileRead?.successRate).toBeCloseTo(66.67, 1);
    });

    it('should sort by count descending', () => {
      const activities = [
        createActivity('a'),
        createActivity('b'),
        createActivity('b'),
        createActivity('c'),
        createActivity('c'),
        createActivity('c'),
      ];
      const breakdown = aggregateToolBreakdown(activities);

      expect(breakdown[0].tool).toBe('c');
      expect(breakdown[1].tool).toBe('b');
      expect(breakdown[2].tool).toBe('a');
    });
  });

  describe('calculatePercentChange', () => {
    it('should calculate positive change', () => {
      expect(calculatePercentChange(150, 100)).toBe(50);
    });

    it('should calculate negative change', () => {
      expect(calculatePercentChange(50, 100)).toBe(-50);
    });

    it('should handle zero previous value', () => {
      expect(calculatePercentChange(100, 0)).toBe(100);
      expect(calculatePercentChange(0, 0)).toBe(0);
    });
  });

  describe('formatAsCSV', () => {
    it('should format metrics as CSV', () => {
      const metrics = [
        {
          date: '2026-02-01',
          tokens: { input: 100, output: 50, total: 150 },
          cost: 1.5,
          toolCalls: 10,
          sessions: 2,
          errors: 1,
        },
      ];

      const csv = formatAsCSV(metrics);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Date,Input Tokens,Output Tokens,Total Tokens,Cost,Tool Calls,Sessions,Errors');
      expect(lines[1]).toBe('2026-02-01,100,50,150,1.5000,10,2,1');
    });
  });

  describe('formatSessionsAsCSV', () => {
    it('should format sessions as CSV', () => {
      const sessions = [
        {
          id: 'sess_1',
          startTime: '2026-02-01T10:00:00Z',
          endTime: '2026-02-01T11:00:00Z',
          duration: 3600000,
          tokens: { input: 1000, output: 500, total: 1500 },
          cost: 0.015,
          toolsUsed: ['file_read', 'web_fetch'],
          model: 'claude-opus-4-5',
          channel: 'main',
          status: 'completed' as const,
          errorCount: 0,
        },
      ];

      const csv = formatSessionsAsCSV(sessions);
      const lines = csv.split('\n');

      expect(lines[0]).toContain('ID');
      expect(lines[0]).toContain('Model');
      expect(lines[1]).toContain('sess_1');
      expect(lines[1]).toContain('file_read;web_fetch');
    });
  });

  describe('getToolCategory', () => {
    it('should return correct category for known tools', () => {
      expect(getToolCategory('file_read')).toBe('file');
      expect(getToolCategory('file_write')).toBe('file');
      expect(getToolCategory('web_search')).toBe('web');
      expect(getToolCategory('web_fetch')).toBe('web');
      expect(getToolCategory('memory_read')).toBe('memory');
      expect(getToolCategory('message_send')).toBe('communication');
      expect(getToolCategory('subagent_spawn')).toBe('agent');
      expect(getToolCategory('thinking')).toBe('system');
    });

    it('should return "other" for unknown tools', () => {
      expect(getToolCategory('unknown_tool')).toBe('other');
    });
  });
});
