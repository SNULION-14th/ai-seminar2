// 공용 컴포넌트의 순수 계산 테스트 (DS-01, DS-02, DS-05, DS-06)
import { describe, expect, it } from 'vitest'
import { CENTERS } from '../data/centers'
import { ROUTE } from '../data/route'
import { nearestStopIndex, ratioToKm } from './pebble'
import { pointAtRatio, projectRoute, slicePointsToKm } from './river'
import { eleCeiling, kmToRatio, nearestCenter, sampleProfile, silhouettePath, smooth } from './ridge'
import { skyPhaseOf } from './sky'

const at = (h: number, m = 0) => new Date(2026, 8, 24, h, m)

describe('skyPhaseOf (DS-05)', () => {
  it('시각 경계대로 새벽/낮/노을/밤을 나눈다', () => {
    expect(skyPhaseOf(at(4, 59))).toBe('night')
    expect(skyPhaseOf(at(5))).toBe('dawn')
    expect(skyPhaseOf(at(6, 59))).toBe('dawn')
    expect(skyPhaseOf(at(7))).toBe('day')
    expect(skyPhaseOf(at(16, 59))).toBe('day')
    expect(skyPhaseOf(at(17))).toBe('dusk')
    expect(skyPhaseOf(at(19, 29))).toBe('dusk')
    expect(skyPhaseOf(at(19, 30))).toBe('night')
    expect(skyPhaseOf(at(0))).toBe('night')
  })
})

describe('ridge (DS-02)', () => {
  it('구간 샘플은 range 양 끝을 포함하고 이화령 부근이 가장 높다', () => {
    const s = sampleProfile(ROUTE, [0, ROUTE[ROUTE.length - 1].km], 200)
    expect(s).toHaveLength(201)
    expect(s[0].km).toBe(0)
    const top = s.reduce((a, b) => (b.ele > a.ele ? b : a))
    expect(top.km).toBeGreaterThan(240)
    expect(top.km).toBeLessThan(270)
    expect(eleCeiling(s)).toBeGreaterThan(top.ele)
  })

  it('평지 구간도 고도 축이 60m 아래로 내려가지 않는다', () => {
    expect(eleCeiling(sampleProfile(ROUTE, [0, 21], 10))).toBe(60)
  })

  it('smooth는 길이를 유지하고 값을 평균낸다', () => {
    expect(smooth([0, 10, 0], 1)).toEqual([5, 10 / 3, 5])
  })

  it('silhouettePath는 바닥에서 시작해 닫힌다', () => {
    const d = silhouettePath([0, 1, 0.5], 100, 50)
    expect(d.startsWith('M0 50 L0 50.0')).toBe(true)
    expect(d).toContain('L50.0 0.0')
    expect(d.endsWith('L100 50 Z')).toBe(true)
  })

  it('nearestCenter와 kmToRatio', () => {
    expect(nearestCenter(255, CENTERS)?.center.id).toBe('ihwaryeong')
    expect(nearestCenter(0, [])).toBeNull()
    expect(kmToRatio(50, [0, 100])).toBe(0.5)
    expect(kmToRatio(-5, [0, 100])).toBe(0)
    expect(kmToRatio(500, [0, 100])).toBe(1)
  })
})

describe('pebble (DS-06)', () => {
  const stops = [
    { id: 'a', km: 100 },
    { id: 'b', km: 124 },
    { id: 'c', km: 139 },
  ]
  it('가장 가까운 stop으로 스냅한다', () => {
    expect(nearestStopIndex(0, stops)).toBe(0)
    expect(nearestStopIndex(120, stops)).toBe(1)
    expect(nearestStopIndex(133, stops)).toBe(2)
    expect(nearestStopIndex(10, [])).toBe(-1)
  })
  it('비율을 km로 바꾸고 범위를 자른다', () => {
    expect(ratioToKm(0.5, [100, 200])).toBe(150)
    expect(ratioToKm(2, [100, 200])).toBe(200)
  })
})

describe('river (DS-01)', () => {
  const r = projectRoute(ROUTE, 300, 400)
  it('상자 안에 들어오고 인천이 부산보다 위(북쪽)에 있다', () => {
    for (const p of r.points) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(300)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(400)
    }
    expect(r.points[0].y).toBeLessThan(r.points[r.points.length - 1].y)
  })
  it('pointAtRatio 양 끝은 출발/도착 km', () => {
    expect(pointAtRatio(r, 0).km).toBe(0)
    expect(pointAtRatio(r, 1).km).toBeCloseTo(ROUTE[ROUTE.length - 1].km)
    const mid = pointAtRatio(r, 0.5).km
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(ROUTE[ROUTE.length - 1].km)
  })
  it('slicePointsToKm은 km 지점에서 끝난다', () => {
    expect(slicePointsToKm(r, 0)).toEqual([])
    const part = slicePointsToKm(r, 30)
    expect(part.length).toBeGreaterThan(1)
    expect(part.length).toBeLessThan(r.points.length)
  })
})
