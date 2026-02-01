'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Search,
  Calendar,
  FileText,
  GitCompare,
  ChevronRight,
  Clock,
  Tag,
  Plus,
  Minus,
  File,
  Loader2,
  AlertCircle,
  RefreshCw,
  Save,
  Edit3,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemory } from './use-memory';
import { MemoryFile, DailyNote, MemoryDiff, SearchResult } from './types';

type ViewMode = 'files' | 'timeline' | 'search' | 'diff';

export function MemoryBrowser() {
  const {
    files,
    diffs,
    isLoading,
    error,
    refetch,
    readFile,
    saveFile,
    searchMemory,
  } = useMemory();

  const [viewMode, setViewMode] = useState<ViewMode>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null);
  const [selectedDaily, setSelectedDaily] = useState<DailyNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Select first file when files load
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      handleSelectFile(files[0]);
    }
  }, [files]);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchMemory(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMemory]);

  const handleSelectFile = useCallback(async (file: MemoryFile) => {
    // If file has no content, fetch it
    if (!file.content) {
      const fullFile = await readFile(file.path);
      if (fullFile) {
        setSelectedFile(fullFile);
      } else {
        setSelectedFile(file);
      }
    } else {
      setSelectedFile(file);
    }
    setSelectedDaily(null);
    setIsEditing(false);
  }, [readFile]);

  const handleStartEdit = useCallback(() => {
    if (selectedFile) {
      setEditContent(selectedFile.content);
      setIsEditing(true);
    }
  }, [selectedFile]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent('');
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedFile) return;

    setIsSaving(true);
    const success = await saveFile(selectedFile.path, editContent);
    setIsSaving(false);

    if (success) {
      // Update local state
      setSelectedFile({
        ...selectedFile,
        content: editContent,
        lastModified: new Date(),
      });
      setIsEditing(false);
      // Refresh file list
      refetch();
    }
  }, [selectedFile, editContent, saveFile, refetch]);

  // Extract daily notes from files
  const dailyNotes = useMemo(() => {
    return files
      .filter((f) => f.type === 'daily')
      .map((f) => {
        const dateMatch = f.name.match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? new Date(dateMatch[1]) : new Date(f.lastModified);
        return {
          id: f.id,
          date,
          path: f.path,
          summary: `Daily note for ${f.name.replace('.md', '')}`,
          entryCount: Math.floor(f.size / 50), // Estimate
          tags: ['daily'],
        } as DailyNote;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [files]);

  if (isLoading && files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading memory files...</p>
        </div>
      </div>
    );
  }

  if (error && files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-zinc-950">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
        {/* Navigation Tabs */}
        <div className="p-2 border-b border-zinc-800">
          <div className="flex gap-1">
            <NavButton
              active={viewMode === 'files'}
              onClick={() => setViewMode('files')}
              icon={<FileText className="h-4 w-4" />}
              label="Files"
            />
            <NavButton
              active={viewMode === 'timeline'}
              onClick={() => setViewMode('timeline')}
              icon={<Calendar className="h-4 w-4" />}
              label="Timeline"
            />
            <NavButton
              active={viewMode === 'diff'}
              onClick={() => setViewMode('diff')}
              icon={<GitCompare className="h-4 w-4" />}
              label="Diff"
            />
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search memory..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) setViewMode('search');
              }}
              className="pl-8 h-8 bg-zinc-800/50 border-zinc-700 text-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 animate-spin" />
            )}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            <AnimatePresence mode="wait">
              {viewMode === 'files' && (
                <FilesList
                  files={files}
                  selectedFile={selectedFile}
                  onSelect={(file) => {
                    handleSelectFile(file);
                    setSelectedDaily(null);
                  }}
                />
              )}
              {viewMode === 'timeline' && (
                <TimelineList
                  notes={dailyNotes}
                  selectedNote={selectedDaily}
                  onSelect={async (note) => {
                    setSelectedDaily(note);
                    const file = await readFile(note.path);
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                />
              )}
              {viewMode === 'search' && (
                <SearchResults
                  results={searchResults}
                  query={searchQuery}
                  isSearching={isSearching}
                  onSelect={async (result) => {
                    const file = await readFile(result.path);
                    if (file) {
                      setSelectedFile(file);
                      setSelectedDaily(null);
                      setViewMode('files');
                    }
                  }}
                />
              )}
              {viewMode === 'diff' && <DiffList diffs={diffs} />}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <span className="font-medium text-zinc-200">
              {selectedFile?.name || selectedDaily?.path.split('/').pop() || 'Memory Browser'}
            </span>
            {selectedFile && (
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">
                {formatBytes(selectedFile.size)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedFile && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartEdit}
                className="h-7 px-2 text-zinc-400 hover:text-zinc-200"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            )}
            {isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-7 px-2 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-7 px-2 bg-purple-600 hover:bg-purple-700"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1" />
                  )}
                  Save
                </Button>
              </>
            )}
            <div className="flex items-center gap-2 text-xs text-zinc-500 ml-2">
              <Clock className="h-3.5 w-3.5" />
              {selectedFile
                ? formatDate(selectedFile.lastModified)
                : selectedDaily
                ? formatDate(selectedDaily.date)
                : 'No file selected'}
            </div>
          </div>
        </div>

        {/* Content Viewer / Editor */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-[calc(100vh-200px)] min-h-[400px] bg-zinc-900 border border-zinc-700 rounded-md p-4 font-mono text-sm text-zinc-300 resize-none focus:outline-none focus:border-purple-500"
                placeholder="Enter markdown content..."
              />
            ) : selectedFile ? (
              <MarkdownViewer content={selectedFile.content} />
            ) : !selectedFile && !selectedDaily ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <Brain className="h-12 w-12 mb-4 text-zinc-700" />
                <p className="text-sm">Select a file to view its contents</p>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
        active
          ? 'bg-zinc-800 text-zinc-100'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function FilesList({
  files,
  selectedFile,
  onSelect,
}: {
  files: MemoryFile[];
  selectedFile: MemoryFile | null;
  onSelect: (file: MemoryFile) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-1"
    >
      {files.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-sm">
          No memory files found
        </div>
      ) : (
        files.map((file) => (
          <button
            key={file.id}
            onClick={() => onSelect(file)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors',
              selectedFile?.id === file.id
                ? 'bg-purple-500/20 text-purple-200'
                : 'text-zinc-300 hover:bg-zinc-800/50'
            )}
          >
            <File className="h-4 w-4 text-zinc-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{file.name}</p>
              <p className="text-xs text-zinc-500 truncate">{file.path}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </button>
        ))
      )}
    </motion.div>
  );
}

