import { describe, expect, it } from 'vitest'
import { CENTERS } from '../data/centers'
import { ROUTE } from '../data/route'
import { TOTAL_KM } from '../data/sections'
import { haversineKm, nextCenter, OFF_ROUTE_THRESHOLD_KM, pointAtKm, snapToRoute } from './geo'

describe('haversineKm', () => {
  it('같은 점이면 0이다', () => {
    expect(haversineKm({ lat: 37.5, lng: 127 }, { lat: 37.5, lng: 127 })).toBe(0)
  })

  it('서울시청 → 부산시청은 약 325km다', () => {
    const d = haversineKm({ lat: 37.5663, lng: 126.9779 }, { lat: 35.1798, lng: 129.075 })
    expect(d).toBeGreaterThan(320)
    expect(d).toBeLessThan(330)
  })

  it('위도 1도는 약 111km다', () => {
    expect(haversineKm({ lat: 36, lng: 128 }, { lat: 37, lng: 128 })).toBeCloseTo(111.2, 0)
  })
})

describe('snapToRoute', () => {
  it('경로 점 위 좌표는 오차 0.5km 이내의 km를 돌려준다', () => {
    for (const p of ROUTE) {
      const snap = snapToRoute(p)
      expect(Math.abs(snap.km - p.km), `km ${p.km}`).toBeLessThanOrEqual(0.5)
      expect(snap.offRoute).toBe(false)
    }
  })

  it('경로 선분 중간 좌표도 오차 0.5km 이내다', () => {
    for (let i = 1; i < ROUTE.length; i++) {
      const [a, b] = [ROUTE[i - 1], ROUTE[i]]
      for (const t of [0.25, 0.5, 0.75]) {
        const point = { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) }
        const expected = a.km + t * (b.km - a.km)
        const snap = snapToRoute(point)
        expect(Math.abs(snap.km - expected), `km ${expected}`).toBeLessThanOrEqual(0.5)
        expect(snap.offRoute).toBe(false)
      }
    }
  })

  it('경로에서 300m 넘게 벗어나면 offRoute가 true다', () => {
    // 여의도(경로 점)에서 정북으로 약 1.1km
    const yeouido = CENTERS.find((c) => c.id === 'yeouido')!
    const snap = snapToRoute({ lat: yeouido.lat + 0.01, lng: yeouido.lng })
    expect(snap.offsetKm).toBeGreaterThan(OFF_ROUTE_THRESHOLD_KM)
    expect(snap.offRoute).toBe(true)
  })

  it('경로에서 100m 안쪽이면 offRoute가 false다', () => {
    const a = ROUTE[20]
    const snap = snapToRoute({ lat: a.lat + 0.0005, lng: a.lng })
    expect(snap.offsetKm).toBeLessThan(0.1)
    expect(snap.offRoute).toBe(false)
  })

  it('빈 경로면 에러를 던진다', () => {
    expect(() => snapToRoute({ lat: 37, lng: 127 }, [])).toThrow()
  })
})

describe('pointAtKm', () => {
  it('경로 점 km에서는 그 점을 돌려준다', () => {
    const p = ROUTE[10]
    expect(pointAtKm(p.km)).toEqual(p)
  })

  it('범위 밖 km는 처음/끝으로 자른다', () => {
    expect(pointAtKm(-10).km).toBe(0)
    expect(pointAtKm(TOTAL_KM + 50).km).toBe(TOTAL_KM)
  })

  it('보간한 좌표를 다시 투영하면 같은 km가 나온다', () => {
    for (const km of [5, 100, 250, 400, 600]) {
      expect(Math.abs(snapToRoute(pointAtKm(km)).km - km)).toBeLessThanOrEqual(0.5)
    }
  })
})

describe('nextCenter', () => {
  it('출발점에서는 첫 센터(남은 거리 0)를 돌려준다', () => {
    expect(nextCenter(0)).toEqual({ center: CENTERS[0], remainingKm: 0 })
  })

  it('수안보온천을 지나면 다음 센터는 이화령휴게소다', () => {
    const next = nextCenter(240)
    expect(next?.center.id).toBe('ihwaryeong')
    expect(next?.remainingKm).toBeCloseTo(16)
  })

  it('마지막 센터를 지나면 null이다', () => {
    expect(nextCenter(TOTAL_KM + 1)).toBeNull()
  })
})
