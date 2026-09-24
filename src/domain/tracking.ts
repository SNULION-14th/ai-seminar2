// GPS 점 필터링·샘플링, 실시간 지표 순수 함수 — docs/specs/domain-data.md, TRK-02, TRK-03, TRK-05, TRK-06, TRK-07, TRK-12
// React·DOM·브라우저 API를 import하지 않는다.
import { CENTERS } from '../data/centers'
import { haversineKm, snapToRoute } from './geo'
import type { CertCenter, LatLng, TrackPoint } from './types'

/** 정확도(accuracy)가 이 값(m)을 넘는 점은 버린다 (TRK-02) */
export const MAX_ACCURACY_M = 50

/** 직전 점과 이 거리(m) 미만이면 기록하지 않는다 (TRK-02) */
export const MIN_SAMPLE_DISTANCE_M = 10

/** 이 속도(km/h) 미만인 구간은 "정지"로 보고 이동 시간에서 뺀다 (TRK-03) */
export const MOVING_SPEED_THRESHOLD_KMH = 3

/** 점 사이 시간이 이보다(초) 넘게 벌어지면 "기록 공백"으로 본다 (TRK-12) */
export const TRACK_GAP_THRESHOLD_SEC = 60

export interface GpsCandidate extends LatLng {
  t: number // epoch ms
  acc?: number // accuracy(m)
}

/**
 * 후보 GPS 점을 궤적에 받아들일지 판단한다.
 * - 정확도가 MAX_ACCURACY_M을 넘으면 버린다.
 * - 직전 점이 있고 거리가 MIN_SAMPLE_DISTANCE_M 미만이면 버린다.
 */
export function shouldAcceptPoint(candidate: GpsCandidate, lastPoint: TrackPoint | null): boolean {
  if (candidate.acc !== undefined && candidate.acc > MAX_ACCURACY_M) return false
  if (lastPoint) {
    const distanceM = haversineKm(lastPoint, candidate) * 1000
    if (distanceM < MIN_SAMPLE_DISTANCE_M) return false
  }
  return true
}

/**
 * candidate를 필터링해 받아들이면 새 track 배열을 돌려주고, 버리면 원래 track을 그대로 돌려준다.
 * 스토어의 addPoint 액션이 이 함수로 리듀스한다 (TRK-02).
 */
export function sampleTrackPoint(
  track: readonly TrackPoint[],
  candidate: GpsCandidate,
): TrackPoint[] {
  const last = track.length > 0 ? track[track.length - 1] : null
  if (!shouldAcceptPoint(candidate, last)) return track as TrackPoint[]
  const point: TrackPoint = { lat: candidate.lat, lng: candidate.lng, t: candidate.t }
  if (candidate.acc !== undefined) point.acc = candidate.acc
  return [...track, point]
}

/** 궤적의 누적 거리(km). 연속한 점 사이 haversine 거리의 합 */
export function trackDistanceKm(track: readonly TrackPoint[]): number {
  let sum = 0
  for (let i = 1; i < track.length; i++) sum += haversineKm(track[i - 1], track[i])
  return sum
}

/**
 * 이동 시간(초). 정지 제외(TRK-03) — 구간 속도가 MOVING_SPEED_THRESHOLD_KMH 미만이면 빼고,
 * TRACK_GAP_THRESHOLD_SEC를 넘게 끊긴 구간(기록 공백, TRK-12)도 이동 시간에 넣지 않는다.
 */
export function movingTimeSec(track: readonly TrackPoint[]): number {
  let sec = 0
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1]
    const b = track[i]
    const dtSec = (b.t - a.t) / 1000
    if (dtSec <= 0 || dtSec > TRACK_GAP_THRESHOLD_SEC) continue
    const speedKmh = haversineKm(a, b) / (dtSec / 3600)
    if (speedKmh >= MOVING_SPEED_THRESHOLD_KMH) sec += dtSec
  }
  return sec
}

/** 현재 속도(km/h). 마지막 두 점 구간의 평균 속도. 점이 2개 미만이면 0 */
export function currentSpeedKmh(track: readonly TrackPoint[]): number {
  if (track.length < 2) return 0
  const a = track[track.length - 2]
  const b = track[track.length - 1]
  const dtSec = (b.t - a.t) / 1000
  if (dtSec <= 0) return 0
  return haversineKm(a, b) / (dtSec / 3600)
}

