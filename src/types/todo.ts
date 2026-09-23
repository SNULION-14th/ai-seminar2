export type TodoStatus = 'today' | 'inbox' | 'completed' | 'archived';
export type Priority = 'high' | 'normal' | 'low';

export interface Todo {
  id: string;
  title: string;
  status: TodoStatus;
  priority: Priority;
  order: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SunsetLog {
  id: string;
  date: string;
  completedCount: number;
  totalFocusCount: number;
  reflection?: string;
  reviewedAt: string;
}

export interface UserSettings {
  maxFocusTasks: number;
  soundEnabled: boolean;
  theme: 'system' | 'light' | 'dark';
}
