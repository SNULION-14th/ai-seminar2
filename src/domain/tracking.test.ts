import { describe, expect, it } from 'vitest'
import { CENTERS } from '../data/centers'
import { ROUTE } from '../data/route'
import type { CertCenter, TrackPoint } from './types'
import {
  AUTO_STAMP_RADIUS_KM,
  averageSpeedKmh,
  currentSpeedKmh,
  MAX_ACCURACY_M,
  MIN_SAMPLE_DISTANCE_M,
  movingTimeSec,
  nearbyUnstampedCenter,
  offRouteDurationSec,
  planPaceDiffKm,
  sampleTrackPoint,
  shouldAcceptPoint,
  splitTrackByGaps,
  trackDistanceKm,
} from './tracking'

const BASE = { lat: 37.5, lng: 127, t: 0 }

describe('shouldAcceptPoint', () => {
  it('정확도가 MAX_ACCURACY_M을 넘으면 버린다', () => {
    expect(shouldAcceptPoint({ ...BASE, acc: MAX_ACCURACY_M + 1 }, null)).toBe(false)
  })

  it('정확도가 MAX_ACCURACY_M 이하면 받아들인다(직전 점 없음)', () => {
    expect(shouldAcceptPoint({ ...BASE, acc: MAX_ACCURACY_M }, null)).toBe(true)
  })

  it('직전 점과 10m 미만이면 버린다', () => {
    const last: TrackPoint = { lat: 37.5, lng: 127, t: 0 }
    // 위도 0.00005도 ≈ 5.5m
    const candidate = { lat: 37.50005, lng: 127, t: 1000 }
    expect(shouldAcceptPoint(candidate, last)).toBe(false)
  })

  it('직전 점과 10m 이상이면 받아들인다', () => {
    const last: TrackPoint = { lat: 37.5, lng: 127, t: 0 }
    // 위도 0.0002도 ≈ 22m
    const candidate = { lat: 37.5002, lng: 127, t: 1000 }
    expect(shouldAcceptPoint(candidate, last)).toBe(true)
  })
})

describe('sampleTrackPoint', () => {
  it('정확도 100m짜리 점은 궤적에 기록되지 않는다', () => {
    const track: TrackPoint[] = []
    const next = sampleTrackPoint(track, { ...BASE, acc: 100 })
    expect(next).toEqual(track)
    expect(next).toHaveLength(0)
  })

  it('유효한 첫 점은 그대로 기록된다', () => {
    const track: TrackPoint[] = []
    const next = sampleTrackPoint(track, { ...BASE, acc: 10 })
    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({ lat: BASE.lat, lng: BASE.lng, t: BASE.t, acc: 10 })
  })

  it('직전 점과 너무 가까우면 원래 배열을 그대로 돌려준다(불변 유지)', () => {
    const track: TrackPoint[] = [{ lat: 37.5, lng: 127, t: 0 }]
    const next = sampleTrackPoint(track, { lat: 37.500001, lng: 127, t: 1000 })
    expect(next).toBe(track)
  })

  it(`직전 점과 ${MIN_SAMPLE_DISTANCE_M}m 이상 떨어지면 새 배열에 추가된다`, () => {
    const track: TrackPoint[] = [{ lat: 37.5, lng: 127, t: 0 }]
    const next = sampleTrackPoint(track, { lat: 37.5005, lng: 127, t: 1000 })
    expect(next).toHaveLength(2)
    expect(next).not.toBe(track)
  })
})

describe('trackDistanceKm', () => {
  it('점이 0-1개면 0이다', () => {
    expect(trackDistanceKm([])).toBe(0)
    expect(trackDistanceKm([{ lat: 37.5, lng: 127, t: 0 }])).toBe(0)
  })

  it('위도 1도 떨어진 두 점은 약 111km다', () => {
    const track: TrackPoint[] = [
      { lat: 36, lng: 128, t: 0 },
      { lat: 37, lng: 128, t: 1000 },
    ]
    expect(trackDistanceKm(track)).toBeCloseTo(111.2, 0)
  })
})

describe('movingTimeSec / currentSpeedKmh / averageSpeedKmh', () => {
  it('시속 20km로 10초간 이동한 구간은 이동 시간에 포함된다', () => {
    // 20km/h ≈ 0.0556km / 10초. 경도 방향 이동으로 근사.
    const a = { lat: 37.5, lng: 127, t: 0 }
    const distanceDeg = 0.0556 / (111.32 * Math.cos((37.5 * Math.PI) / 180))
    const b = { lat: 37.5, lng: 127 + distanceDeg, t: 10_000 }
    const track: TrackPoint[] = [a, b]
    expect(movingTimeSec(track)).toBeCloseTo(10, 0)
    expect(currentSpeedKmh(track)).toBeCloseTo(20, 0)
    expect(averageSpeedKmh(trackDistanceKm(track), movingTimeSec(track))).toBeCloseTo(20, 0)
  })

  it('제자리(정지)면 이동 시간에서 빠진다', () => {
    const track: TrackPoint[] = [
      { lat: 37.5, lng: 127, t: 0 },
      { lat: 37.5, lng: 127, t: 10_000 },
    ]
    expect(movingTimeSec(track)).toBe(0)
  })

  it('점이 없거나 1개면 속도/이동시간은 0이다', () => {
    expect(currentSpeedKmh([])).toBe(0)
    expect(currentSpeedKmh([{ lat: 37.5, lng: 127, t: 0 }])).toBe(0)
    expect(movingTimeSec([])).toBe(0)
    expect(averageSpeedKmh(10, 0)).toBe(0)
  })
})

