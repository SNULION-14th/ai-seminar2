import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CENTERS } from '../../data/centers'
import { haversineKm, snapToRoute } from '../../domain/geo'
import { AUTO_STAMP_RADIUS_KM } from '../../domain/tracking'
import {
  createSimulator,
  sectionKmRange,
  SIM_BASE_SPEED_KMH,
  SIM_MAX_STEP_KM,
  SIM_TICK_MS,
  tickMsForSpeed,
  type SimPoint,
} from './simulator'

describe('sectionKmRange', () => {
  it('구간 id가 없으면 전체 경로 범위를 돌려준다', () => {
    const range = sectionKmRange()
    expect(range.startKm).toBe(0)
    expect(range.endKm).toBeGreaterThan(600)
  })

  it('saejae 구간은 새재자전거길 누적 km 범위를 돌려준다 (충주 탄금대 ~ 상주 상풍교)', () => {
    const range = sectionKmRange('saejae')
    const tangeumdae = CENTERS.find((c) => c.id === 'tangeumdae')!
    const sangpung = CENTERS.find((c) => c.id === 'sangpung')!
    expect(range.startKm).toBeCloseTo(tangeumdae.kmFromStart, 0)
    expect(range.endKm).toBeCloseTo(sangpung.kmFromStart, 0)
  })
})

describe('createSimulator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('시작하지 않으면 점을 만들지 않는다', () => {
    const onPoint = vi.fn()
    createSimulator({ onPoint })
    vi.advanceTimersByTime(5000)
    expect(onPoint).not.toHaveBeenCalled()
  })

  it('60배속으로 1초마다(tickMs 고정) 경로를 따라 점을 만든다', () => {
    const points: SimPoint[] = []
    const sim = createSimulator({ speedMultiplier: 60, tickMs: 1000, onPoint: (p) => points.push(p) })
    sim.start()
    vi.advanceTimersByTime(3000)
    sim.stop()

    expect(points).toHaveLength(3)
    const kmPerTick = (SIM_BASE_SPEED_KMH * 60) / 3600
    expect(points[0].km).toBeCloseTo(kmPerTick, 2)
    expect(points[2].km).toBeCloseTo(kmPerTick * 3, 2)
    // 경로를 벗어나지 않는다
    for (const p of points) expect(snapToRoute(p).offRoute).toBe(false)
  })

  it('구간 끝에 도달하면 멈추고 onFinish를 부른다', () => {
    const onFinish = vi.fn()
    const points: SimPoint[] = []
    // 아주 짧은 구간(ara, 21km)을 초고배속(60x)로도 여러 틱이 필요하니, tickMs를 크게 잡아 빨리 끝낸다
    const sim = createSimulator({
      sectionId: 'ara',
      speedMultiplier: 60,
      tickMs: 1000,
      onPoint: (p) => points.push(p),
      onFinish,
    })
    sim.start()
    // ara 구간(21km)을 60배속(20*60=1200km/h)으로 주파하는 데 필요한 시간보다 넉넉히 재생
    vi.advanceTimersByTime(120_000)

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(sim.isRunning()).toBe(false)
    expect(points[points.length - 1].km).toBeCloseTo(21, 0)
  })

  it('stop을 부르면 더 이상 점을 만들지 않는다', () => {
    const onPoint = vi.fn()
    const sim = createSimulator({ speedMultiplier: 10, onPoint })
    sim.start()
    vi.advanceTimersByTime(2000)
    sim.stop()
    const callsAfterStop = onPoint.mock.calls.length
    vi.advanceTimersByTime(5000)
    expect(onPoint.mock.calls.length).toBe(callsAfterStop)
  })

  it('배속이 바뀌면 재생 중에도 새 틱 주기로 다시 건다', () => {
    const points: SimPoint[] = []
    const sim = createSimulator({ speedMultiplier: 1, tickMs: 1000, onPoint: (p) => points.push(p) })
    sim.start()
    vi.advanceTimersByTime(2000)
    expect(points).toHaveLength(2)

    sim.setSpeedMultiplier(60)
    // tickMs가 고정(1000)이라 배속만 바뀌고 주기는 그대로다
    vi.advanceTimersByTime(1000)
    expect(points).toHaveLength(3)
    const kmPerTickAt60 = (SIM_BASE_SPEED_KMH * 60) / 3600
    expect(points[2].km - points[1].km).toBeCloseTo(kmPerTickAt60, 2)
  })
})

describe('tickMsForSpeed', () => {
  it('1배속은 기본 주기(1초)를 그대로 쓴다', () => {
    expect(tickMsForSpeed(1)).toBe(SIM_TICK_MS)
  })

  it('배속이 높아 한 틱 이동거리가 SIM_MAX_STEP_KM을 넘으면 주기를 그만큼 줄인다', () => {
    const tickMs = tickMsForSpeed(60)
    const kmh = SIM_BASE_SPEED_KMH * 60
    const stepKm = (kmh * tickMs) / 3_600_000
    expect(stepKm).toBeLessThanOrEqual(SIM_MAX_STEP_KM + 1e-9)
  })

  it('배속이 높을수록 틱 주기는 같거나 더 짧다', () => {
    expect(tickMsForSpeed(60)).toBeLessThanOrEqual(tickMsForSpeed(10))
    expect(tickMsForSpeed(10)).toBeLessThanOrEqual(tickMsForSpeed(1))
  })
})

describe('createSimulator — TRK-06 도장 반경과의 상호작용 (수용 기준)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('새재 구간을 60배속(기본 자동 tickMs)으로 재생하면 네 인증센터를 모두 반경 150m 안으로 지난다', () => {
    const points: SimPoint[] = []
    const sim = createSimulator({ sectionId: 'saejae', speedMultiplier: 60, onPoint: (p) => points.push(p) })
    sim.start()
    // 새재 구간(100km)을 60배속(1200km/h)으로 주파하는 데 필요한 시간보다 넉넉히 재생
    vi.advanceTimersByTime(6 * 60 * 1000)
    sim.stop()

    const orderedCenterIds = ['suanbo', 'ihwaryeong', 'buljeong', 'sangpung']
    let searchFrom = 0
    for (const centerId of orderedCenterIds) {
      const center = CENTERS.find((c) => c.id === centerId)!
      const hitIndex = points.findIndex(
        (p, i) => i >= searchFrom && haversineKm(p, center) <= AUTO_STAMP_RADIUS_KM,
      )
      expect(hitIndex, `${centerId} 반경 150m 안에 든 점이 있어야 한다`).toBeGreaterThanOrEqual(searchFrom)
      searchFrom = hitIndex + 1
    }
  })
})
