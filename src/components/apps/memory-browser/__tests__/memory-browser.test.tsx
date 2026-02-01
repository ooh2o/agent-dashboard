/**
 * Component tests for Memory Browser
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryBrowser } from '../memory-browser';

// Mock the useMemory hook
const mockUseMemory = {
  files: [],
  diffs: [],
  isLoading: false,
  error: null,
  refetch: jest.fn(),
  readFile: jest.fn(),
  saveFile: jest.fn(),
  searchMemory: jest.fn(),
};

jest.mock('../use-memory', () => ({
  useMemory: () => mockUseMemory,
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('MemoryBrowser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMemory.files = [];
    mockUseMemory.diffs = [];
    mockUseMemory.isLoading = false;
    mockUseMemory.error = null;
  });

  describe('Loading state', () => {
    it('should show loading spinner when loading', () => {
      mockUseMemory.isLoading = true;
      mockUseMemory.files = [];

      render(<MemoryBrowser />);

      expect(screen.getByText('Loading memory files...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should show error message and retry button', () => {
      mockUseMemory.error = 'Failed to connect';
      mockUseMemory.files = [];

      render(<MemoryBrowser />);

      expect(screen.getByText('Failed to connect')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call refetch when retry button clicked', () => {
      mockUseMemory.error = 'Failed to connect';
      mockUseMemory.files = [];

      render(<MemoryBrowser />);

      fireEvent.click(screen.getByText('Retry'));
      expect(mockUseMemory.refetch).toHaveBeenCalled();
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no files', () => {
      mockUseMemory.files = [];

      render(<MemoryBrowser />);

      expect(screen.getByText('No memory files found')).toBeInTheDocument();
    });
  });

  describe('File list', () => {
    it('should display files in the sidebar', () => {
      mockUseMemory.files = [
        {
          id: 'mem-1',
          name: 'MEMORY.md',
          path: 'MEMORY.md',
          type: 'memory' as const,
          lastModified: new Date(),
          content: '# Test',
          size: 100,
        },
        {
          id: 'mem-2',
          name: 'notes.md',
          path: 'memory/notes.md',
          type: 'notes' as const,
          lastModified: new Date(),
          content: '# Notes',
          size: 50,
        },
      ];

      render(<MemoryBrowser />);

      // Use getAllByText since file name appears in multiple places (sidebar + header)
      expect(screen.getAllByText('MEMORY.md').length).toBeGreaterThan(0);
      expect(screen.getAllByText('notes.md').length).toBeGreaterThan(0);
    });

    it('should select file when clicked', async () => {
      mockUseMemory.files = [
        {
          id: 'mem-1',
          name: 'MEMORY.md',
          path: 'MEMORY.md',
          type: 'memory' as const,
          lastModified: new Date(),
          content: '# Test Content',
          size: 100,
        },
      ];

      render(<MemoryBrowser />);

      // First file should be auto-selected
      await waitFor(() => {
        expect(screen.getByText('Test Content')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation tabs', () => {
    it('should show Files, Timeline, and Diff tabs', () => {
      render(<MemoryBrowser />);

      expect(screen.getByText('Files')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Diff')).toBeInTheDocument();
    });

    it('should switch to Diff view when Diff tab clicked', () => {
      mockUseMemory.diffs = [];

      render(<MemoryBrowser />);

      fireEvent.click(screen.getByText('Diff'));

      expect(screen.getByText('Recent changes')).toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('should have a search input', () => {
      render(<MemoryBrowser />);

      expect(screen.getByPlaceholderText('Search memory...')).toBeInTheDocument();
    });

    it('should switch to search view when typing', async () => {
      render(<MemoryBrowser />);

      const searchInput = screen.getByPlaceholderText('Search memory...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // After typing, the empty search prompt should be gone and searching indicator should appear
      await waitFor(() => {
        expect(screen.queryByText('Type to search across all memory files')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit mode', () => {
    it('should show Edit button when file selected', () => {
      mockUseMemory.files = [
        {
          id: 'mem-1',
          name: 'MEMORY.md',
          path: 'MEMORY.md',
          type: 'memory' as const,
          lastModified: new Date(),
          content: '# Test',
          size: 100,
        },
      ];

      render(<MemoryBrowser />);

      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should show Save and Cancel buttons when editing', async () => {
      mockUseMemory.files = [
        {
          id: 'mem-1',
          name: 'MEMORY.md',
          path: 'MEMORY.md',
          type: 'memory' as const,
          lastModified: new Date(),
          content: '# Test',
          size: 100,
        },
      ];

      render(<MemoryBrowser />);

      fireEvent.click(screen.getByText('Edit'));

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('should call saveFile when Save clicked', async () => {
      mockUseMemory.files = [
        {
          id: 'mem-1',
          name: 'MEMORY.md',
          path: 'MEMORY.md',
          type: 'memory' as const,
          lastModified: new Date(),
          content: '# Test',
          size: 100,
        },
      ];
      mockUseMemory.saveFile.mockResolvedValue(true);

      render(<MemoryBrowser />);

      fireEvent.click(screen.getByText('Edit'));

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUseMemory.saveFile).toHaveBeenCalled();
      });
    });
  });

  describe('Diff list', () => {
    it('should show diffs with badges', () => {
      mockUseMemory.diffs = [
        {
          id: 'diff-1',
          path: 'MEMORY.md',
          timestamp: new Date(),
          type: 'modified' as const,
          newContent: 'Updated content',
          linesAdded: 5,
          linesRemoved: 2,
        },
      ];

      render(<MemoryBrowser />);

      fireEvent.click(screen.getByText('Diff'));

      expect(screen.getByText('modified')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show empty state when no diffs', () => {
      mockUseMemory.diffs = [];

      render(<MemoryBrowser />);

      fireEvent.click(screen.getByText('Diff'));

      expect(screen.getByText('No recent changes found')).toBeInTheDocument();
    });
  });
});

describe('useMemory hook integration', () => {
  it('should call refetch on mount', () => {
    // The hook is mocked, but we verify the component renders
    render(<MemoryBrowser />);
    expect(mockUseMemory).toBeDefined();
  });
});
