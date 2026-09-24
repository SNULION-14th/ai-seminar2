import type { TimelineSlot } from './time'
import { kstParts } from './time'

export const CHART_TOP = 24
export const CHART_BOTTOM = 56

/** 강수확률(0–100) → 그래프 y 좌표. 고정 열의 y축 눈금도 같은 함수를 쓴다. */
export function chartY(pop: number, height: number) {
  const plot = height - CHART_TOP - CHART_BOTTOM
  return CHART_TOP + (1 - pop / 100) * plot
}

export function hourLabel(slot: TimelineSlot, index: number) {
  if (index === 0) return '지금'
  if (slot.hour === 0) {
    const p = kstParts(slot.date)
    return `${p.month}/${p.day}`
  }
  return `${slot.hour}시`
}
