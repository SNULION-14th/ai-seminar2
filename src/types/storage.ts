import type { Todo, SunsetLog, UserSettings } from './todo';

export interface TodoRepository {
  getTodos(): Todo[];
  saveTodos(todos: Todo[]): void;
  getSettings(): UserSettings;
  saveSettings(settings: UserSettings): void;
  getSunsetLogs(): SunsetLog[];
  saveSunsetLog(log: SunsetLog): void;
  clear(): void;
}
