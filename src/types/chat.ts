export type UserStatus = 'online' | 'offline' | 'focus';

export interface User {
  id: string;
  nickname: string;
  avatarUrl?: string;
  status: UserStatus;
  statusMessage?: string;
  isCurrentUser?: boolean;
}

export type MessageType = 'text' | 'image' | 'voice' | 'system';

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[]; // userIds
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  type: MessageType;
  content: string;
  reactions: MessageReaction[];
  createdAt: string; // ISO 8601 string
  isSilent?: boolean; // 포커스/조용한 전송 플래그
  expiresAt?: string; // 클린챗 만료 시간
}

export interface ChatRoom {
  id: string;
  title: string;
  isGroup: boolean;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  ephemeralHours?: number; // 0: 영구 보관, 24: 24시간 후 만료, 168: 7일 후 만료
}

export interface UserSettings {
  focusMode: boolean;
  gentleRead: boolean;
  defaultEphemeralHours: number;
  darkMode: boolean;
  soundEnabled: boolean;
}
