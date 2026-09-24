// DS-02 능선 고도 프로필: 고도 그래프를 겹겹의 산 능선 실루엣으로 그린다 (PLAN-04, SHR-01).
// 데이터는 props로만 받는다. 스토어를 읽지 않는다.
import { useId, useMemo, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'
import type { CertCenter, RoutePoint } from '../domain/types'
import {
  eleCeiling,
  kmToRatio,
  nearestCenter,
  sampleProfile,
  silhouettePath,
  smooth,
} from './ridge'
import styles from './RidgeProfile.module.css'

export interface RidgeBoundary {
  km: number
  label?: string // 예: "1일차"
}

export interface RidgeScrubInfo {
  km: number
  ele: number
  nearest: CertCenter | null
  nearestDistKm: number
}

export interface RidgeProfileProps {
  points: readonly RoutePoint[]
  centers?: readonly CertCenter[]
  range?: readonly [number, number]
  boundaries?: readonly RidgeBoundary[]
  progressKm?: number
  currentKm?: number
  height?: number
  onScrub?: (info: RidgeScrubInfo | null) => void
  children?: ReactNode
  ariaLabel?: string
}

const VIEW_W = 1000
const SAMPLES = 200
const KEY_STEP_KM = 5

const fmtKm = (km: number) => `${Math.round(km).toLocaleString('ko-KR')}km`
const fmtEle = (m: number) => `해발 ${Math.round(m).toLocaleString('ko-KR')}m`

export function RidgeProfile({
  points,
  centers = [],
  range,
  boundaries = [],
  progressKm,
  currentKm,
  height = 180,
  onScrub,
  children,
  ariaLabel = '고도 프로필',
}: RidgeProfileProps) {
  const clipId = useId()
  const [scrubKm, setScrubKm] = useState<number | null>(null)

  const first = points[0]?.km ?? 0
  const last = points[points.length - 1]?.km ?? 0
  const from = range?.[0] ?? first
  const to = range?.[1] ?? last
  const domain = useMemo(() => [from, to] as const, [from, to])

  const model = useMemo(() => {
    const samples = points.length > 0 ? sampleProfile(points, domain, SAMPLES) : []
    const ceil = eleCeiling(samples)
    const front = samples.map((s) => s.ele / ceil)
    // 먼 능선은 실제 고도를 부드럽게 한 뒤 산 모양 굴곡을 더한 장식이다. 데이터는 맨 앞 능선만.
    const wave = (i: number, period: number, phase: number) =>
      Math.sin((i / SAMPLES) * Math.PI * period + phase)
    const mid = smooth(front, 8).map((h, i) => h * 1.08 + 0.1 + 0.07 * wave(i, 9, 0.6))
    const far = smooth(front, 20).map((h, i) => h * 1.15 + 0.22 + 0.09 * wave(i, 5, 2.1))
    return {
      samples,
      ceil,
      front: silhouettePath(front, VIEW_W, height),
      mid: silhouettePath(mid, VIEW_W, height),
      far: silhouettePath(far, VIEW_W, height),
      frontHeights: front,
    }
  }, [points, domain, height])

  const visibleCenters = centers.filter((c) => c.kmFromStart >= from && c.kmFromStart <= to)
  const heightAt = (km: number) => {
    const i = Math.round(kmToRatio(km, domain) * SAMPLES)
    return model.frontHeights[i] ?? 0
  }
  const eleAt = (km: number) => model.samples[Math.round(kmToRatio(km, domain) * SAMPLES)]?.ele ?? 0

  const scrubInfo = (km: number): RidgeScrubInfo => {
    const near = nearestCenter(km, visibleCenters)
    return { km, ele: eleAt(km), nearest: near?.center ?? null, nearestDistKm: near?.distKm ?? 0 }
  }

  const updateScrub = (km: number | null) => {
    setScrubKm(km)
    onScrub?.(km === null ? null : scrubInfo(km))
  }

  const kmFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0
    return from + (to - from) * Math.max(0, Math.min(1, ratio))
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    updateScrub(kmFromPointer(e))
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    // 마우스는 올려만 둬도, 터치/펜은 누른 채 움직일 때만 툴팁을 보여 준다
    if (e.pointerType === 'mouse' || e.currentTarget.hasPointerCapture(e.pointerId)) {
      updateScrub(kmFromPointer(e))
    }
  }
  const onPointerEnd = () => updateScrub(null)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const base = scrubKm ?? from
    let next: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = base + KEY_STEP_KM
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = base - KEY_STEP_KM
    else if (e.key === 'Home') next = from
    else if (e.key === 'End') next = to
    else if (e.key === 'Escape') {
      updateScrub(null)
      return
    }
    if (next === null) return
    e.preventDefault()
    updateScrub(Math.max(from, Math.min(to, next)))
  }

  const pct = (km: number) => `${(kmToRatio(km, domain) * 100).toFixed(3)}%`
  const topPct = (km: number) => `${((1 - heightAt(km)) * 100).toFixed(2)}%`
  const tip = scrubKm === null ? null : scrubInfo(scrubKm)
  const tipAlign =
    scrubKm === null ? '' : kmToRatio(scrubKm, domain) < 0.2 ? styles.tipStart : kmToRatio(scrubKm, domain) > 0.8 ? styles.tipEnd : ''

  const nearText = (info: RidgeScrubInfo) =>
    !info.nearest
      ? ''
      : info.nearestDistKm < 1
        ? `${info.nearest.name} 근처`
        : `${info.nearest.name}까지 ${info.nearestDistKm.toFixed(1)}km`
  const valueText = tip
    ? [fmtKm(tip.km), fmtEle(tip.ele), nearText(tip)].filter(Boolean).join(', ')
    : `${fmtKm(from)}부터 ${fmtKm(to)}까지`

  return (
    <div className={styles.root}>
      <div className={styles.plot} style={{ height }}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${VIEW_W} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={VIEW_W * kmToRatio(progressKm ?? from, domain)} height={height} />
            </clipPath>
          </defs>
          <path className={styles.far} d={model.far} />
          <path className={styles.mid} d={model.mid} />
          <path className={styles.front} d={model.front} />
          {progressKm !== undefined && (
            <path className={styles.done} d={model.front} clipPath={`url(#${clipId})`} />
          )}
          {boundaries.map((b) => {
            const x = VIEW_W * kmToRatio(b.km, domain)
            return (
              <line
                key={`b-${b.km}`}
                className={styles.boundary}
                x1={x}
                x2={x}
                y1={0}
                y2={height}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
          {tip && (
            <line
              className={styles.cursor}
              x1={VIEW_W * kmToRatio(tip.km, domain)}
              x2={VIEW_W * kmToRatio(tip.km, domain)}
              y1={0}
              y2={height}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {visibleCenters.map((c) => (
          <span
            key={c.id}
            className={styles.center}
            style={{ left: pct(c.kmFromStart), top: topPct(c.kmFromStart) }}
            aria-hidden="true"
          />
        ))}
        {currentKm !== undefined && currentKm >= from && currentKm <= to && (
          <span
            className={styles.current}
            style={{ left: pct(currentKm), top: topPct(currentKm) }}
            aria-hidden="true"
          />
        )}
        {tip && (
          <span
            className={styles.tipDot}
            style={{ left: pct(tip.km), top: topPct(tip.km) }}
            aria-hidden="true"
          />
        )}
        {boundaries.map((b) =>
          b.label ? (
            <span key={`l-${b.km}`} className={styles.boundaryLabel} style={{ left: pct(b.km) }}>
              {b.label}
            </span>
          ) : null,
        )}
        {tip && (
          <div className={`${styles.tip} ${tipAlign}`} style={{ left: pct(tip.km) }} aria-hidden="true">
            <strong className="num">
              {fmtKm(tip.km)} · {fmtEle(tip.ele)}
            </strong>
            {tip.nearest && <span>{nearText(tip)}</span>}
          </div>
        )}
      </div>

      <div className={styles.axis} aria-hidden="true">
        <span className="num">{fmtKm(from)}</span>
        <span className="num">{fmtKm(to)}</span>
      </div>

      {/* 스크럽 면: 드래그/터치/키보드로 지점을 살핀다 */}
      <div
        className={styles.surface}
        style={{ height }}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={Math.round(from)}
        aria-valuemax={Math.round(to)}
        aria-valuenow={Math.round(scrubKm ?? from)}
        aria-valuetext={valueText}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') onPointerEnd()
        }}
        onKeyDown={onKeyDown}
        onBlur={() => updateScrub(null)}
      />

      {children && <div className={styles.overlay}>{children}</div>}
    </div>
  )
}
