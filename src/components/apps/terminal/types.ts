export type CommandStatus = 'pending' | 'running' | 'success' | 'error';

export interface TerminalEntry {
  id: string;
  timestamp: Date;
  type: 'command' | 'output' | 'error' | 'system' | 'chief-response';
  content: string;
  status?: CommandStatus;
  executionTime?: number;
}

export interface TerminalState {
  entries: TerminalEntry[];
  isDebugMode: boolean;
  isConnected: boolean;
  currentDirectory: string;
}

export interface CommandHistory {
  commands: string[];
  currentIndex: number;
}
