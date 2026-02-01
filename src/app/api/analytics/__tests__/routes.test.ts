/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

// Mock fetch for Next.js
global.fetch = jest.fn();

describe('Analytics API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/summary', () => {
    it('should return analytics summary', async () => {
      const { GET } = await import('../summary/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/summary');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('today');
      expect(data).toHaveProperty('weekTotal');
      expect(data).toHaveProperty('monthTotal');
      expect(data).toHaveProperty('topTools');
      expect(data).toHaveProperty('percentChange');

      // Validate today structure
      expect(data.today).toHaveProperty('date');
      expect(data.today).toHaveProperty('tokens');
      expect(data.today).toHaveProperty('cost');
      expect(data.today).toHaveProperty('toolCalls');
      expect(data.today).toHaveProperty('sessions');
    });

    it('should include percent changes', async () => {
      const { GET } = await import('../summary/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/summary');
      const response = await GET(request);
      const data = await response.json();

      expect(data.percentChange).toHaveProperty('tokens');
      expect(data.percentChange).toHaveProperty('cost');
      expect(data.percentChange).toHaveProperty('sessions');
      expect(typeof data.percentChange.tokens).toBe('number');
    });
  });

  describe('GET /api/analytics/history', () => {
    it('should return default 30 days of history', async () => {
      const { GET } = await import('../history/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/history');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('period');
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('totals');
      expect(data).toHaveProperty('averages');
      expect(data.period.days).toBe(30);
      expect(data.metrics).toHaveLength(30);
    });

    it('should respect days query parameter', async () => {
      const { GET } = await import('../history/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/history?days=7');
      const response = await GET(request);
      const data = await response.json();

      expect(data.period.days).toBe(7);
      expect(data.metrics).toHaveLength(7);
    });

    it('should cap days at 365', async () => {
      const { GET } = await import('../history/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/history?days=500');
      const response = await GET(request);
      const data = await response.json();

      expect(data.period.days).toBe(365);
    });

    it('should include totals and averages', async () => {
      const { GET } = await import('../history/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/history?days=7');
      const response = await GET(request);
      const data = await response.json();

      expect(data.totals).toHaveProperty('tokens');
      expect(data.totals).toHaveProperty('cost');
      expect(data.totals).toHaveProperty('sessions');
      expect(data.averages).toHaveProperty('tokensPerDay');
      expect(data.averages).toHaveProperty('costPerDay');
    });
  });

  describe('GET /api/analytics/tools', () => {
    it('should return tool analytics', async () => {
      const { GET } = await import('../tools/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/tools');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('tools');
      expect(data).toHaveProperty('totalCalls');
      expect(data).toHaveProperty('categoryBreakdown');
      expect(data).toHaveProperty('mostUsed');
      expect(data).toHaveProperty('longestDuration');
      expect(Array.isArray(data.tools)).toBe(true);
    });

    it('should have tool breakdown with required fields', async () => {
      const { GET } = await import('../tools/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/tools');
      const response = await GET(request);
      const data = await response.json();

      const tool = data.tools[0];
      expect(tool).toHaveProperty('tool');
      expect(tool).toHaveProperty('count');
      expect(tool).toHaveProperty('avgDuration');
      expect(tool).toHaveProperty('totalTokens');
      expect(tool).toHaveProperty('successRate');
    });

    it('should sort tools by count descending', async () => {
      const { GET } = await import('../tools/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/tools');
      const response = await GET(request);
      const data = await response.json();

      for (let i = 1; i < data.tools.length; i++) {
        expect(data.tools[i - 1].count).toBeGreaterThanOrEqual(data.tools[i].count);
      }
    });
  });

  describe('GET /api/analytics/sessions', () => {
    it('should return paginated sessions', async () => {
      const { GET } = await import('../sessions/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('sessions');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.sessions)).toBe(true);
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('pageSize');
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('hasMore');
    });

    it('should respect pagination parameters', async () => {
      const { GET } = await import('../sessions/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/sessions?page=2&pageSize=5');
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(2);
      expect(data.pagination.pageSize).toBe(5);
      expect(data.sessions.length).toBeLessThanOrEqual(5);
    });

    it('should have session with required fields', async () => {
      const { GET } = await import('../sessions/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/sessions');
      const response = await GET(request);
      const data = await response.json();

      const session = data.sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('startTime');
      expect(session).toHaveProperty('duration');
      expect(session).toHaveProperty('tokens');
      expect(session).toHaveProperty('cost');
      expect(session).toHaveProperty('toolsUsed');
      expect(session).toHaveProperty('model');
      expect(session).toHaveProperty('status');
    });

    it('should support sorting', async () => {
      const { GET } = await import('../sessions/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/sessions?sort=cost&order=desc');
      const response = await GET(request);
      const data = await response.json();

      for (let i = 1; i < data.sessions.length; i++) {
        expect(data.sessions[i - 1].cost).toBeGreaterThanOrEqual(data.sessions[i].cost);
      }
    });
  });

  describe('GET /api/analytics/export', () => {
    it('should export as JSON by default', async () => {
      const { GET } = await import('../export/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/export');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = JSON.parse(await response.text());
      expect(data).toHaveProperty('exportedAt');
      expect(data).toHaveProperty('dateRange');
      expect(data).toHaveProperty('summary');
    });

    it('should export as CSV when requested', async () => {
      const { GET } = await import('../export/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/export?format=csv');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');

      const text = await response.text();
      expect(text).toContain('Date');
      expect(text).toContain('Input Tokens');
    });

    it('should include Content-Disposition header for download', async () => {
      const { GET } = await import('../export/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/export?format=json');
      const response = await GET(request);

      const disposition = response.headers.get('Content-Disposition');
      expect(disposition).toContain('attachment');
      expect(disposition).toContain('openclaw-analytics');
    });

    it('should include summary in JSON export', async () => {
      const { GET } = await import('../export/route');

      const request = new NextRequest('http://localhost:3000/api/analytics/export');
      const response = await GET(request);

      const data = JSON.parse(await response.text());
      expect(data.summary).toHaveProperty('totalDays');
      expect(data.summary).toHaveProperty('totalSessions');
      expect(data.summary).toHaveProperty('totalTokens');
      expect(data.summary).toHaveProperty('totalCost');
    });
  });
});
