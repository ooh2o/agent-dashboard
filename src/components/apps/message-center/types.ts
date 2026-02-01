export type Channel = 'telegram' | 'discord' | 'signal' | 'email';

export interface Message {
  id: string;
  threadId: string;
  channel: Channel;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    isAgent?: boolean;
  };
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'link';
  name: string;
  url: string;
  size?: number;
  preview?: string;
}

export interface Thread {
  id: string;
  channel: Channel;
  participants: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  updatedAt: Date;
}

export interface ChannelConfig {
  id: Channel;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  connected: boolean;
}