function TimelineList({
  notes,
  selectedNote,
  onSelect,
}: {
  notes: DailyNote[];
  selectedNote: DailyNote | null;
  onSelect: (note: DailyNote) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-2"
    >
      {notes.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-sm">
          No daily notes found
        </div>
      ) : (
        notes.map((note, index) => (
          <button
            key={note.id}
            onClick={() => onSelect(note)}
            className={cn(
              'w-full text-left transition-colors',
              selectedNote?.id === note.id
                ? 'bg-blue-500/20'
                : 'hover:bg-zinc-800/50'
            )}
          >
            <div className="flex">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center mr-3">
                <div
                  className={cn(
                    'w-2.5 h-2.5 rounded-full border-2',
                    selectedNote?.id === note.id
                      ? 'bg-blue-400 border-blue-400'
                      : 'bg-zinc-800 border-zinc-600'
                  )}
                />
                {index < notes.length - 1 && (
                  <div className="w-0.5 h-full bg-zinc-700 mt-1" />
                )}
              </div>

              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">
                    {formatShortDate(note.date)}
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-zinc-800 text-zinc-500 text-xs"
                  >
                    {note.entryCount} entries
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  {note.summary}
                </p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))
      )}
    </motion.div>
  );
}

function SearchResults({
  results,
  query,
  isSearching,
  onSelect,
}: {
  results: SearchResult[];
  query: string;
  isSearching: boolean;
  onSelect: (result: SearchResult) => void;
}) {
  if (!query.trim()) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8 text-zinc-500 text-sm"
      >
        Type to search across all memory files
      </motion.div>
    );
  }

  if (isSearching) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8 text-zinc-500 text-sm"
      >
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
        Searching...
      </motion.div>
    );
  }

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8 text-zinc-500 text-sm"
      >
        No results found for "{query}"
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-2"
    >
      <div className="text-xs text-zinc-500 px-1 mb-2">
        {results.length} result{results.length !== 1 ? 's' : ''}
      </div>
      {results.map((result) => (
        <button
          key={result.id}
          onClick={() => onSelect(result)}
          className="w-full text-left px-2 py-2 rounded-md hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-400">{result.file}</span>
            <span className="text-xs text-zinc-600">:{result.lineNumber}</span>
          </div>
          <p className="text-sm text-zinc-300 font-mono">
            {highlightMatch(result.lineContent, query)}
          </p>
        </button>
      ))}
    </motion.div>
  );
}

