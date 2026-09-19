import type { CategoryTag } from '../types/todo';

export interface ParsedTodoResult {
  cleanTitle: string;
  tag?: CategoryTag | string;
  dueTime?: string;
}

export function parseTodoInput(input: string): ParsedTodoResult {
  let text = input.trim();
  let tag: string | undefined = undefined;
  let dueTime: string | undefined = undefined;

  // 1. 태그 추출 (예: #멋사, #개인, #생활 등)
  const tagMatch = text.match(/(#[가-힣a-zA-Z0-9_]+)/);
  if (tagMatch) {
    tag = tagMatch[1];
    text = text.replace(tagMatch[0], '').trim();
  }

  // 2. 시간 추출 (예: 18:00, 15:30, 9:00 등)
  const timeMatch = text.match(/\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/);
  if (timeMatch) {
    dueTime = timeMatch[0];
    text = text.replace(timeMatch[0], '').trim();
  }

  // 앞뒤 불필요한 공백 제거
  const cleanTitle = text.replace(/\s+/g, ' ').trim();

  return {
    cleanTitle: cleanTitle || input.trim(),
    tag,
    dueTime,
  };
}
