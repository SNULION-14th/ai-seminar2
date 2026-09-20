export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  starred: boolean;
  createdAt: number;
  order: number;
}

export type FilterType = 'all' | 'active' | 'completed';

export type ThemeMode = 'light' | 'dark';

export interface TodoStats {
  total: number;
  completed: number;
  active: number;
  percentage: number;
  isAllCompleted: boolean;
}
