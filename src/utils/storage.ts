import type { Todo, TodoStorageState } from '../types/todo';
import { STORAGE_KEY_TODOS, INITIAL_TODOS } from '../constants/todo';

const CURRENT_SCHEMA_VERSION = 1;

export function loadTodosFromStorage(): Todo[] {
  if (typeof window === 'undefined') return INITIAL_TODOS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_TODOS);
    if (!raw) {
      saveTodosToStorage(INITIAL_TODOS);
      return INITIAL_TODOS;
    }

    const parsed = JSON.parse(raw) as Partial<TodoStorageState>;
    if (Array.isArray(parsed.todos)) {
      return parsed.todos;
    }

    // If format was direct array
    if (Array.isArray(parsed)) {
      return parsed as Todo[];
    }

    return INITIAL_TODOS;
  } catch (error) {
    console.error('Failed to parse todos from localStorage:', error);
    return INITIAL_TODOS;
  }
}

export function saveTodosToStorage(todos: Todo[]): void {
  if (typeof window === 'undefined') return;

  try {
    const state: TodoStorageState = {
      version: CURRENT_SCHEMA_VERSION,
      lastUpdated: new Date().toISOString(),
      todos,
    };
    localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save todos to localStorage:', error);
  }
}
