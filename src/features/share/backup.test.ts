import { describe, expect, it } from 'vitest'
import type { Ride, Stamp, TripPlan } from '../../domain/types'
import { buildBackup, parseBackup } from './backup'

const plan: TripPlan = {
  id: 'p1',
  startDate: '2026-10-03',
  days: [
    {
      dayIndex: 1,
      date: '2026-10-03',
      fromCenterId: 'ara-west',
      toCenterId: 'neungnae',
      distanceKm: 80,
      climbM: 100,
      stayTown: '남양주',
    },
  ],
  pace: 'normal',
  createdAt: '2026-09-24T00:00:00+09:00',
  checklist: { helmet: true },
}

const stamps: Stamp[] = [{ centerId: 'ara-west', stampedAt: '2026-10-03T09:00:00+09:00', method: 'manual' }]

const rides: Ride[] = [
  {
    id: 'r1',
    startedAt: '2026-10-03T08:00:00+09:00',
    track: [{ lat: 37.5, lng: 126.7, t: 0 }],
    distanceKm: 61,
    movingTimeSec: 18000,
    source: 'simulated',
  },
]

describe('buildBackup / parseBackup 라운드트립', () => {
  it('내보낸 백업을 그대로 다시 읽을 수 있다', () => {
    const backup = buildBackup({ plan, stamps, rides })
    const parsed = parseBackup(JSON.parse(JSON.stringify(backup)))
    expect(parsed).toEqual(backup)
  })

  it('계획이 없어도(null) 유효하다', () => {
    const backup = buildBackup({ plan: null, stamps: [], rides: [] })
    expect(parseBackup(backup)).toEqual(backup)
  })
})

describe('parseBackup', () => {
  it('스키마에 맞지 않는 값은 null이다', () => {
    expect(parseBackup({ v: 1 })).toBeNull()
    expect(parseBackup(null)).toBeNull()
    expect(parseBackup('아무 문자열')).toBeNull()
    expect(parseBackup({ v: 2, exportedAt: 'x', plan: null, stamps: [], rides: [] })).toBeNull()
  })
})
