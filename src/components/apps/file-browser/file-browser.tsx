'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileJson,
  FileText,
  FileType,
  Search,
  ChevronRight,
  ChevronDown,
  GitBranch,
  Clock,
  HardDrive,
  RefreshCw,
  MoreHorizontal,
  Home,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockFileTree, getFilePreview } from './mock-data';
import { FileNode, GitStatus } from './types';

export function FileBrowser() {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(
    new Set(['root', 'src', 'components'])
  );
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleDir = (id: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const flattenedFiles = useMemo(() => {
    const files: FileNode[] = [];
    const traverse = (node: FileNode) => {
      files.push(node);
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(mockFileTree);
    return files;
  }, []);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return flattenedFiles.filter(
      (f) =>
        f.type === 'file' &&
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, flattenedFiles]);

  const preview = selectedFile ? getFilePreview(selectedFile.path) : null;

  const gitStats = useMemo(() => {
    const stats = { modified: 0, added: 0, untracked: 0 };
    flattenedFiles.forEach((f) => {
      if (f.gitStatus === 'modified') stats.modified++;
      if (f.gitStatus === 'added') stats.added++;
      if (f.gitStatus === 'untracked') stats.untracked++;
    });
    return stats;
  }, [flattenedFiles]);

  return (
    <div className="flex h-full bg-zinc-950">
      {/* Sidebar - File Tree */}
      <div className="w-72 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
        {/* Toolbar */}
        <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">master</span>
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-zinc-800/50 border-zinc-700 text-sm"
            />
          </div>
        </div>

        {/* Git Status Summary */}
        <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2">
          <GitStatusBadge status="modified" count={gitStats.modified} />
          <GitStatusBadge status="added" count={gitStats.added} />
          <GitStatusBadge status="untracked" count={gitStats.untracked} />
        </div>

        {/* File Tree */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            <AnimatePresence mode="wait">
              {filteredFiles ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  {filteredFiles.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">
                      No files found
                    </div>
                  ) : (
                    filteredFiles.map((file) => (
                      <FileItem
                        key={file.id}
                        node={file}
                        depth={0}
                        isSelected={selectedFile?.id === file.id}
                        onClick={() => setSelectedFile(file)}
                      />
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TreeNode
                    node={mockFileTree}
                    depth={0}
                    expandedDirs={expandedDirs}
                    selectedFile={selectedFile}
                    onToggle={toggleDir}
                    onSelect={setSelectedFile}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - File Preview */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/30">
          {selectedFile ? (
            <>
              <div className="flex items-center gap-2">
                <FileIcon extension={selectedFile.extension} size={16} />
                <span className="text-sm font-medium text-zinc-200">
                  {selectedFile.name}
                </span>
                {selectedFile.gitStatus && selectedFile.gitStatus !== 'clean' && (
                  <GitStatusIndicator status={selectedFile.gitStatus} />
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                {selectedFile.size && (
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatBytes(selectedFile.size)}
                  </span>
                )}
                {selectedFile.lastModified && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(selectedFile.lastModified)}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-300"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <span className="text-sm text-zinc-500">Select a file to preview</span>
          )}
        </div>

        {/* Breadcrumb */}
        {selectedFile && (
          <div className="h-8 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/20">
            <Breadcrumb path={selectedFile.path} />
          </div>
        )}

        {/* Preview Content */}
        <ScrollArea className="flex-1">
          {preview ? (
            <div className="p-4">
              <CodePreview content={preview.content} language={preview.language} />
            </div>
          ) : selectedFile ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <FileIcon extension={selectedFile.extension} size={48} />
              <p className="text-sm mt-4">No preview available</p>
              <p className="text-xs text-zinc-600 mt-1">{selectedFile.path}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <Folder className="h-12 w-12 text-zinc-700 mb-4" />
              <p className="text-sm">Select a file to view its contents</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  expandedDirs,
  selectedFile,
  onToggle,
  onSelect,
}: {
  node: FileNode;
  depth: number;
  expandedDirs: Set<string>;
  selectedFile: FileNode | null;
  onToggle: (id: string) => void;
  onSelect: (node: FileNode) => void;
}) {
  const isExpanded = expandedDirs.has(node.id);
  const isDirectory = node.type === 'directory';

  return (
    <div>
      {node.id !== 'root' && (
        <FileItem
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          isSelected={selectedFile?.id === node.id}
          onClick={() => {
            if (isDirectory) {
              onToggle(node.id);
            } else {
              onSelect(node);
            }
          }}
        />
      )}

      {isDirectory && isExpanded && node.children && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
        >
          {node.children
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={node.id === 'root' ? 0 : depth + 1}
                expandedDirs={expandedDirs}
                selectedFile={selectedFile}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
        </motion.div>
      )}
    </div>
  );
}

function FileItem({
  node,
  depth,
  isExpanded,
  isSelected,
  onClick,
}: {
  node: FileNode;
  depth: number;
  isExpanded?: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isDirectory = node.type === 'directory';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-1.5 py-1 px-2 rounded-md text-left transition-colors group',
        isSelected
          ? 'bg-blue-500/20 text-blue-200'
          : 'text-zinc-300 hover:bg-zinc-800/50'
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      {isDirectory ? (
        <>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
          </motion.div>
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-400" />
          ) : (
            <Folder className="h-4 w-4 text-blue-400" />
          )}
        </>
      ) : (
        <>
          <span className="w-3.5" />
          <FileIcon extension={node.extension} size={16} />
        </>
      )}
      <span className="flex-1 text-sm truncate">{node.name}</span>
      {node.gitStatus && node.gitStatus !== 'clean' && (
        <GitStatusIndicator status={node.gitStatus} compact />
      )}
    </button>
  );
}

function FileIcon({ extension, size = 16 }: { extension?: string; size?: number }) {
  const iconClass = `h-${size / 4} w-${size / 4}`;
  const style = { width: size, height: size };

  switch (extension) {
    case 'tsx':
    case 'ts':
      return <FileCode className={iconClass} style={style} />;
    case 'json':
      return <FileJson className={iconClass} style={style} />;
    case 'md':
      return <FileText className={iconClass} style={style} />;
    case 'css':
      return <FileType className={iconClass} style={style} />;
    default:
      return <File className={iconClass} style={style} />;
  }
}

function GitStatusIndicator({
  status,
  compact = false,
}: {
  status: GitStatus;
  compact?: boolean;
}) {
  const config = {
    modified: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'M' },
    added: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'A' },
    untracked: { color: 'text-zinc-400', bg: 'bg-zinc-500/20', label: 'U' },
    deleted: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'D' },
    renamed: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'R' },
    clean: { color: 'text-zinc-600', bg: 'bg-transparent', label: '' },
  };

  const { color, bg, label } = config[status];

  if (compact) {
    return (
      <span className={cn('text-[10px] font-medium', color)}>{label}</span>
    );
  }

  return (
    <Badge className={cn('text-[10px] px-1.5', bg, color)}>{status}</Badge>
  );
}

function GitStatusBadge({ status, count }: { status: GitStatus; count: number }) {
  if (count === 0) return null;

  const config = {
    modified: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    added: { color: 'text-green-400', bg: 'bg-green-500/10' },
    untracked: { color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
    deleted: { color: 'text-red-400', bg: 'bg-red-500/10' },
    renamed: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    clean: { color: 'text-zinc-600', bg: 'bg-transparent' },
  };

  const { color, bg } = config[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
        bg,
        color
      )}
    >
      {count} {status}
    </span>
  );
}

function Breadcrumb({ path }: { path: string }) {
  const parts = path.split('/').filter(Boolean);

  return (
    <div className="flex items-center gap-1 text-xs text-zinc-500">
      <Home className="h-3 w-3" />
      {parts.map((part, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-zinc-700" />
          <span
            className={cn(
              'hover:text-zinc-300 cursor-pointer transition-colors',
              index === parts.length - 1 && 'text-zinc-300 font-medium'
            )}
          >
            {part}
          </span>
        </span>
      ))}
    </div>
  );
}

function CodePreview({ content, language }: { content: string; language: string }) {
  const lines = content.split('\n');

  return (
    <div className="font-mono text-sm rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
        <span className="text-xs text-zinc-500">{language}</span>
        <span className="text-xs text-zinc-600">{lines.length} lines</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="hover:bg-zinc-800/30">
                <td className="px-4 py-0.5 text-right text-zinc-600 select-none w-12 border-r border-zinc-800">
                  {index + 1}
                </td>
                <td className="px-4 py-0.5 whitespace-pre text-zinc-300">
                  {highlightSyntax(line, language)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function highlightSyntax(line: string, language: string): React.ReactNode {
  if (language === 'typescript' || language === 'json') {
    return line
      .split(/('.*?'|".*?")/g)
      .map((part, i) => {
        if (part.match(/^['"].*['"]$/)) {
          return (
            <span key={i} className="text-green-400">
              {part}
            </span>
          );
        }
        return part
          .split(/(\/\/.*$|\/\*.*?\*\/)/g)
          .map((subpart, j) => {
            if (subpart.match(/^\/\//)) {
              return (
                <span key={`${i}-${j}`} className="text-zinc-500 italic">
                  {subpart}
                </span>
              );
            }
            return subpart
              .split(
                /\b(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|async|await|default|true|false|null|undefined)\b/g
              )
              .map((keyword, k) => {
                if (
                  [
                    'import',
                    'export',
                    'from',
                    'const',
                    'let',
                    'var',
                    'function',
                    'return',
                    'if',
                    'else',
                    'for',
                    'while',
                    'class',
                    'interface',
                    'type',
                    'extends',
                    'implements',
                    'async',
                    'await',
                    'default',
                  ].includes(keyword)
                ) {
                  return (
                    <span key={`${i}-${j}-${k}`} className="text-purple-400">
                      {keyword}
                    </span>
                  );
                }
                if (['true', 'false', 'null', 'undefined'].includes(keyword)) {
                  return (
                    <span key={`${i}-${j}-${k}`} className="text-orange-400">
                      {keyword}
                    </span>
                  );
                }
                return keyword;
              });
          });
      });
  }

  return line;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return 'Just now';
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}
