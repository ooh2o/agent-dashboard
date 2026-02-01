'use client';

import { useState, useCallback, useEffect } from 'react';
import { MemoryFile, DailyNote, MemoryDiff, SearchResult } from './types';

interface MemoryApiFile {
  name: string;
  path: string;
  size: number;
  lastModified: string;
  type: 'memory' | 'daily' | 'notes';
  content?: string;
}

interface MemoryApiDiff {
  id: string;
  commitHash: string;
  path: string;
  timestamp: string;
  message: string;
  type: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
  diff?: string;
}

interface MemoryApiSearchResult {
  file: string;
  path: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

export interface UseMemoryResult {
  files: MemoryFile[];
  diffs: MemoryDiff[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  readFile: (path: string) => Promise<MemoryFile | null>;
  saveFile: (path: string, content: string) => Promise<boolean>;
  searchMemory: (query: string) => Promise<SearchResult[]>;
}

function mapApiFileToMemoryFile(apiFile: MemoryApiFile, id: string): MemoryFile {
  return {
    id,
    name: apiFile.name,
    path: apiFile.path,
    type: apiFile.type,
    lastModified: new Date(apiFile.lastModified),
    content: apiFile.content || '',
    size: apiFile.size,
  };
}

function mapApiDiffToMemoryDiff(apiDiff: MemoryApiDiff): MemoryDiff {
  return {
    id: apiDiff.id,
    path: apiDiff.path,
    timestamp: new Date(apiDiff.timestamp),
    type: apiDiff.type,
    newContent: apiDiff.message || apiDiff.diff || '',
    linesAdded: apiDiff.linesAdded,
    linesRemoved: apiDiff.linesRemoved,
  };
}

export function useMemory(): UseMemoryResult {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [diffs, setDiffs] = useState<MemoryDiff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await fetch('/api/memory');
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.files) {
        const mappedFiles = data.files.map((f: MemoryApiFile, i: number) =>
          mapApiFileToMemoryFile(f, `mem-${i}`)
        );
        setFiles(mappedFiles);
      }
    } catch (err) {
      throw err;
    }
  }, []);

  const fetchDiffs = useCallback(async () => {
    try {
      const response = await fetch('/api/memory/diff?limit=20');
      if (!response.ok) {
        throw new Error(`Failed to fetch diffs: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.diffs) {
        setDiffs(data.diffs.map(mapApiDiffToMemoryDiff));
      }
    } catch {
      // Diffs are optional, don't fail if not available
    }
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchFiles(), fetchDiffs()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch memory files');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFiles, fetchDiffs]);

  const readFile = useCallback(async (filePath: string): Promise<MemoryFile | null> => {
    try {
      const encodedPath = encodeURIComponent(filePath);
      const response = await fetch(`/api/memory/${encodedPath}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to read file: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.file) {
        return mapApiFileToMemoryFile(data.file, `mem-${filePath}`);
      }
      return null;
    } catch (err) {
      console.error('Error reading file:', err);
      return null;
    }
  }, []);

  const saveFile = useCallback(async (filePath: string, content: string): Promise<boolean> => {
    try {
      const encodedPath = encodeURIComponent(filePath);
      const response = await fetch(`/api/memory/${encodedPath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.statusText}`);
      }
      const data = await response.json();
      return data.success;
    } catch (err) {
      console.error('Error saving file:', err);
      return false;
    }
  }, []);

  const searchMemory = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(`/api/memory?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.results) {
        return data.results.map((r: MemoryApiSearchResult, i: number) => ({
          id: `search-${i}`,
          file: r.file,
          path: r.path,
          lineNumber: r.lineNumber,
          lineContent: r.lineContent,
          matchStart: r.matchStart,
          matchEnd: r.matchEnd,
        }));
      }
      return [];
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    files,
    diffs,
    isLoading,
    error,
    refetch,
    readFile,
    saveFile,
    searchMemory,
  };
}
