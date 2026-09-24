import type { ReadingRecord, ReadingStatus, RecordTag } from '../../entities/reading-record/model'

const storageKey = 'one-line-bookshelf-records'

const initialRecords: ReadingRecord[] = [
  { id: 'seed-1', book: { id: 'book-1', title: '나는 나로 살기로 했다' }, bookTitle: '나는 나로 살기로 했다', thought: '조금 느려도 나다운 속도로 가면 된다는 문장이 오래 남았다.', rating: 5, tags: ['위로됨', '여운'], status: 'finished', createdAt: '2026-09-23T09:00:00.000Z' },
  { id: 'seed-2', book: { id: 'book-2', title: '불편한 편의점' }, bookTitle: '불편한 편의점', thought: '낯선 사람들 사이의 작은 친절이 따뜻한 밤처럼 느껴졌다.', rating: 4, tags: ['따뜻함', '다시 읽고 싶다'], status: 'finished', createdAt: '2026-09-21T09:00:00.000Z' },
  { id: 'seed-3', book: { id: 'book-3', title: '달러구트 꿈 백화점' }, bookTitle: '달러구트 꿈 백화점', thought: '오늘의 꿈도 언젠가 나를 다시 일으켜줄 것 같다.', rating: 4, tags: ['새로움'], status: 'reading', createdAt: '2026-09-18T09:00:00.000Z' },
]

type NewRecord = Pick<ReadingRecord, 'bookTitle' | 'thought' | 'rating' | 'tags' | 'status'>

function isReadingStatus(value: unknown): value is ReadingStatus {
  return value === 'want' || value === 'reading' || value === 'finished'
}

function isRecordTag(value: unknown): value is RecordTag {
  return value === '따뜻함' || value === '여운' || value === '새로움' || value === '위로됨' || value === '다시 읽고 싶다'
}

function isReadingRecord(value: unknown): value is ReadingRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<ReadingRecord>
  return typeof record.id === 'string' && typeof record.bookTitle === 'string' && typeof record.thought === 'string' &&
    typeof record.rating === 'number' && Array.isArray(record.tags) && record.tags.every(isRecordTag) &&
    isReadingStatus(record.status) && typeof record.createdAt === 'string'
}

export function loadReadingRecords(): ReadingRecord[] {
  if (typeof window === 'undefined') return initialRecords
  const saved = window.localStorage.getItem(storageKey)
  if (saved === null) return initialRecords
  try {
    const parsed: unknown = JSON.parse(saved)
    return Array.isArray(parsed) && parsed.every(isReadingRecord) ? parsed : initialRecords
  } catch {
    return initialRecords
  }
}

export function saveReadingRecords(records: ReadingRecord[]): void {
  window.localStorage.setItem(storageKey, JSON.stringify(records))
}

export function createReadingRecord(record: NewRecord): ReadingRecord {
  const id = crypto.randomUUID()
  return { ...record, id, book: { id: `book-${id}`, title: record.bookTitle }, createdAt: new Date().toISOString() }
}
