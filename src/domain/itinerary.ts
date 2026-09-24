// 일정 분할 순수 함수 — docs/specs/feature-plan.md PLAN-01, PLAN-02, docs/specs/domain-data.md §5
// React·DOM·브라우저 API를 import하지 않는다.
import { CENTERS } from '../data/centers'
import { ROUTE } from '../data/route'
import { SECTIONS } from '../data/sections'
import { pointAtKm } from './geo'
import type { CertCenter, DayPlan, Pace, RoutePoint, Section, SectionId } from './types'

/** 페이스별 하루 기준 거리(km). feature-plan.md PLAN-01 */
export const PACE_DAILY_KM: Record<Pace, number> = {
  relaxed: 80,
  normal: 110,
  hard: 150,
}

/** 새재 구간을 포함하는 날은 목표 거리를 이만큼 줄인다(오르막 보정). feature-plan.md PLAN-02 ③ */
export const SAEJAE_TARGET_FACTOR = 0.85

/** 이 값보다 하루 평균 거리가 길면 "너무 길다" 경고를 보여준다 */
export const MAX_REASONABLE_DAILY_KM = 180
/** 이 값보다 하루 평균 거리가 짧으면 "너무 짧다" 경고를 보여준다 */
export const MIN_REASONABLE_DAILY_KM = 40

export interface SplitItineraryOptions {
  /** ISO date, "YYYY-MM-DD" */
  startDate: string
  pace: Pace
  /** 'days': 일수를 지정한다. 'dailyDistance': 하루 목표 거리를 지정한다 (PLAN-01) */
  mode: 'days' | 'dailyDistance'
  /** mode === 'days'일 때 필수 */
  days?: number
  /** mode === 'dailyDistance'일 때 목표 거리. 없으면 pace 기준값을 쓴다 */
  dailyDistanceKm?: number
  /** 부분 계획(PLAN-06)용. 기본값은 전체 경로의 시작/끝 인증센터다 */
  startCenterId?: string
  endCenterId?: string
  // 테스트와 기본 데이터 오버라이드용
  centers?: readonly CertCenter[]
  route?: readonly RoutePoint[]
  sections?: readonly Section[]
}

export interface SplitItineraryResult {
  days: DayPlan[]
  /** 비현실적인 일수/거리 등 안내 문구 (해요체) */
  warnings: string[]
}

function mustFindCenter(id: string, centers: readonly CertCenter[]): CertCenter {
  const center = centers.find((c) => c.id === id)
  if (!center) throw new Error(`splitItinerary: 인증센터를 찾을 수 없어요 (${id})`)
  return center
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart
}

/** SECTIONS의 order 순서로 누적해서 구간의 [시작 km, 끝 km) 범위를 구한다 */
function sectionKmRange(
  sectionId: SectionId,
  sections: readonly Section[],
): { start: number; end: number } {
  const sorted = [...sections].sort((a, b) => a.order - b.order)
  let start = 0
  for (const s of sorted) {
    const end = start + s.distanceKm
    if (s.id === sectionId) return { start, end }
    start = end
  }
  throw new Error(`splitItinerary: 알 수 없는 구간이에요 (${sectionId})`)
}

/** fromKm~toKm 사이 경로 고도의 상승분만 더한다 */
function climbBetween(fromKm: number, toKm: number, route: readonly RoutePoint[]): number {
  if (route.length === 0 || toKm <= fromKm) return 0
  const points: RoutePoint[] = [
    pointAtKm(fromKm, route),
    ...route.filter((p) => p.km > fromKm && p.km < toKm),
    pointAtKm(toKm, route),
  ]
  let climb = 0
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].ele - points[i - 1].ele
    if (delta > 0) climb += delta
  }
  return Math.round(climb)
}

function roundKm(km: number): number {
  return Math.round(km * 10) / 10
}

