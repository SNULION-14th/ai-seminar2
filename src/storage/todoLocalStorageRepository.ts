import type { Todo, SunsetLog, UserSettings } from '../types/todo';
import type { TodoRepository } from '../types/storage';

const STORAGE_KEYS = {
  TODOS: 'flowdo_todos_v1',
  SETTINGS: 'flowdo_settings_v1',
  SUNSET_LOGS: 'flowdo_sunset_logs_v1',
} as const;

const DEFAULT_SETTINGS: UserSettings = {
  maxFocusTasks: 3,
  soundEnabled: true,
  theme: 'system',
};

// Default seed data strictly derived from the Figma frame (node 4:2)
export const INITIAL_TODOS: Todo[] = [
  {
    id: 'seed-1',
    title: '제품 리뉴얼 제안서 초안 마무리하기',
    status: 'today',
    priority: 'high',
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    title: '디자인 리뷰 피드백 정리해서 공유',
    status: 'completed',
    priority: 'normal',
    order: 1,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    title: '오후 산책 30분',
    status: 'today',
    priority: 'low',
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-4',
    title: '다음 주 워크숍 일정 확인',
    status: 'inbox',
    priority: 'normal',
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-5',
    title: '읽다 만 아티클 정리하기',
    status: 'inbox',
    priority: 'low',
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-6',
    title: '가계부 지난달 결산',
    status: 'inbox',
    priority: 'low',
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class LocalStorageTodoRepository implements TodoRepository {
  private memoryFallback: Map<string, string> = new Map();

  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__flowdo_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private getItem(key: string): string | null {
    if (this.isLocalStorageAvailable()) {
      return window.localStorage.getItem(key);
    }
    return this.memoryFallback.get(key) ?? null;
  }

  private setItem(key: string, value: string): void {
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (err) {
        console.warn('LocalStorage write failed, using in-memory fallback:', err);
      }
    }
    this.memoryFallback.set(key, value);
  }

  getTodos(): Todo[] {
    const raw = this.getItem(STORAGE_KEYS.TODOS);
    if (!raw) {
      // Initialize with Figma sample data if first time
      this.saveTodos(INITIAL_TODOS);
      return INITIAL_TODOS;
    }
    try {
      return JSON.parse(raw) as Todo[];
    } catch (e) {
      console.error('Failed to parse todos from localStorage:', e);
      return INITIAL_TODOS;
    }
  }

  saveTodos(todos: Todo[]): void {
    this.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
  }

  getSettings(): UserSettings {
    const raw = this.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: UserSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  getSunsetLogs(): SunsetLog[] {
    const raw = this.getItem(STORAGE_KEYS.SUNSET_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as SunsetLog[];
    } catch {
      return [];
    }
  }

  saveSunsetLog(log: SunsetLog): void {
    const logs = this.getSunsetLogs();
    const existingIndex = logs.findIndex((item) => item.date === log.date);
    if (existingIndex >= 0) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }
    this.setItem(STORAGE_KEYS.SUNSET_LOGS, JSON.stringify(logs));
  }

  clear(): void {
    if (this.isLocalStorageAvailable()) {
      window.localStorage.removeItem(STORAGE_KEYS.TODOS);
      window.localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      window.localStorage.removeItem(STORAGE_KEYS.SUNSET_LOGS);
    }
    this.memoryFallback.clear();
  }
}

export const todoRepository = new LocalStorageTodoRepository();
