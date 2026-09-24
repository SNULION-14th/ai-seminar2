import { describe, expect, it } from 'vitest'
import { CENTERS } from '../data/centers'
import { TOTAL_KM } from '../data/sections'
import { progress } from './progress'
import type { Ride, Stamp } from './types'

const stamp = (centerId: string): Stamp => ({
  centerId,
  stampedAt: '2026-10-03T09:00:00+09:00',
  method: 'manual',
})

const ride = (distanceKm: number): Ride => ({
  id: `r-${distanceKm}`,
  startedAt: '2026-10-03T08:00:00+09:00',
  track: [],
  distanceKm,
  movingTimeSec: 3600,
  source: 'simulated',
})

describe('progress', () => {
  it('기록이 없으면 0이다', () => {
    expect(progress([], [])).toEqual({
      percent: 0,
      stampCount: 0,
      totalCenters: CENTERS.length,
      distanceKm: 0,
    })
  })

  it('모든 센터를 찍으면 100%다', () => {
    const result = progress(CENTERS.map((c) => stamp(c.id)), [])
    expect(result.percent).toBe(100)
    expect(result.stampCount).toBe(CENTERS.length)
  })

  it('찍은 센터의 직전 구간 거리만큼 오른다', () => {
    // 아라한강갑문(21km): 아라서해갑문 → 아라한강갑문 21km
    const result = progress([stamp('ara-west'), stamp('ara-hangang')], [])
    expect(result.percent).toBeCloseTo((21 / TOTAL_KM) * 100)
  })

  it('중복 도장과 모르는 ID는 세지 않는다', () => {
    const result = progress([stamp('yeouido'), stamp('yeouido'), stamp('unknown')], [])
    expect(result.stampCount).toBe(1)
  })

  it('라이드 거리를 모두 더한다', () => {
    expect(progress([], [ride(80.5), ride(110)]).distanceKm).toBeCloseTo(190.5)
  })
})