function addDaysIso(startDate: string, days: number): string {
  const [y, m, d] = startDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * 일수 또는 하루 목표 거리, 페이스를 받아 인증센터 경계로 DayPlan[]을 만든다.
 * 규칙 (feature-plan.md §3 PLAN-02):
 *  ① 하루의 끝은 항상 인증센터다
 *  ② 목표 거리에 가장 가까운 센터를 고른다
 *  ③ 새재 구간을 포함하는 날은 목표 거리를 85%로 줄인다(오르막 보정)
 * 마지막 날은 항상 끝 지점(기본은 전체 경로의 마지막 센터)으로 맞춰서, 일자별 거리 합이
 * 전체 경로 거리와 같아지게 한다.
 */
export function splitItinerary(options: SplitItineraryOptions): SplitItineraryResult {
  const {
    startDate,
    pace,
    mode,
    days,
    dailyDistanceKm,
    startCenterId,
    endCenterId,
    centers = CENTERS,
    route = ROUTE,
    sections = SECTIONS,
  } = options

  if (centers.length === 0) throw new Error('splitItinerary: 인증센터 데이터가 없어요')

  const startCenter = startCenterId ? mustFindCenter(startCenterId, centers) : centers[0]
  const endCenter = endCenterId ? mustFindCenter(endCenterId, centers) : centers[centers.length - 1]
  if (endCenter.kmFromStart <= startCenter.kmFromStart) {
    throw new Error('splitItinerary: 끝 지점이 시작 지점보다 앞에 있어요')
  }

  const totalKm = endCenter.kmFromStart - startCenter.kmFromStart
  let candidateCenters = centers.filter(
    (c) => c.kmFromStart > startCenter.kmFromStart && c.kmFromStart <= endCenter.kmFromStart,
  )

  const warnings: string[] = []
  let dayCount: number
  let dailyTargetKm: number

  if (mode === 'days') {
    if (!days || days < 1) throw new Error('splitItinerary: days는 1 이상이어야 해요')
    dayCount = days
    dailyTargetKm = totalKm / days
  } else {
    const target = dailyDistanceKm ?? PACE_DAILY_KM[pace]
    if (!target || target <= 0) throw new Error('splitItinerary: dailyDistanceKm은 0보다 커야 해요')
    dailyTargetKm = target
    dayCount = Math.max(1, Math.ceil(totalKm / target))
  }

  const avgDailyKm = totalKm / dayCount
  if (avgDailyKm > MAX_REASONABLE_DAILY_KM) {
    warnings.push(
      `하루 평균 거리가 약 ${Math.round(avgDailyKm)}km예요. 일정을 며칠 더 늘리는 걸 추천해요.`,
    )
  } else if (avgDailyKm < MIN_REASONABLE_DAILY_KM) {
    warnings.push(
      `하루 평균 거리가 약 ${Math.round(avgDailyKm)}km로 짧아요. 일정을 줄이는 걸 추천해요.`,
    )
  }

  const saejaeRange = sectionKmRange('saejae', sections)
  const result: DayPlan[] = []
  let currentKm = startCenter.kmFromStart
  let currentCenterId = startCenter.id

  for (let dayIndex = 1; dayIndex <= dayCount; dayIndex++) {
    const daysLeft = dayCount - dayIndex + 1
    const remainingKm = endCenter.kmFromStart - currentKm
    let target = mode === 'days' ? remainingKm / daysLeft : dailyTargetKm
    let targetEndKm = currentKm + target

    // PLAN-02 ③ 새재 구간을 포함하는 날은 목표 거리를 85%로 줄인다
    if (rangesOverlap(currentKm, targetEndKm, saejaeRange.start, saejaeRange.end)) {
      target *= SAEJAE_TARGET_FACTOR
      targetEndKm = currentKm + target
    }

    let toCenter: CertCenter
    if (dayIndex === dayCount) {
      // 마지막 날은 항상 끝 지점으로 맞춘다
      toCenter = endCenter
    } else if (candidateCenters.length === 0) {
      // 남은 센터가 없는데 일수가 더 남았다면(비현실적인 입력) 제자리에 머문다
      toCenter = mustFindCenter(currentCenterId, centers)
    } else {
      toCenter = candidateCenters.reduce((closest, c) =>
        Math.abs(c.kmFromStart - targetEndKm) < Math.abs(closest.kmFromStart - targetEndKm)
          ? c
          : closest,
      )
    }
    candidateCenters = candidateCenters.filter((c) => c.kmFromStart > toCenter.kmFromStart)

    const distanceKm = Math.max(0, toCenter.kmFromStart - currentKm)
    result.push({
      dayIndex,
      date: addDaysIso(startDate, dayIndex - 1),
      fromCenterId: currentCenterId,
      toCenterId: toCenter.id,
      distanceKm: roundKm(distanceKm),
      climbM: climbBetween(currentKm, toCenter.kmFromStart, route),
      stayTown: toCenter.nearbyTown,
    })

    currentKm = toCenter.kmFromStart
    currentCenterId = toCenter.id
  }

  return { days: result, warnings }
}

/**
 * 일자 경계 하나를 다른 인증센터로 옮긴다 (PLAN-05).
 * boundaryIndex는 days[boundaryIndex].toCenterId(= days[boundaryIndex + 1].fromCenterId)를
 * 나타낸다(0부터, 마지막 날은 경계가 아니라 제외). 새 경계는 그 앞뒤 인증센터 "사이"에서만
 * 고를 수 있다. 옮긴 두 날의 거리·상승고도·숙박 거점만 다시 계산하고 나머지 날은 그대로 둔다.
 * 그래서 전체 거리 합은 항상 그대로다.
 */
export function adjustDayBoundary(
  days: readonly DayPlan[],
  boundaryIndex: number,
  newCenterId: string,
  centers: readonly CertCenter[] = CENTERS,
  route: readonly RoutePoint[] = ROUTE,
): DayPlan[] {
  if (boundaryIndex < 0 || boundaryIndex >= days.length - 1) {
    throw new Error('adjustDayBoundary: 경계 인덱스가 범위를 벗어났어요')
  }
  const current = days[boundaryIndex]
  const next = days[boundaryIndex + 1]
  const fromCenter = mustFindCenter(current.fromCenterId, centers)
  const toCenter = mustFindCenter(next.toCenterId, centers)
  const newCenter = mustFindCenter(newCenterId, centers)

  if (newCenter.kmFromStart <= fromCenter.kmFromStart || newCenter.kmFromStart >= toCenter.kmFromStart) {
    throw new Error('adjustDayBoundary: 경계는 앞뒤 인증센터 사이에서만 옮길 수 있어요')
  }

  const updatedCurrent: DayPlan = {
    ...current,
    toCenterId: newCenter.id,
    distanceKm: roundKm(newCenter.kmFromStart - fromCenter.kmFromStart),
    climbM: climbBetween(fromCenter.kmFromStart, newCenter.kmFromStart, route),
    stayTown: newCenter.nearbyTown,
  }
  const updatedNext: DayPlan = {
    ...next,
    fromCenterId: newCenter.id,
    distanceKm: roundKm(toCenter.kmFromStart - newCenter.kmFromStart),
    climbM: climbBetween(newCenter.kmFromStart, toCenter.kmFromStart, route),
  }

  return days.map((d, i) => {
    if (i === boundaryIndex) return updatedCurrent
    if (i === boundaryIndex + 1) return updatedNext
    return d
  })
}

/**
 * 이 날이 새재 구간(소조령·이화령)을 지나는지. PLAN-03/04의 "고개" 뱃지에 쓴다.
 */
export function dayHasMountainPass(
  day: Pick<DayPlan, 'fromCenterId' | 'toCenterId'>,
  centers: readonly CertCenter[] = CENTERS,
  sections: readonly Section[] = SECTIONS,
): boolean {
  const from = mustFindCenter(day.fromCenterId, centers)
  const to = mustFindCenter(day.toCenterId, centers)
  const { start, end } = sectionKmRange('saejae', sections)
  return rangesOverlap(from.kmFromStart, to.kmFromStart, start, end)
}