/** 평균 속도(km/h). 이동 시간이 0이면 0 */
export function averageSpeedKmh(distanceKm: number, movingSec: number): number {
  return movingSec > 0 ? distanceKm / (movingSec / 3600) : 0
}

/**
 * 궤적을 기록 공백(TRACK_GAP_THRESHOLD_SEC 넘게 끊긴 구간) 기준으로 여러 조각으로 나눈다.
 * 지도에서 끊긴 구간을 직선으로 잇지 않고 따로 그리기 위해 쓴다 (TRK-12).
 */
export function splitTrackByGaps(track: readonly TrackPoint[]): TrackPoint[][] {
  if (track.length === 0) return []
  const segments: TrackPoint[][] = [[track[0]]]
  for (let i = 1; i < track.length; i++) {
    const dtSec = (track[i].t - track[i - 1].t) / 1000
    if (dtSec > TRACK_GAP_THRESHOLD_SEC) segments.push([])
    segments[segments.length - 1].push(track[i])
  }
  return segments
}

/** 경로 이탈 알림을 띄우기 전까지 벗어난 상태로 버티는 시간(초) (TRK-05) */
export const OFF_ROUTE_ALERT_SEC = 30

/**
 * 궤적 끝에서부터 거슬러 올라가며 "연속으로 경로를 벗어난" 구간이 몇 초째인지 구한다.
 * 지금 경로 위에 있으면(또는 궤적이 비어 있으면) 0. UI는 이 값이 OFF_ROUTE_ALERT_SEC를 넘으면
 * 배너를 띄운다 (TRK-05).
 */
export function offRouteDurationSec(track: readonly TrackPoint[]): number {
  if (track.length === 0) return 0
  const last = track[track.length - 1]
  if (!snapToRoute(last).offRoute) return 0

  let since = last.t
  for (let i = track.length - 1; i >= 0; i--) {
    if (!snapToRoute(track[i]).offRoute) break
    since = track[i].t
  }
  return (last.t - since) / 1000
}

/** 자동 도장 반경(km). 150m로 시작한다 (feature-track.md 결정 로그, TRK-06) */
export const AUTO_STAMP_RADIUS_KM = 0.15

/**
 * 지금 위치가 아직 안 찍은 인증센터 반경 AUTO_STAMP_RADIUS_KM 안에 있으면 그 센터를 돌려준다.
 * 여러 곳이 겹치면 가장 가까운 곳. 반경 안에 아무것도 없으면 null (TRK-06).
 */
export function nearbyUnstampedCenter(
  point: LatLng,
  stampedCenterIds: ReadonlySet<string>,
  centers: readonly CertCenter[] = CENTERS,
): CertCenter | null {
  let best: { center: CertCenter; distanceKm: number } | null = null
  for (const center of centers) {
    if (stampedCenterIds.has(center.id)) continue
    const distanceKm = haversineKm(point, center)
    if (distanceKm <= AUTO_STAMP_RADIUS_KM && (best === null || distanceKm < best.distanceKm)) {
      best = { center, distanceKm }
    }
  }
  return best?.center ?? null
}

/** 계획 페이스 비교에서 하루 라이딩 시간을 이만큼(시간)으로 가정한다 (TRK-07) */
export const ASSUMED_RIDING_HOURS = 6

/**
 * 오늘 계획 거리 대비 지금까지 탄 거리를 비교한다 (TRK-07).
 * 하루를 ASSUMED_RIDING_HOURS 시간으로 가정하고, 지난 시간만큼 탔어야 할 거리(예상 거리)와
 * 실제로 탄 거리(riddenKm)의 차이를 돌려준다. 양수면 계획보다 앞선 것이고 음수면 뒤처진 것이다.
 */
export function planPaceDiffKm(riddenKm: number, plannedKm: number, elapsedHours: number): number {
  const clampedHours = Math.max(0, elapsedHours)
  const expectedKm = Math.min(plannedKm, (plannedKm / ASSUMED_RIDING_HOURS) * clampedHours)
  return riddenKm - expectedKm
}
