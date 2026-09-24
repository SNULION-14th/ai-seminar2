import { describe, expect, it } from 'vitest'
import { CENTERS } from '../data/centers'
import { TOTAL_KM } from '../data/sections'
import type { DayPlan } from './types'
import { adjustDayBoundary, dayHasMountainPass, PACE_DAILY_KM, splitItinerary } from './itinerary'

const centerIds = new Set(CENTERS.map((c) => c.id))

describe('splitItinerary', () => {
  it('출발일 + 4일 + normal이면 DAY1~4가 만들어지고 거리 합이 전체 경로 거리와 같다 (PLAN-02)', () => {
    const { days } = splitItinerary({
      startDate: '2026-10-03',
      pace: 'normal',
      mode: 'days',
      days: 4,
    })

    expect(days).toHaveLength(4)
    expect(days.map((d) => d.dayIndex)).toEqual([1, 2, 3, 4])
    const sum = days.reduce((s, d) => s + d.distanceKm, 0)
    expect(sum).toBeCloseTo(TOTAL_KM, 0)
    expect(days[days.length - 1].toCenterId).toBe(CENTERS[CENTERS.length - 1].id)
  })

  it('모든 DayPlan의 도착점이 인증센터 ID다', () => {
    const { days } = splitItinerary({
      startDate: '2026-10-03',
      pace: 'normal',
      mode: 'days',
      days: 4,
    })
    for (const d of days) {
      expect(centerIds.has(d.toCenterId)).toBe(true)
      expect(centerIds.has(d.fromCenterId)).toBe(true)
    }
  })

  it('날짜는 출발일부터 하루씩 늘어난다', () => {
    const { days } = splitItinerary({
      startDate: '2026-10-03',
      pace: 'normal',
      mode: 'days',
      days: 3,
    })
    expect(days.map((d) => d.date)).toEqual(['2026-10-03', '2026-10-04', '2026-10-05'])
  })

  it('이화령휴게소를 지나는 날에는 고개 표시가 된다', () => {
    const { days } = splitItinerary({
      startDate: '2026-10-03',
      pace: 'normal',
      mode: 'days',
      days: 4,
    })
    const ihwaryeong = CENTERS.find((c) => c.id === 'ihwaryeong')!
    const passDay = days.find((d) => {
      const from = CENTERS.find((c) => c.id === d.fromCenterId)!
      const to = CENTERS.find((c) => c.id === d.toCenterId)!
      return from.kmFromStart <= ihwaryeong.kmFromStart && ihwaryeong.kmFromStart <= to.kmFromStart
    })
    expect(passDay).toBeDefined()
    expect(dayHasMountainPass(passDay!)).toBe(true)
  })

  it('평지만 지나는 날은 고개 표시가 안 된다', () => {
    expect(dayHasMountainPass({ fromCenterId: 'ara-west', toCenterId: 'yeouido' })).toBe(false)
  })

  it('1일처럼 비현실적으로 짧게 잡으면 안내 문구를 보여주지만 생성은 허용한다', () => {
    const { days, warnings } = splitItinerary({
      startDate: '2026-10-03',
      pace: 'normal',
      mode: 'days',
      days: 1,
    })
    expect(days).toHaveLength(1)
    expect(days[0].distanceKm).toBeCloseTo(TOTAL_KM, 0)
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('20일처럼 비현실적으로 길게 잡아도 안내 문구를 보여주고 생성은 허용한다', () => {
    const { days, warnings } = splitItinerary({
      startDate: '2026-10-03',
      pace: 'normal',
      mode: 'days',
      days: 20,
    })
    expect(days).toHaveLength(20)
    const sum = days.reduce((s, d) => s + d.distanceKm, 0)
    expect(sum).toBeCloseTo(TOTAL_KM, 0)
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('dailyDistance 모드는 pace 기준 거리를 써서 날짜 수를 스스로 정한다', () => {
    const { days } = splitItinerary({
      startDate: '2026-10-03',
      pace: 'relaxed',
      mode: 'dailyDistance',
    })
    expect(days.length).toBeGreaterThan(1)
    for (const d of days.slice(0, -1)) {
      expect(d.distanceKm).toBeLessThanOrEqual(PACE_DAILY_KM.relaxed * 1.2)
    }
    const sum = days.reduce((s, d) => s + d.distanceKm, 0)
    expect(sum).toBeCloseTo(TOTAL_KM, 0)
  })

  it('부분 계획(PLAN-06): 시작/끝 인증센터를 지정하면 그 구간만 나눈다', () => {
    const { days } = splitItinerary({
      startDate: '2026-10-03',
      pace: 'normal',
      mode: 'days',
      days: 1,
      startCenterId: 'ihwaryeong',
      endCenterId: 'sangpung',
    })
    expect(days).toHaveLength(1)
    expect(days[0].fromCenterId).toBe('ihwaryeong')
    expect(days[0].toCenterId).toBe('sangpung')
    const ihwaryeong = CENTERS.find((c) => c.id === 'ihwaryeong')!
    const sangpung = CENTERS.find((c) => c.id === 'sangpung')!
    expect(days[0].distanceKm).toBeCloseTo(sangpung.kmFromStart - ihwaryeong.kmFromStart, 0)
  })

  it('끝 지점이 시작 지점보다 앞이면 에러를 던진다', () => {
    expect(() =>
      splitItinerary({
        startDate: '2026-10-03',
        pace: 'normal',
        mode: 'days',
        days: 1,
        startCenterId: 'sangpung',
        endCenterId: 'ihwaryeong',
      }),
    ).toThrow()
  })
})

describe('adjustDayBoundary', () => {
  // 아라서해갑문(0km) → 여의도(42km) → 광나루(61km)
  const days: DayPlan[] = [
    {
      dayIndex: 1,
      date: '2026-10-03',
      fromCenterId: 'ara-west',
      toCenterId: 'yeouido',
      distanceKm: 42,
      climbM: 10,
      stayTown: '서울',
    },
    {
      dayIndex: 2,
      date: '2026-10-04',
      fromCenterId: 'yeouido',
      toCenterId: 'gwangnaru',
      distanceKm: 19,
      climbM: 5,
    },
  ]

  it('경계를 옮기면 두 날의 거리만 바뀌고 합계는 그대로다 (PLAN-05)', () => {
    const before = days.reduce((sum, d) => sum + d.distanceKm, 0)
    // 아라한강갑문(21km)은 두 경계(0km, 61km) 사이에 있다
    const updated = adjustDayBoundary(days, 0, 'ara-hangang')
    const after = updated.reduce((sum, d) => sum + d.distanceKm, 0)

    expect(after).toBeCloseTo(before, 5)
    expect(updated[0].toCenterId).toBe('ara-hangang')
    expect(updated[1].fromCenterId).toBe('ara-hangang')
    expect(updated[0].distanceKm).toBeCloseTo(21, 5)
    expect(updated[1].distanceKm).toBeCloseTo(40, 5)
    // 건드리지 않은 필드는 그대로다
    expect(updated[1].dayIndex).toBe(2)
    expect(updated[1].date).toBe('2026-10-04')
  })

  it('경계 앞뒤 범위를 벗어난 센터로는 옮길 수 없다', () => {
    // 상주보(322km)는 이 경계의 범위(0~61km) 밖이다
    expect(() => adjustDayBoundary(days, 0, 'sangjubo')).toThrow()
  })

  it('마지막 날은 경계가 아니라서 옮길 수 없다', () => {
    expect(() => adjustDayBoundary(days, 1, 'ara-hangang')).toThrow()
  })
})
