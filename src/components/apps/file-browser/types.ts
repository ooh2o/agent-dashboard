export type GitStatus = 'modified' | 'added' | 'untracked' | 'deleted' | 'renamed' | 'clean';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  extension?: string;
  gitStatus?: GitStatus;
  lastModified?: Date;
}

export interface FilePreview {
  path: string;
  content: string;
  language: string;
  lineCount: number;
}
