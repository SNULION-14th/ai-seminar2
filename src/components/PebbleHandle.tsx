// DS-06 일정 조약돌 드래그: 일자 경계(숙박 지점)를 앞뒤 인증센터로 옮기는 핸들 (PLAN-05).
// Pointer Events로 직접 구현한다 (design-system.md 결정 로그). 데이터는 props로만 받는다.
import { useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { nearestStopIndex, ratioToKm } from './pebble'
import type { PebbleStop } from './pebble'
import { kmToRatio } from './ridge'
import styles from './PebbleHandle.module.css'

export type { PebbleStop } from './pebble'

export interface PebbleHandleProps {
  stops: readonly PebbleStop[] // km 오름차순, 이 경계가 갈 수 있는 후보만
  value: string // 현재 stop id
  domain: readonly [number, number] // 부모 오버레이 가로 범위의 km
  label: string // 예: "1일차와 2일차 경계"
  onPreview?: (id: string) => void
  onCommit: (id: string) => void
  disabled?: boolean
}

interface Drag {
  pointerId: number
  km: number
  index: number
}

const pct = (ratio: number) => `${(ratio * 100).toFixed(3)}%`
const stopText = (s: PebbleStop | undefined) =>
  s ? `${s.label ?? s.id} (${Math.round(s.km).toLocaleString('ko-KR')}km)` : ''

export function PebbleHandle({
  stops,
  value,
  domain,
  label,
  onPreview,
  onCommit,
  disabled = false,
}: PebbleHandleProps) {
  const [drag, setDrag] = useState<Drag | null>(null)
  const valueIndex = Math.max(
    0,
    stops.findIndex((s) => s.id === value),
  )
  const current = stops[valueIndex]
  const activeIndex = drag?.index ?? valueIndex
  const handleKm = drag?.km ?? current?.km ?? domain[0]

  const kmAt = (e: PointerEvent<HTMLElement>) => {
    const parent = e.currentTarget.offsetParent as HTMLElement | null
    const rect = (parent ?? e.currentTarget).getBoundingClientRect()
    const ratio = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0
    const km = ratioToKm(ratio, domain)
    // 후보 범위 밖으로는 끌리지 않는다
    const lo = stops[0]?.km ?? domain[0]
    const hi = stops[stops.length - 1]?.km ?? domain[1]
    return Math.max(lo, Math.min(hi, km))
  }

  const move = (pointerId: number, km: number) => {
    const index = nearestStopIndex(km, stops)
    if (index !== activeIndex && stops[index]) onPreview?.(stops[index].id)
    setDrag({ pointerId, km, index })
  }

  const commit = (index: number) => {
    const next = stops[index]
    if (next && next.id !== value) onCommit(next.id)
  }

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || stops.length === 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    move(e.pointerId, kmAt(e))
  }
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag?.pointerId !== e.pointerId) return
    move(e.pointerId, kmAt(e))
  }
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag?.pointerId !== e.pointerId) return
    commit(drag.index)
    setDrag(null)
  }
  const onPointerCancel = () => {
    if (drag && stops[valueIndex]) onPreview?.(stops[valueIndex].id)
    setDrag(null)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    let next: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = valueIndex + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = valueIndex - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = stops.length - 1
    if (next === null) return
    e.preventDefault()
    commit(Math.max(0, Math.min(stops.length - 1, next)))
  }

  const snapped = stops[activeIndex]

  return (
    <>
      {drag &&
        stops.map((s, i) => (
          <span
            key={s.id}
            className={`${styles.stop} ${i === activeIndex ? styles.stopActive : ''}`}
            style={{ left: pct(kmToRatio(s.km, domain)) }}
            aria-hidden="true"
          />
        ))}
      {drag && snapped && (
        <span
          className={styles.stem}
          style={{ left: pct(kmToRatio(snapped.km, domain)) }}
          aria-hidden="true"
        >
          <span className={styles.stemLabel}>{snapped.label ?? snapped.id}</span>
        </span>
      )}
      <button
        type="button"
        className={`${styles.handle} ${drag ? styles.dragging : ''}`}
        style={{ left: pct(kmToRatio(handleKm, domain)) }}
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, stops.length - 1)}
        aria-valuenow={activeIndex}
        aria-valuetext={stopText(snapped)}
        aria-disabled={disabled || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onKeyDown}
      >
        <svg className={styles.pebble} viewBox="0 0 40 30" aria-hidden="true">
          <path d="M5 18C3 10 10 3 20 3c9 0 17 5 16 13-1 8-8 11-17 11C11 27 6 24 5 18Z" />
          <path className={styles.shine} d="M12 10c3-3 8-4 12-3" />
        </svg>
      </button>
    </>
  )
}
