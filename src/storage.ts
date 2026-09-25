import type { TennisRecord } from './types'

const KEY = 'rally-log.records.v1'

// Notion MCP로 만든 기록 DB의 샘플 데이터와 동일
export const SAMPLE_RECORDS: TennisRecord[] = [
  {
    id: 'sample-1',
    title: '단식 vs 동아리 선배',
    date: '2026-09-18',
    type: '단식',
    opponent: '동아리 선배',
    score: '6-4',
    result: '승',
    court: '서울대 테니스장',
    memo: '서브 퍼스트 성공률이 좋았음',
  },
  {
    id: 'sample-2',
    title: '복식 연습 경기',
    date: '2026-09-21',
    type: '복식',
    opponent: '파트너 1 / 상대팀 2',
    score: '4-6',
    result: '패',
    court: '서울대 테니스장',
    memo: '네트 앞 발리 타이밍 늦음',
  },
  {
    id: 'sample-3',
    title: '랠리 연습',
    date: '2026-09-23',
    type: '연습',
    opponent: '',
    score: '',
    result: '연습',
    court: '서울대 테니스장',
    memo: '백핸드 크로스 100개',
  },
]

export function loadRecords(): TennisRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return SAMPLE_RECORDS
    const parsed = JSON.parse(raw) as TennisRecord[]
    return Array.isArray(parsed) ? parsed : SAMPLE_RECORDS
  } catch {
    return SAMPLE_RECORDS
  }
}

export function saveRecords(records: TennisRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(records))
  } catch {
    // 저장 공간이 막혀 있어도 화면은 계속 동작
  }
}

export function getStats(records: TennisRecord[]) {
  const matches = records.filter((r) => r.result !== '연습')
  const wins = matches.filter((r) => r.result === '승').length
  const losses = matches.length - wins
  const winRate = matches.length ? Math.round((wins / matches.length) * 100) : 0
  const recent = [...matches]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((r) => r.result)
  return {
    total: records.length,
    matches: matches.length,
    practices: records.length - matches.length,
    wins,
    losses,
    winRate,
    recent,
  }
}

// Notion DB 컬럼 순서 그대로 CSV로 내보내기 → Notion에서 Import(CSV)로 바로 병합 가능
const CSV_HEADER = ['제목', '날짜', '유형', '상대', '스코어', '결과', '코트', '메모']

function escapeCsv(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function toNotionCsv(records: TennisRecord[]) {
  const rows = records.map((r) =>
    [r.title, r.date, r.type, r.opponent, r.score, r.result, r.court, r.memo]
      .map(escapeCsv)
      .join(','),
  )
  return '﻿' + [CSV_HEADER.join(','), ...rows].join('\n')
}
