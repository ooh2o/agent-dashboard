import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Workflows } from '../index'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}))

// Mock fetch
const mockWorkflows = [
  {
    id: 'wf-1',
    name: 'Test Workflow',
    description: 'A test workflow',
    trigger: { type: 'manual' as const },
    actions: [{ type: 'notify' as const, title: 'Test', message: 'Hello' }],
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    runCount: 5,
    lastRun: '2024-01-01T12:00:00Z',
    lastRunStatus: 'success' as const,
  },
]

global.fetch = jest.fn().mockImplementation((url: string) => {
  if (url === '/api/workflows') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ workflows: mockWorkflows }),
    })
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
})

describe('Workflows Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the component', async () => {
    render(<Workflows />)
    expect(screen.getByText('Workflow Automation')).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    render(<Workflows />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays workflows after loading', async () => {
    render(<Workflows />)

    await waitFor(() => {
      expect(screen.getByText('Test Workflow')).toBeInTheDocument()
    })

    expect(screen.getByText('A test workflow')).toBeInTheDocument()
    expect(screen.getByText('1 Workflow')).toBeInTheDocument()
  })

  it('shows new workflow button', async () => {
    render(<Workflows />)

    await waitFor(() => {
      expect(screen.getByText('New Workflow')).toBeInTheDocument()
    })
  })

  it('opens workflow editor when clicking new workflow', async () => {
    render(<Workflows />)

    await waitFor(() => {
      expect(screen.getByText('New Workflow')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('New Workflow'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Workflow name')).toBeInTheDocument()
    })
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn()
    render(<Workflows onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('Workflow Automation')).toBeInTheDocument()
    })

    // Find and click the red close button
    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find(btn =>
      btn.className.includes('bg-red-500')
    )

    if (closeButton) {
      fireEvent.click(closeButton)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('displays error when fetch fails', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed' }),
      })
    )

    render(<Workflows />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch workflows/)).toBeInTheDocument()
    })
  })

  it('shows trigger type icons correctly', async () => {
    render(<Workflows />)

    await waitFor(() => {
      expect(screen.getByText('Manual trigger')).toBeInTheDocument()
    })
  })

  it('displays action count', async () => {
    render(<Workflows />)

    await waitFor(() => {
      expect(screen.getByText('1 action')).toBeInTheDocument()
    })
  })

  it('displays run count', async () => {
    render(<Workflows />)

    await waitFor(() => {
      expect(screen.getByText('5 runs')).toBeInTheDocument()
    })
  })
})

describe('Workflow Editor', () => {
  it('shows trigger options', async () => {
    render(<Workflows />)

    await waitFor(() => {
      expect(screen.getByText('New Workflow')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('New Workflow'))

    await waitFor(() => {
      expect(screen.getByText('manual')).toBeInTheDocument()
      expect(screen.getByText('schedule')).toBeInTheDocument()
      expect(screen.getByText('event')).toBeInTheDocument()
    })
  })

  it('shows cron presets when schedule trigger selected', async () => {
    render(<Workflows />)

    await waitFor(() => {
      expect(screen.getByText('New Workflow')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('New Workflow'))

    await waitFor(() => {
      expect(screen.getByText('schedule')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('schedule'))

    await waitFor(() => {
      expect(screen.getByText('Every minute')).toBeInTheDocument()
      expect(screen.getByText('Every hour')).toBeInTheDocument()
    })
  })

  it('allows adding actions', async () => {
    render(<Workflows />)

    await waitFor(() => {
      expect(screen.getByText('New Workflow')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('New Workflow'))

    await waitFor(() => {
      expect(screen.getByText('Add actions to build your workflow')).toBeInTheDocument()
    })

    // Click add notify action
    const addNotifyButton = screen.getByRole('button', { name: /notify/i })
    fireEvent.click(addNotifyButton)

    await waitFor(() => {
      expect(screen.getByText('1. notify')).toBeInTheDocument()
    })
  })

  it('shows cancel and save buttons in editor', async () => {
    render(<Workflows />)

    await waitFor(() => {
      expect(screen.getByText('New Workflow')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('New Workflow'))

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })
  })
})