function DiffList({ diffs }: { diffs: MemoryDiff[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-2"
    >
      <div className="text-xs text-zinc-500 px-1 mb-2">Recent changes</div>
      {diffs.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-sm">
          No recent changes found
        </div>
      ) : (
        diffs.map((diff) => (
          <div
            key={diff.id}
            className="px-2 py-2 rounded-md bg-zinc-800/30 border border-zinc-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <Badge
                className={cn(
                  'text-[10px]',
                  diff.type === 'added' && 'bg-green-500/20 text-green-400',
                  diff.type === 'modified' && 'bg-yellow-500/20 text-yellow-400',
                  diff.type === 'deleted' && 'bg-red-500/20 text-red-400'
                )}
              >
                {diff.type}
              </Badge>
              <span className="text-xs text-zinc-400 flex-1 truncate">
                {diff.path}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-400">
                <Plus className="h-3 w-3" />
                {diff.linesAdded}
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <Minus className="h-3 w-3" />
                {diff.linesRemoved}
              </span>
              <span className="text-zinc-500 ml-auto">
                {formatDate(diff.timestamp)}
              </span>
            </div>
            {diff.newContent && (
              <div className="mt-2 p-2 rounded bg-zinc-900 text-xs text-zinc-400">
                {diff.newContent}
              </div>
            )}
            {diff.oldContent && (
              <div className="mt-2 p-2 rounded bg-zinc-900 font-mono text-xs">
                <div className="text-red-400/70 line-through">
                  - {diff.oldContent}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </motion.div>
  );
}

function MarkdownViewer({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="prose prose-invert prose-sm max-w-none">
      {lines.map((line, index) => {
        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className="text-2xl font-bold text-zinc-100 mt-6 mb-4 first:mt-0">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-xl font-semibold text-zinc-200 mt-5 mb-3 border-b border-zinc-800 pb-2">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={index} className="text-lg font-medium text-zinc-300 mt-4 mb-2">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith('- [x] ')) {
          return (
            <div key={index} className="flex items-center gap-2 text-zinc-400 my-1">
              <div className="w-4 h-4 rounded border border-green-500 bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-xs">&#10003;</span>
              </div>
              <span className="line-through">{line.slice(6)}</span>
            </div>
          );
        }
        if (line.startsWith('- [ ] ')) {
          return (
            <div key={index} className="flex items-center gap-2 text-zinc-300 my-1">
              <div className="w-4 h-4 rounded border border-zinc-600" />
              <span>{line.slice(6)}</span>
            </div>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <div key={index} className="flex items-start gap-2 text-zinc-300 my-1 ml-2">
              <span className="text-zinc-500 mt-1.5">&bull;</span>
              <span>{formatInlineStyles(line.slice(2))}</span>
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={index} className="h-3" />;
        }
        return (
          <p key={index} className="text-zinc-300 my-1">
            {formatInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
}

function formatInlineStyles(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-zinc-100 font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span className="bg-yellow-500/30 text-yellow-200">
        {text.slice(index, index + query.length)}
      </span>
      {text.slice(index + query.length)}
    </>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
