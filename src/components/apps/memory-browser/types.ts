export interface MemoryFile {
  id: string;
  name: string;
  path: string;
  type: 'memory' | 'daily' | 'notes';
  lastModified: Date;
  content: string;
  size: number;
}

export interface DailyNote {
  id: string;
  date: Date;
  path: string;
  summary: string;
  entryCount: number;
  tags: string[];
}

export interface MemoryDiff {
  id: string;
  path: string;
  timestamp: Date;
  type: 'added' | 'modified' | 'deleted';
  oldContent?: string;
  newContent: string;
  linesAdded: number;
  linesRemoved: number;
}

export interface SearchResult {
  id: string;
  file: string;
  path: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}
