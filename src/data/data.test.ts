// 초안 데이터 sanity check — docs/specs/domain-data.md §6
import { describe, expect, it } from 'vitest'
import { haversineKm } from '../domain/geo'
import { CENTERS, getCenter } from './centers'
import { ROUTE } from './route'
import { SECTIONS, TOTAL_KM } from './sections'

describe('구간 (sections)', () => {
  it('구간 거리 합계가 633km ± 5km 이내이다', () => {
    expect(Math.abs(TOTAL_KM - 633)).toBeLessThanOrEqual(5)
  })

  it('order가 1부터 순서대로다', () => {
    expect(SECTIONS.map((s) => s.order)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('인증센터 (centers)', () => {
  it('ID가 중복되지 않는다', () => {
    expect(new Set(CENTERS.map((c) => c.id)).size).toBe(CENTERS.length)
  })

  it('모든 인증센터의 kmFromStart가 오름차순이다', () => {
    for (let i = 1; i < CENTERS.length; i++) {
      expect(CENTERS[i].kmFromStart).toBeGreaterThan(CENTERS[i - 1].kmFromStart)
    }
  })

  it('첫 센터는 0km, 마지막 센터는 전체 거리에 있다', () => {
    expect(CENTERS[0].kmFromStart).toBe(0)
    expect(CENTERS[CENTERS.length - 1].kmFromStart).toBe(TOTAL_KM)
  })

  it('모든 좌표가 한반도 범위(위도 34-38.5, 경도 126-129.5) 안에 있다', () => {
    for (const c of CENTERS) {
      expect(c.lat, c.name).toBeGreaterThanOrEqual(34)
      expect(c.lat, c.name).toBeLessThanOrEqual(38.5)
      expect(c.lng, c.name).toBeGreaterThanOrEqual(126)
      expect(c.lng, c.name).toBeLessThanOrEqual(129.5)
    }
  })

  it('인접한 센터 간 직선거리가 누적거리 차이보다 짧다', () => {
    for (let i = 1; i < CENTERS.length; i++) {
      const [a, b] = [CENTERS[i - 1], CENTERS[i]]
      expect(haversineKm(a, b), `${a.name} → ${b.name}`).toBeLessThan(
        b.kmFromStart - a.kmFromStart,
      )
    }
  })

  it('각 센터의 누적거리가 소속 구간 범위 안에 있다', () => {
    let start = 0
    for (const s of SECTIONS) {
      const end = start + s.distanceKm
      for (const c of CENTERS.filter((c) => c.sectionId === s.id)) {
        expect(c.kmFromStart, c.name).toBeGreaterThanOrEqual(start)
        expect(c.kmFromStart, c.name).toBeLessThanOrEqual(end)
      }
      start = end
    }
  })

  it('getCenter로 ID 조회가 된다', () => {
    expect(getCenter('ihwaryeong')?.name).toBe('이화령휴게소')
    expect(getCenter('nope')).toBeUndefined()
  })
})

describe('경로 (route)', () => {
  it('0km에서 시작해 전체 거리에서 끝나고, km가 오름차순이다', () => {
    expect(ROUTE[0].km).toBe(0)
    expect(ROUTE[ROUTE.length - 1].km).toBe(TOTAL_KM)
    for (let i = 1; i < ROUTE.length; i++) {
      expect(ROUTE[i].km).toBeGreaterThan(ROUTE[i - 1].km)
    }
  })

  it('인접 점 사이 직선거리가 km 차이보다 길지 않다', () => {
    for (let i = 1; i < ROUTE.length; i++) {
      const [a, b] = [ROUTE[i - 1], ROUTE[i]]
      expect(haversineKm(a, b)).toBeLessThanOrEqual(b.km - a.km)
    }
  })

  it('모든 인증센터가 같은 좌표·km의 경로 점으로 들어 있다', () => {
    for (const c of CENTERS) {
      const p = ROUTE.find((r) => r.km === c.kmFromStart)
      expect(p, c.name).toBeDefined()
      expect(p?.lat).toBe(c.lat)
      expect(p?.lng).toBe(c.lng)
      expect(p?.ele).toBe(c.elevationM)
    }
  })

  it('이화령(약 530m)이 경로 최고점이다', () => {
    const max = Math.max(...ROUTE.map((r) => r.ele))
    expect(max).toBe(getCenter('ihwaryeong')?.elevationM)
    expect(max).toBeGreaterThanOrEqual(500)
  })
})
