/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// Mock the workflow engine
jest.mock('@/lib/workflow-engine', () => ({
  listWorkflows: jest.fn(() => [
    {
      id: 'wf-1',
      name: 'Test Workflow',
      trigger: { type: 'manual' },
      actions: [{ type: 'notify', title: 'Test', message: 'Hello' }],
      enabled: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      runCount: 0,
    },
  ]),
  createWorkflow: jest.fn((input) => ({
    id: 'wf-new',
    ...input,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    runCount: 0,
  })),
  getAuditLogs: jest.fn(() => []),
}))

describe('GET /api/workflows', () => {
  it('returns list of workflows', async () => {
    const request = new NextRequest('http://localhost/api/workflows')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.workflows).toBeDefined()
    expect(Array.isArray(data.workflows)).toBe(true)
    expect(data.workflows.length).toBe(1)
    expect(data.workflows[0].name).toBe('Test Workflow')
  })

  it('includes audit logs when requested', async () => {
    const request = new NextRequest('http://localhost/api/workflows?audit=true')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.audit).toBeDefined()
  })
})

describe('POST /api/workflows', () => {
  it('creates a valid workflow', async () => {
    const request = new NextRequest('http://localhost/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Workflow',
        trigger: { type: 'manual' },
        actions: [{ type: 'notify', title: 'Test', message: 'Hello' }],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.workflow).toBeDefined()
    expect(data.workflow.name).toBe('New Workflow')
  })

  it('rejects invalid workflow', async () => {
    const request = new NextRequest('http://localhost/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '', // Invalid: empty name
        trigger: { type: 'manual' },
        actions: [],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
  })

  it('rejects workflow with dangerous command', async () => {
    const request = new NextRequest('http://localhost/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious Workflow',
        trigger: { type: 'manual' },
        actions: [{ type: 'run_command', command: 'rm -rf /' }],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details.some((d: string) => d.includes('forbidden'))).toBe(true)
  })
})
