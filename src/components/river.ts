// DS-01 강줄기 라인아트의 순수 계산 (홈, 공유 카드). React·DOM을 쓰지 않는다.
import type { RoutePoint } from '../domain/types'

export interface ProjectedPoint {
  x: number
  y: number
  km: number
  len: number // 시작점부터 화면상 누적 길이
}

export interface ProjectedRoute {
  points: ProjectedPoint[]
  totalLen: number
  width: number
  height: number
}

/**
 * 위경도 경로를 width×height 상자에 북쪽이 위로 오게 맞춘다 (등장방형 근사, 비율 유지).
 */
export function projectRoute(
  route: readonly RoutePoint[],
  width: number,
  height: number,
  padding = 16,
): ProjectedRoute {
  if (route.length === 0) return { points: [], totalLen: 0, width, height }
  const midLat = route.reduce((s, p) => s + p.lat, 0) / route.length
  const cosLat = Math.cos((midLat * Math.PI) / 180)
  const xs = route.map((p) => p.lng * cosLat)
  const ys = route.map((p) => -p.lat)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY)
  const offX = (width - spanX * scale) / 2
  const offY = (height - spanY * scale) / 2

  let len = 0
  const points: ProjectedPoint[] = route.map((p, i) => {
    const x = offX + (xs[i] - minX) * scale
    const y = offY + (ys[i] - minY) * scale
    if (i > 0) {
      const prevX = offX + (xs[i - 1] - minX) * scale
      const prevY = offY + (ys[i - 1] - minY) * scale
      len += Math.hypot(x - prevX, y - prevY)
    }
    return { x, y, km: p.km, len }
  })
  return { points, totalLen: len, width, height }
}

export function polylinePath(points: readonly { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
}

/** 화면상 길이 비율(0-1) 지점의 좌표·km·진행 방향(도) */
export function pointAtRatio(
  route: ProjectedRoute,
  ratio: number,
): { x: number; y: number; km: number; angle: number } {
  const pts = route.points
  if (pts.length === 0) return { x: 0, y: 0, km: 0, angle: 0 }
  const target = Math.max(0, Math.min(1, ratio)) * route.totalLen
  let i = 1
  while (i < pts.length - 1 && pts[i].len < target) i++
  const a = pts[Math.max(0, i - 1)]
  const b = pts[i] ?? a
  const segLen = b.len - a.len
  const t = segLen > 0 ? (target - a.len) / segLen : 0
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    km: a.km + (b.km - a.km) * t,
    angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  }
}

/** km까지 잘라낸 부분 경로 (달린 구간 강조용) */
export function slicePointsToKm(route: ProjectedRoute, km: number): { x: number; y: number }[] {
  const pts = route.points
  if (pts.length === 0 || km <= pts[0].km) return []
  const out: { x: number; y: number }[] = []
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    if (p.km <= km) {
      out.push(p)
      continue
    }
    const a = pts[i - 1]
    const t = (km - a.km) / (p.km - a.km)
    out.push({ x: a.x + (p.x - a.x) * t, y: a.y + (p.y - a.y) * t })
    break
  }
  return out
}
