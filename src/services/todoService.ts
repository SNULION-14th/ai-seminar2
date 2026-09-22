import type { Todo, Priority } from '../types/todo';

export const MAX_FOCUS_TASKS = 3;

export function isFocusTask(todo: Todo): boolean {
  return todo.status === 'today' || todo.status === 'completed';
}

export function isInboxTask(todo: Todo): boolean {
  return todo.status === 'inbox';
}

export function getFocusTasks(todos: Todo[]): Todo[] {
  return todos
    .filter(isFocusTask)
    .sort((a, b) => a.order - b.order);
}

export function getInboxTasks(todos: Todo[]): Todo[] {
  return todos
    .filter(isInboxTask)
    .sort((a, b) => a.order - b.order);
}

export interface ProgressStats {
  total: number;
  completed: number;
  percentage: number;
}

export function calculateProgress(todos: Todo[]): ProgressStats {
  const focusTasks = getFocusTasks(todos);
  const total = focusTasks.length;
  const completed = focusTasks.filter((t) => t.status === 'completed').length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,
    completed,
    percentage,
  };
}

export function canAddToFocus(currentFocusCount: number): boolean {
  return currentFocusCount < MAX_FOCUS_TASKS;
}

export function createNewTodo(
  title: string,
  priority: Priority,
  canFocus: boolean,
  existingOrder: number
): Todo {
  const now = new Date().toISOString();
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    status: canFocus ? 'today' : 'inbox',
    priority,
    order: existingOrder,
    createdAt: now,
    updatedAt: now,
  };
}
