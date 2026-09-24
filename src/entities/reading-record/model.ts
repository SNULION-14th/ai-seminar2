export type ReadingStatus = 'want' | 'reading' | 'finished'

export type RecordTag = '따뜻함' | '여운' | '새로움' | '위로됨' | '다시 읽고 싶다'

export interface Book {
  id: string
  title: string
}

export interface ReadingRecord {
  id: string
  book: Book
  bookTitle: string
  thought: string
  rating: number
  tags: RecordTag[]
  status: ReadingStatus
  createdAt: string
}

export const readingStatusLabel: Record<ReadingStatus, string> = {
  want: '읽고 싶음',
  reading: '읽는 중',
  finished: '완독',
}
