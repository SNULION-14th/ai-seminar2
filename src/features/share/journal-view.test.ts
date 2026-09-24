import { describe, expect, it } from 'vitest'
import { CENTERS } from '../../data/centers'
import type { Ride } from '../../domain/types'
import { concatRideTracks, formatMovingTime, formatPeriod, furthestStampedKm, groupRidesByDay } from './journal-view'

describe('furthestStampedKm', () => {
  it('찍은 도장이 없으면 0이다', () => {
    expect(furthestStampedKm(new Set())).toBe(0)
  })

  it('가장 멀리 찍은 센터의 km를 돌려준다(순서 무관)', () => {
    const [first, second, third] = CENTERS
    expect(furthestStampedKm(new Set([third.id, first.id]))).toBe(third.kmFromStart)
    expect(furthestStampedKm(new Set([first.id, second.id]))).toBe(second.kmFromStart)
  })
})

describe('formatMovingTime', () => {
  it('1시간 미만이면 분만 보여 준다', () => {
    expect(formatMovingTime(42 * 60)).toBe('42분')
  })

  it('정확히 시간 단위면 분을 생략한다', () => {
    expect(formatMovingTime(3 * 3600)).toBe('3시간')
  })

  it('시간과 분을 함께 보여 준다', () => {
    expect(formatMovingTime(3 * 3600 + 12 * 60)).toBe('3시간 12분')
  })
})

const ride = (overrides: Partial<Ride>): Ride => ({
  id: overrides.id ?? 'r',
  startedAt: '2026-10-03T08:00:00+09:00',
  track: [],
  distanceKm: 10,
  movingTimeSec: 3600,
  source: 'simulated',
  ...overrides,
})

describe('groupRidesByDay', () => {
  it('같은 날짜의 라이드는 거리를 합친다', () => {
    const rides = [
      ride({ id: 'a', startedAt: '2026-10-03T08:00:00+09:00', distanceKm: 40 }),
      ride({ id: 'b', startedAt: '2026-10-03T14:00:00+09:00', distanceKm: 21 }),
      ride({ id: 'c', startedAt: '2026-10-04T08:00:00+09:00', distanceKm: 19 }),
    ]
    expect(groupRidesByDay(rides)).toEqual([
      { date: '2026-10-03', distanceKm: 61 },
      { date: '2026-10-04', distanceKm: 19 },
    ])
  })

  it('라이드가 없으면 빈 배열이다', () => {
    expect(groupRidesByDay([])).toEqual([])
  })
})

describe('concatRideTracks', () => {
  it('라이드를 시작 시각순으로 이어 붙인다', () => {
    const rides = [
      ride({
        id: 'later',
        startedAt: '2026-10-04T08:00:00+09:00',
        track: [{ lat: 3, lng: 3, t: 0 }],
      }),
      ride({
        id: 'earlier',
        startedAt: '2026-10-03T08:00:00+09:00',
        track: [
          { lat: 1, lng: 1, t: 0 },
          { lat: 2, lng: 2, t: 1 },
        ],
      }),
    ]
    expect(concatRideTracks(rides)).toEqual([
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
      { lat: 3, lng: 3 },
    ])
  })
})

describe('formatPeriod', () => {
  it('날짜가 없으면 null이다', () => {
    expect(formatPeriod([])).toBeNull()
  })

  it('하루뿐이면 그 날짜만 보여 준다', () => {
    expect(formatPeriod(['2026-10-03'])).toBe(formatJournalDateForTest('2026-10-03'))
  })

  it('여러 날이면 처음과 끝을 이어 준다', () => {
    expect(formatPeriod(['2026-10-05', '2026-10-03', '2026-10-04'])).toBe(
      `${formatJournalDateForTest('2026-10-03')} ~ ${formatJournalDateForTest('2026-10-05')}`,
    )
  })
})

function formatJournalDateForTest(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(
    new Date(iso),
  )
}
