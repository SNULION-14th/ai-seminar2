import type { DiaryEntry } from '../types/diary'
const KEY = 'nba-game-night-log:diaries'
export function loadDiaries(): DiaryEntry[] { try { const value = localStorage.getItem(KEY); const data: unknown = value ? JSON.parse(value) : []; return Array.isArray(data) ? data.filter(isDiary).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)) : [] } catch { return [] } }
export function saveDiaries(entries: DiaryEntry[]): void { localStorage.setItem(KEY, JSON.stringify(entries)) }
function isDiary(value: unknown): value is DiaryEntry { return Boolean(value && typeof value === 'object' && 'id' in value && 'gameDate' in value && 'rating' in value) }
