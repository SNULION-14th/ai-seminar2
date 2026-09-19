export type TodoCategory = 'Deep work' | 'Meeting' | 'Writing' | 'Admin' | 'Personal' | 'General';

export interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
  isTop3: boolean;
  tag?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TodoStorageState {
  version: number;
  lastUpdated: string;
  todos: Todo[];
}
