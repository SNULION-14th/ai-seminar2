// 지리 계산 순수 함수 — docs/specs/domain-data.md §5
// React·DOM·브라우저 API를 import하지 않는다.
import { CENTERS } from '../data/centers'
import { ROUTE } from '../data/route'
import type { CertCenter, LatLng, NextCenter, RoutePoint, RouteSnap } from './types'

export const EARTH_RADIUS_KM = 6371.0088

/** 경로에서 이만큼(km) 넘게 벗어나면 offRoute로 본다 (domain-data.md §5, TRK-05) */
export const OFF_ROUTE_THRESHOLD_KM = 0.3

const toRad = (deg: number) => (deg * Math.PI) / 180

/** 두 좌표 사이 대원 거리(km) */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * GPS 좌표를 경로상 가장 가까운 지점으로 투영하고 그 지점의 누적 km를 돌려준다.
 * 선분 투영은 짧은 구간이라 등장방형(equirectangular) 근사로 계산한다.
 */
export function snapToRoute(point: LatLng, route: readonly RoutePoint[] = ROUTE): RouteSnap {
  if (route.length === 0) throw new Error('snapToRoute: 경로가 비어 있어요')

  const cosLat = Math.cos(toRad(point.lat))
  let best: RouteSnap | null = null

  for (let i = 0; i < Math.max(1, route.length - 1); i++) {
    const a = route[i]
    const b = route[Math.min(i + 1, route.length - 1)]
    const abx = (b.lng - a.lng) * cosLat
    const aby = b.lat - a.lat
    const apx = (point.lng - a.lng) * cosLat
    const apy = point.lat - a.lat
    const len2 = abx * abx + aby * aby
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / len2))

    const lat = a.lat + t * (b.lat - a.lat)
    const lng = a.lng + t * (b.lng - a.lng)
    const offsetKm = haversineKm(point, { lat, lng })
    if (best === null || offsetKm < best.offsetKm) {
      best = { km: a.km + t * (b.km - a.km), lat, lng, offsetKm, offRoute: false }
    }
  }

  const snap = best as RouteSnap
  snap.offRoute = snap.offsetKm > OFF_ROUTE_THRESHOLD_KM
  return snap
}

/**
 * 누적 km 지점의 좌표와 고도를 경로 점 사이 선형 보간으로 구한다.
 * 범위를 벗어난 km는 경로 처음/끝으로 자른다. (시뮬레이터 TRK-10, 고도 프로필 DS-02용)
 */
export function pointAtKm(km: number, route: readonly RoutePoint[] = ROUTE): RoutePoint {
  if (route.length === 0) throw new Error('pointAtKm: 경로가 비어 있어요')
  const first = route[0]
  const last = route[route.length - 1]
  if (km <= first.km) return { ...first }
  if (km >= last.km) return { ...last }

  let i = 1
  while (route[i].km < km) i++
  const a = route[i - 1]
  const b = route[i]
  const t = b.km === a.km ? 0 : (km - a.km) / (b.km - a.km)
  return {
    lat: a.lat + t * (b.lat - a.lat),
    lng: a.lng + t * (b.lng - a.lng),
    km,
    ele: a.ele + t * (b.ele - a.ele),
  }
}

/**
 * 현재 누적 km 기준 다음 인증센터와 남은 거리.
 * 센터 위치와 같은 km이면 그 센터를 돌려준다(남은 거리 0). 마지막 센터를 지나면 null.
 */
export function nextCenter(
  km: number,
  centers: readonly CertCenter[] = CENTERS,
): NextCenter | null {
  const center = centers.find((c) => c.kmFromStart >= km)
  return center ? { center, remainingKm: center.kmFromStart - km } : null
}
