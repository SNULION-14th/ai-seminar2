// PLAN-05 경계 드래그: PebbleHandle에 넘길 경계(edge) 목록을 만든다.
import type { PebbleStop } from '../../components'
import { CENTERS, getCenter } from '../../data/centers'
import type { CertCenter, DayPlan } from '../../domain/types'

export interface BoundaryEdge {
  /** React key 겸 PebbleHandle key. 인덱스 기반이라 드래그 중에도 안정적이다 */
  id: string
  boundaryIndex: number
  toCenterId: string
  label: string
  /** 이 경계가 갈 수 있는 후보 — 앞뒤 이웃 경계를 넘지 않게 잘랐다. km 오름차순 */
  stops: PebbleStop[]
}

/** days.length - 1개의 경계를 만든다. 마지막 날은 경계가 아니라서 제외한다 */
export function buildBoundaryEdges(
  days: readonly DayPlan[],
  centers: readonly CertCenter[] = CENTERS,
): BoundaryEdge[] {
  if (days.length < 2) return []
  return days.slice(0, -1).map((day, i) => {
    const next = days[i + 1]
    const lowerKm = getCenter(day.fromCenterId)?.kmFromStart ?? -Infinity
    const upperKm = getCenter(next.toCenterId)?.kmFromStart ?? Infinity
    const stops: PebbleStop[] = centers
      .filter((c) => c.kmFromStart > lowerKm && c.kmFromStart < upperKm)
      .map((c) => ({ id: c.id, km: c.kmFromStart, label: c.name }))
    return {
      id: `boundary-${i}`,
      boundaryIndex: i,
      toCenterId: day.toCenterId,
      label: `${day.dayIndex}일차와 ${next.dayIndex}일차 경계`,
      stops,
    }
  })
}
