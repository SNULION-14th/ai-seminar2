// DS-02 능선 고도 프로필의 순수 계산. React·DOM을 쓰지 않는다.
import { pointAtKm } from '../domain/geo'
import type { CertCenter, RoutePoint } from '../domain/types'

export interface ProfileSample {
  km: number
  ele: number
}

/** range 구간을 n등분해 고도를 샘플링한다. */
export function sampleProfile(
  points: readonly RoutePoint[],
  range: readonly [number, number],
  n = 160,
): ProfileSample[] {
  const [from, to] = range
  const out: ProfileSample[] = []
  for (let i = 0; i <= n; i++) {
    const km = from + ((to - from) * i) / n
    out.push({ km, ele: pointAtKm(km, points).ele })
  }
  return out
}

/** 이동 평균으로 능선을 부드럽게 만든다 (먼 능선용). */
export function smooth(values: readonly number[], radius: number): number[] {
  return values.map((_, i) => {
    let sum = 0
    let count = 0
    for (let j = i - radius; j <= i + radius; j++) {
      if (j < 0 || j >= values.length) continue
      sum += values[j]
      count++
    }
    return sum / count
  })
}

/**
 * 높이값 배열(0-1, 1이 꼭대기)을 채워진 실루엣 path로 만든다.
 * 좌표계는 viewBox 0 0 width height, 아래가 바닥이다.
 */
export function silhouettePath(heights: readonly number[], width: number, height: number): string {
  if (heights.length === 0) return ''
  const step = heights.length > 1 ? width / (heights.length - 1) : 0
  const y = (h: number) => (height * (1 - Math.max(0, Math.min(1, h)))).toFixed(1)
  let d = `M0 ${height} L0 ${y(heights[0])}`
  for (let i = 1; i < heights.length; i++) d += ` L${(i * step).toFixed(1)} ${y(heights[i])}`
  return `${d} L${width} ${height} Z`
}

/** 고도 축 최댓값: 구간 최고점보다 25% 여유를 두고, 평지 구간도 너무 과장되지 않게 60m를 바닥으로 한다. */
export function eleCeiling(samples: readonly ProfileSample[]): number {
  const max = samples.reduce((m, s) => Math.max(m, s.ele), 0)
  return Math.max(60, max * 1.25)
}

/** km에서 가장 가까운 인증센터 */
export function nearestCenter(
  km: number,
  centers: readonly CertCenter[],
): { center: CertCenter; distKm: number } | null {
  let best: { center: CertCenter; distKm: number } | null = null
  for (const c of centers) {
    const distKm = Math.abs(c.kmFromStart - km)
    if (best === null || distKm < best.distKm) best = { center: c, distKm }
  }
  return best
}

/** km → 0-1 비율 (range 밖은 자른다) */
export function kmToRatio(km: number, range: readonly [number, number]): number {
  const span = range[1] - range[0]
  if (span <= 0) return 0
  return Math.max(0, Math.min(1, (km - range[0]) / span))
}
