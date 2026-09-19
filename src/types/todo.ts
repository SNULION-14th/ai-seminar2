export interface Task {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  isFocus: boolean;
  createdAt: string;
}
