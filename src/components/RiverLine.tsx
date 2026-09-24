// 강줄기 라인아트: 633km 경로를 한 줄의 강으로 그린다. 달린 구간만 컬러 (홈 DS-01, 공유 카드 SHR-02).
// 순수 SVG라 html-to-image 캡처에도 안전하다. 데이터는 props로만 받는다.
import { useMemo } from 'react'
import type { CertCenter, RoutePoint } from '../domain/types'
import { polylinePath, projectRoute, slicePointsToKm } from './river'
import styles from './RiverLine.module.css'

export interface RiverLineProps {
  points: readonly RoutePoint[]
  progressKm?: number // 여기까지 컬러, 나머지는 옅은 선
  centers?: readonly CertCenter[]
  stampedIds?: readonly string[]
  width?: number
  height?: number
  className?: string
  ariaLabel?: string
}

export function RiverLine({
  points,
  progressKm = 0,
  centers = [],
  stampedIds = [],
  width = 300,
  height = 400,
  className,
  ariaLabel = '인천에서 부산까지 이어지는 강줄기',
}: RiverLineProps) {
  const route = useMemo(() => projectRoute(points, width, height), [points, width, height])
  const base = useMemo(() => polylinePath(route.points), [route])
  const done = polylinePath(slicePointsToKm(route, progressKm))
  const stamped = new Set(stampedIds)

  // 인증센터 좌표를 같은 투영으로 옮긴다: 경로 점 중 km가 같은 점을 쓴다
  const centerDots = (route.points.length > 0 ? centers : []).map((c) => {
    const p = route.points.reduce((best, q) =>
      Math.abs(q.km - c.kmFromStart) < Math.abs(best.km - c.kmFromStart) ? q : best,
    )
    return { id: c.id, x: p.x, y: p.y, on: stamped.has(c.id) }
  })

  return (
    <svg
      className={`${styles.river} ${className ?? ''}`}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
    >
      <path className={styles.bank} d={base} />
      <path className={styles.base} d={base} />
      {done && <path className={styles.done} d={done} />}
      {centerDots.map((d) => (
        <circle
          key={d.id}
          className={d.on ? styles.dotOn : styles.dot}
          cx={d.x}
          cy={d.y}
          r={d.on ? 4.5 : 3}
        />
      ))}
    </svg>
  )
}
