/**
 * @jest-environment node
 */

import { GET, POST } from '../templates/route';
import { NextRequest } from 'next/server';

// Mock the agents module
jest.mock('@/lib/agents', () => {
  const mockTemplates = [
    {
      id: 'general',
      name: 'General Agent',
      description: 'Multi-purpose agent',
      task: '',
      model: 'claude-sonnet-4-20250514',
      thinking: true,
      timeout: 600,
      icon: 'bot',
      isBuiltIn: true,
    },
  ];

  const customTemplates: typeof mockTemplates = [];

  return {
    getTemplates: () => [...mockTemplates, ...customTemplates],
    getTemplate: (id: string) =>
      [...mockTemplates, ...customTemplates].find((t) => t.id === id),
    createTemplate: jest.fn((data) => {
      const newTemplate = {
        ...data,
        id: `custom-${Date.now()}`,
        isBuiltIn: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      customTemplates.push(newTemplate);
      return newTemplate;
    }),
    validateTemplate: jest.fn((template) => {
      const errors: string[] = [];
      if (template.name && template.name.length > 50) {
        errors.push('Template name must be 50 characters or less');
      }
      if (template.task?.includes('rm -rf')) {
        errors.push('Task contains potentially dangerous command patterns');
      }
      return { valid: errors.length === 0, errors };
    }),
  };
});

describe('GET /api/agents/templates', () => {
  it('returns list of templates', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.templates).toBeDefined();
    expect(Array.isArray(data.templates)).toBe(true);
    expect(data.templates.length).toBeGreaterThan(0);
  });

  it('includes built-in templates', async () => {
    const response = await GET();
    const data = await response.json();

    const generalTemplate = data.templates.find((t: { id: string }) => t.id === 'general');
    expect(generalTemplate).toBeDefined();
    expect(generalTemplate.isBuiltIn).toBe(true);
  });
});

describe('POST /api/agents/templates', () => {
  it('creates a new template with valid data', async () => {
    const request = new NextRequest('http://localhost/api/agents/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Agent',
        description: 'A test agent',
        task: 'Do something',
        model: 'claude-sonnet-4-20250514',
        icon: 'bot',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.template).toBeDefined();
    expect(data.template.name).toBe('Test Agent');
    expect(data.template.isBuiltIn).toBe(false);
  });

  it('returns 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost/api/agents/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Agent',
        // Missing other required fields
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required field');
  });

  it('returns 400 for invalid template data', async () => {
    const request = new NextRequest('http://localhost/api/agents/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: 'A'.repeat(51), // Too long
        description: 'Test',
        task: 'Test',
        model: 'claude-sonnet-4-20250514',
        icon: 'bot',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid template');
    expect(data.details).toContain('Template name must be 50 characters or less');
  });

  it('rejects dangerous commands in task', async () => {
    const request = new NextRequest('http://localhost/api/agents/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Dangerous Agent',
        description: 'Should be rejected',
        task: 'rm -rf /',
        model: 'claude-sonnet-4-20250514',
        icon: 'bot',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid template');
  });
});