describe('splitTrackByGaps', () => {
  it('빈 궤적은 빈 배열이다', () => {
    expect(splitTrackByGaps([])).toEqual([])
  })

  it('끊김이 없으면 한 조각이다', () => {
    const track: TrackPoint[] = [
      { lat: 37.5, lng: 127, t: 0 },
      { lat: 37.501, lng: 127, t: 10_000 },
      { lat: 37.502, lng: 127, t: 20_000 },
    ]
    expect(splitTrackByGaps(track)).toHaveLength(1)
    expect(splitTrackByGaps(track)[0]).toHaveLength(3)
  })

  it('61초 이상 끊기면 조각이 나뉜다', () => {
    const track: TrackPoint[] = [
      { lat: 37.5, lng: 127, t: 0 },
      { lat: 37.501, lng: 127, t: 10_000 },
      { lat: 37.502, lng: 127, t: 10_000 + 61_000 },
    ]
    const segments = splitTrackByGaps(track)
    expect(segments).toHaveLength(2)
    expect(segments[0]).toHaveLength(2)
    expect(segments[1]).toHaveLength(1)
  })
})

describe('offRouteDurationSec', () => {
  const onRoute = ROUTE[20]
  // 여의도(경로 점)에서 정북으로 약 1.1km — snapToRoute 테스트와 같은 기법
  const yeouido = CENTERS.find((c) => c.id === 'yeouido')!
  const offRoutePoint = { lat: yeouido.lat + 0.01, lng: yeouido.lng }

  it('궤적이 비어 있으면 0이다', () => {
    expect(offRouteDurationSec([])).toBe(0)
  })

  it('경로 위에 있으면 0이다', () => {
    const track: TrackPoint[] = [{ lat: onRoute.lat, lng: onRoute.lng, t: 0 }]
    expect(offRouteDurationSec(track)).toBe(0)
  })

  it('경로를 벗어난 뒤 지난 시간(초)을 돌려준다', () => {
    const track: TrackPoint[] = [
      { lat: onRoute.lat, lng: onRoute.lng, t: 0 },
      { ...offRoutePoint, t: 5_000 },
      { ...offRoutePoint, t: 20_000 },
    ]
    expect(offRouteDurationSec(track)).toBeCloseTo(15, 0)
  })

  it('경로로 돌아오면 다시 0이다', () => {
    const track: TrackPoint[] = [
      { ...offRoutePoint, t: 0 },
      { ...offRoutePoint, t: 40_000 },
      { lat: onRoute.lat, lng: onRoute.lng, t: 50_000 },
    ]
    expect(offRouteDurationSec(track)).toBe(0)
  })
})

describe('nearbyUnstampedCenter', () => {
  const ihwaryeong = CENTERS.find((c) => c.id === 'ihwaryeong')!

  it('자동 도장 반경은 150m다', () => {
    expect(AUTO_STAMP_RADIUS_KM).toBeCloseTo(0.15, 5)
  })

  it('반경 150m 안이면 그 센터를 돌려준다', () => {
    const found = nearbyUnstampedCenter({ lat: ihwaryeong.lat, lng: ihwaryeong.lng }, new Set())
    expect(found?.id).toBe('ihwaryeong')
  })

  it('반경 밖이면 null이다', () => {
    // 위도 0.01도 ≈ 1.1km, AUTO_STAMP_RADIUS_KM(0.15km)보다 훨씬 멀다
    const found = nearbyUnstampedCenter({ lat: ihwaryeong.lat + 0.01, lng: ihwaryeong.lng }, new Set())
    expect(found).toBeNull()
  })

  it('이미 찍은 센터는 반경 안이어도 무시한다', () => {
    const found = nearbyUnstampedCenter(
      { lat: ihwaryeong.lat, lng: ihwaryeong.lng },
      new Set(['ihwaryeong']),
    )
    expect(found).toBeNull()
  })

  it('여러 후보가 반경 안이면 가장 가까운 곳을 돌려준다', () => {
    const base = { lat: 37.0, lng: 127.5 }
    const near: CertCenter = { ...ihwaryeong, id: 'near', lat: base.lat + 0.0003, lng: base.lng }
    const far: CertCenter = { ...ihwaryeong, id: 'far', lat: base.lat + 0.001, lng: base.lng }
    const found = nearbyUnstampedCenter(base, new Set(), [near, far])
    expect(found?.id).toBe('near')
  })
})

describe('planPaceDiffKm', () => {
  it('시작하자마자(0시간)면 예상 거리는 0이라 탄 거리가 그대로 차이가 된다', () => {
    expect(planPaceDiffKm(5, 100, 0)).toBe(5)
  })

  it('가정한 라이딩 시간을 다 채우면 예상 거리는 계획 전체 거리로 멈춘다', () => {
    expect(planPaceDiffKm(50, 90, 100)).toBeCloseTo(-40, 5)
  })

  it('페이스대로면 차이가 0에 가깝다', () => {
    // 6시간 가정, 3시간 지났으면 계획의 절반쯤 탔어야 한다
    expect(planPaceDiffKm(45, 90, 3)).toBeCloseTo(0, 5)
  })

  it('음수 경과 시간은 0시간처럼 취급한다', () => {
    expect(planPaceDiffKm(3, 90, -1)).toBe(3)
  })
})
