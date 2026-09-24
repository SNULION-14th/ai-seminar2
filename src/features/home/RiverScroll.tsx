// DS-01 강줄기 스크롤: 스크롤하면 633km 경로가 stroke-dashoffset으로 그려지고 자전거가 경로를 따라간다.
// 구간마다 배경 풍경이 패럴랙스로 바뀐다. 프레임마다 React를 다시 그리지 않고 DOM 스타일만 바꾼다.
import { Bike } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CENTERS } from '../../data/centers'
import { ROUTE } from '../../data/route'
import { SECTIONS, TOTAL_KM } from '../../data/sections'
import { polylinePath, pointAtRatio, projectRoute } from '../../components/river'
import { SectionScene } from './SectionScene'
import styles from './Home.module.css'

const MAP_W = 300
const MAP_H = 380

const SECTION_COPY: Record<string, string> = {
  ara: '서해 아라서해갑문에서 첫 도장을 찍고 출발해요.',
  hangang: '여의도와 광나루를 지나 서울을 가로질러요.',
  namhan: '양평과 여주를 지나 강을 거슬러 충주까지 올라가요.',
  saejae: '소조령과 이화령, 이번 길에서 가장 높은 고개를 넘어요.',
  nakdong: '상주에서 낙동강하굿둑까지 강을 따라 바다로 흘러가요.',
}

// 구간 누적 끝 km
const SECTION_ENDS = SECTIONS.reduce<number[]>((acc, s) => [...acc, (acc.at(-1) ?? 0) + s.distanceKm], [])
const sectionIndexAt = (km: number) => {
  const i = SECTION_ENDS.findIndex((end) => km < end)
  return i === -1 ? SECTIONS.length - 1 : i
}

export function RiverScroll() {
  const storyRef = useRef<HTMLElement>(null)
  const drawnRef = useRef<SVGPathElement>(null)
  const bikeRef = useRef<SVGGElement>(null)
  const kmRef = useRef<HTMLSpanElement>(null)
  const dotRefs = useRef<(SVGCircleElement | null)[]>([])
  const [sectionIndex, setSectionIndex] = useState(0)
  const [arrived, setArrived] = useState(false)

  const route = useMemo(() => projectRoute(ROUTE, MAP_W, MAP_H, 20), [])
  const path = useMemo(() => polylinePath(route.points), [route])
  const centerDots = useMemo(
    () =>
      CENTERS.map((c) => {
        // 같은 투영을 쓰려고 km가 가장 가까운 경로 점의 화면 좌표를 쓴다
        const q = route.points.reduce((best, r) =>
          Math.abs(r.km - c.kmFromStart) < Math.abs(best.km - c.kmFromStart) ? r : best,
        )
        return { id: c.id, km: c.kmFromStart, x: q.x, y: q.y }
      }),
    [route],
  )

  useEffect(() => {
    const story = storyRef.current
    if (!story) return
    let frame = 0

    const update = () => {
      frame = 0
      const rect = story.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      const p = scrollable > 0 ? Math.max(0, Math.min(1, -rect.top / scrollable)) : 0
      const at = pointAtRatio(route, p)
      const km = Math.min(TOTAL_KM, at.km)

      story.style.setProperty('--p', p.toFixed(4))
      drawnRef.current?.style.setProperty('stroke-dashoffset', (1 - p).toFixed(4))
      bikeRef.current?.setAttribute('transform', `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`)
      if (kmRef.current) kmRef.current.textContent = Math.round(km).toLocaleString('ko-KR')
      dotRefs.current.forEach((dot, i) => {
        dot?.classList.toggle(styles.dotPassed, centerDots[i].km <= km + 0.5)
      })
      setSectionIndex(sectionIndexAt(km))
      setArrived(p >= 0.995)
    }
    const request = () => {
      if (frame === 0) frame = requestAnimationFrame(update)
    }

    request()
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    return () => {
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [route, centerDots])

  const section = SECTIONS[sectionIndex]
  const start = route.points[0]
  const end = route.points[route.points.length - 1]

  return (
    <section ref={storyRef} className={styles.story} aria-label="633km 강줄기 따라가기">
      <div className={styles.sticky}>
        <div className={styles.scenes}>
          {SECTIONS.map((s, i) => (
            <SectionScene key={s.id} id={s.id} active={i === sectionIndex} />
          ))}
        </div>

        <div className={styles.meter}>
          <span className={styles.meterLabel}>
            {section.order} / {SECTIONS.length} 구간
          </span>
          <span className={styles.meterKm}>
            <span ref={kmRef} className="num">
              0
            </span>
            <small>km</small>
          </span>
        </div>

        <svg
          className={styles.map}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          role="img"
          aria-label="인천 아라서해갑문에서 부산 낙동강하굿둑까지 이어지는 국토종주 경로"
        >
          <path className={styles.mapBank} d={path} />
          <path className={styles.mapBase} d={path} />
          <path ref={drawnRef} className={styles.mapDrawn} d={path} pathLength={1} />
          {centerDots.map((d, i) => (
            <circle
              key={d.id}
              ref={(el) => {
                dotRefs.current[i] = el
              }}
              className={styles.dot}
              cx={d.x}
              cy={d.y}
              r={3.5}
            />
          ))}
          {start && (
            <text className={styles.mapLabel} x={start.x} y={start.y + 26} textAnchor="middle">
              인천
            </text>
          )}
          {end && (
            <text className={styles.mapLabel} x={end.x - 10} y={end.y + 20} textAnchor="end">
              부산
            </text>
          )}
          <g ref={bikeRef} className={styles.bike} transform={start ? `translate(${start.x} ${start.y})` : undefined}>
            <circle r="15" />
            <Bike x={-10} y={-10} width={20} height={20} strokeWidth={2.2} aria-hidden="true" />
          </g>
        </svg>

        <div className={styles.card} aria-live="polite">
          <h2 className={styles.cardTitle}>
            {arrived ? '바다에 닿았어요' : section.name}
            <small className="num">{arrived ? '633km' : `${section.distanceKm}km`}</small>
          </h2>
          <p>{arrived ? '633km, 강을 따라 흐르는 한 줄이 완성됐어요.' : SECTION_COPY[section.id]}</p>
        </div>
      </div>
    </section>
  )
}
