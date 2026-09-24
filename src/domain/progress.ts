// 진행률 순수 함수 — docs/specs/domain-data.md §5
import { CENTERS } from '../data/centers'
import type { CertCenter, Progress, Ride, Stamp } from './types'

/**
 * 전체 진행률, 찍은 도장 수, 누적 거리.
 *
 * 진행률은 도장 기준이다: 찍은 인증센터마다 "직전 센터 → 그 센터" 구간 거리를 더해
 * 전체 거리(마지막 센터의 kmFromStart)로 나눈다. 순서와 상관없이 찍은 구간만큼 오르고,
 * 모두 찍으면 100이다. 같은 센터를 여러 번 찍거나 모르는 ID는 한 번도 세지 않는다.
 */
export function progress(
  stamps: readonly Stamp[],
  rides: readonly Ride[],
  centers: readonly CertCenter[] = CENTERS,
): Progress {
  const stamped = new Set(stamps.map((s) => s.centerId))
  const totalKm = centers.length > 0 ? centers[centers.length - 1].kmFromStart : 0

  let stampCount = 0
  let coveredKm = 0
  centers.forEach((c, i) => {
    if (!stamped.has(c.id)) return
    stampCount++
    coveredKm += i === 0 ? 0 : c.kmFromStart - centers[i - 1].kmFromStart
  })

  const percent = totalKm > 0 ? Math.min(100, (coveredKm / totalKm) * 100) : 0
  const distanceKm = rides.reduce((sum, r) => sum + r.distanceKm, 0)

  return { percent, stampCount, totalCenters: centers.length, distanceKm }
}
