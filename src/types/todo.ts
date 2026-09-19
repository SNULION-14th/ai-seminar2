export type Priority = 'High' | 'Medium' | 'Low';

export type Category = 'focus' | 'inbox';

export type FilterType = 'all' | 'focus' | 'completed';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: Category;
  priority: Priority;
  createdAt: number;
}
