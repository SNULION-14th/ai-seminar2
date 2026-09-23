import type { Priority } from '../types/todo';

export interface ParsedInput {
  title: string;
  priority: Priority;
}

/**
 * Parses user raw input text to extract priority prefixes and clean title.
 * E.g., '!기획서 초안 작성' -> { title: '기획서 초안 작성', priority: 'high' }
 */
export function parseTaskInput(rawText: string, defaultPriority: Priority = 'normal'): ParsedInput {
  const trimmed = rawText.trim();
  if (trimmed.startsWith('!')) {
    const withoutPrefix = trimmed.slice(1).trim();
    return {
      title: withoutPrefix || trimmed,
      priority: 'high',
    };
  }
  return {
    title: trimmed,
    priority: defaultPriority,
  };
}
