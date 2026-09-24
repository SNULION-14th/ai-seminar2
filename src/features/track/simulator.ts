// 시뮬레이션 모드 — TRK-10. 실제 GPS 없이 선택한 구간의 경로를 따라 가짜 위치를 재생한다.
// setInterval(브라우저 타이머)을 쓰기 때문에 domain/이 아니라 features/track에 둔다.
import { ROUTE } from '../../data/route'
import { SECTIONS, TOTAL_KM } from '../../data/sections'
import { pointAtKm } from '../../domain/geo'
import type { RoutePoint, SectionId } from '../../domain/types'

export type SimSpeedMultiplier = 1 | 10 | 60

export const SIM_SPEED_MULTIPLIERS: readonly SimSpeedMultiplier[] = [1, 10, 60]

/** 시뮬레이션이 흉내 내는 평균 라이딩 속도(km/h). 배속과 곱해 재생 속도를 정한다. */
export const SIM_BASE_SPEED_KMH = 20

/** 가짜 GPS 점을 만들어내는 기본 주기(ms). 배속이 높아지면 한 틱에 너무 멀리 뛰지 않도록 짧아진다 */
export const SIM_TICK_MS = 1000

/** 시뮬레이션 점의 정확도(m). 항상 필터링을 통과하는 값으로 둔다 */
export const SIM_ACCURACY_M = 5

/**
 * 한 틱에 이만큼(km)보다 더 멀리 움직이지 않는다. TRK-06 자동 도장 반경(150m)보다 넉넉히 작게 잡아서,
 * 고배속(60x)으로 재생해도 인증센터 반경을 건너뛰지 않고 한 번은 걸리게 한다.
 */
export const SIM_MAX_STEP_KM = 0.05

/** speedMultiplier에 맞는 틱 주기(ms)를 계산한다. 기본 1초 틱이 SIM_MAX_STEP_KM보다 멀리 움직이면 그만큼 짧아진다 */
export function tickMsForSpeed(speedMultiplier: number): number {
  const kmh = SIM_BASE_SPEED_KMH * speedMultiplier
  const stepAtDefaultTick = (kmh * SIM_TICK_MS) / 3_600_000
  if (stepAtDefaultTick <= SIM_MAX_STEP_KM) return SIM_TICK_MS
  return (SIM_MAX_STEP_KM / kmh) * 3_600_000
}

export interface SimSectionRange {
  startKm: number
  endKm: number
}

/** 구간 id로 누적 km 범위를 구한다. sectionId가 없으면 전체 경로 범위(0~TOTAL_KM) */
export function sectionKmRange(sectionId?: SectionId): SimSectionRange {
  let startKm = 0
  for (const section of SECTIONS) {
    if (!sectionId || section.id === sectionId) {
      return sectionId ? { startKm, endKm: startKm + section.distanceKm } : { startKm: 0, endKm: TOTAL_KM }
    }
    startKm += section.distanceKm
  }
  return { startKm: 0, endKm: TOTAL_KM }
}

export interface SimPoint extends RoutePoint {
  acc: number
  t: number
}

export interface SimulatorOptions {
  /** 재생할 구간. 생략하면 전체 경로(인천 → 부산)를 재생한다 */
  sectionId?: SectionId
  speedMultiplier?: SimSpeedMultiplier
  route?: readonly RoutePoint[]
  tickMs?: number
  /** 재생을 시작할 누적 km. 생략하면 구간(또는 전체 경로) 시작점부터 재생한다.
   * 새로고침 후 이어서 재생할 때(TRK-01 복구) 쓴다 */
  startKm?: number
  onPoint: (point: SimPoint) => void
  onFinish?: () => void
}

export interface Simulator {
  start: () => void
  stop: () => void
  setSpeedMultiplier: (multiplier: SimSpeedMultiplier) => void
  isRunning: () => boolean
}

/**
 * 선택한 구간(없으면 전체)의 경로를 따라 가짜 위치를 재생하는 시뮬레이터를 만든다.
 * `#/track?sim=1`에서 이 시뮬레이터로 실제 GPS 없이 트래킹 화면을 검증할 수 있다.
 */
export function createSimulator(options: SimulatorOptions): Simulator {
  const { sectionId, route = ROUTE, onPoint, onFinish } = options
  const { startKm: sectionStartKm, endKm } = sectionKmRange(sectionId)
  // tickMs를 명시적으로 넘기면(테스트 등) 그 값을 고정으로 쓴다. 아니면 배속에 맞춰 자동으로 계산한다.
  const fixedTickMs = options.tickMs
  let speedMultiplier = options.speedMultiplier ?? 1
  let km = options.startKm ?? sectionStartKm
  let timer: ReturnType<typeof setInterval> | null = null

  function currentTickMs(): number {
    return fixedTickMs ?? tickMsForSpeed(speedMultiplier)
  }

  function tick() {
    const tickMs = currentTickMs()
    const kmPerTick = (SIM_BASE_SPEED_KMH * speedMultiplier * (tickMs / 1000)) / 3600
    km = Math.min(endKm, km + kmPerTick)
    const p = pointAtKm(km, route)
    onPoint({ ...p, acc: SIM_ACCURACY_M, t: Date.now() })
    if (km >= endKm) {
      stop()
      onFinish?.()
    }
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function start() {
    if (timer !== null) return
    timer = setInterval(tick, currentTickMs())
  }

  function setSpeedMultiplier(multiplier: SimSpeedMultiplier) {
    speedMultiplier = multiplier
    // 재생 중이면 새 배속에 맞는 틱 주기로 타이머를 다시 건다 (고배속에서 한 틱에 너무 멀리 뛰는 걸 막는다)
    if (timer !== null) {
      clearInterval(timer)
      timer = setInterval(tick, currentTickMs())
    }
  }

  function isRunning() {
    return timer !== null
  }

  return { start, stop, setSpeedMultiplier, isRunning }
}
