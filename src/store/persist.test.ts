// 저장 키와 version 필드 계약 확인 (architecture.md §5)
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { Ride, Stamp, TripPlan } from '../domain/types'

// node 환경에는 localStorage가 없으므로 메모리 구현으로 대신한다.
const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
  clear: () => memory.clear(),
  key: (i: number) => [...memory.keys()][i] ?? null,
  get length() {
    return memory.size
  },
})

// 스토어는 생성 시점에 localStorage를 잡으므로 stub 다음에 불러온다.
let plan: typeof import('./plan')
let stamps: typeof import('./stamps')
let ride: typeof import('./ride')
beforeAll(async () => {
  plan = await import('./plan')
  stamps = await import('./stamps')
  ride = await import('./ride')
})

const saved = (key: string) => JSON.parse(memory.get(key) ?? 'null')

describe('persist 계약', () => {
  it('저장 키가 gt.* 이고 version이 1이다', () => {
    expect(plan.usePlanStore.persist.getOptions()).toMatchObject({ name: 'gt.plan', version: 1 })
    expect(stamps.useStampsStore.persist.getOptions()).toMatchObject({ name: 'gt.stamps', version: 1 })
    expect(ride.useRidesStore.persist.getOptions()).toMatchObject({ name: 'gt.rides', version: 1 })
    expect(ride.useActiveRideStore.persist.getOptions()).toMatchObject({
      name: 'gt.activeRide',
      version: 1,
    })
  })

  it('계획을 저장하면 gt.plan에 version과 함께 기록되고 액션은 저장하지 않는다', () => {
    const p: TripPlan = {
      id: 'p1',
      startDate: '2026-10-03',
      days: [],
      pace: 'normal',
      createdAt: '2026-09-24T00:00:00.000Z',
      checklist: {},
    }
    plan.usePlanStore.getState().setPlan(p)
    expect(saved('gt.plan')).toEqual({ state: { plan: p }, version: 1 })

    plan.usePlanStore.getState().clearPlan()
    expect(saved('gt.plan').state.plan).toBeNull()
  })

  it('같은 센터 도장은 한 번만 저장된다', () => {
    const s: Stamp = { centerId: 'yeouido', stampedAt: '2026-10-03T10:00:00Z', method: 'manual' }
    stamps.useStampsStore.getState().addStamp(s)
    stamps.useStampsStore.getState().addStamp({ ...s, method: 'auto' })
    expect(saved('gt.stamps')).toEqual({ state: { stamps: [s] }, version: 1 })
    expect(stamps.selectIsStamped('yeouido')(stamps.useStampsStore.getState())).toBe(true)
  })

  it('라이드를 추가·수정하면 gt.rides에 저장된다', () => {
    const r: Ride = {
      id: 'r1',
      startedAt: '2026-10-03T08:00:00Z',
      track: [],
      distanceKm: 42,
      movingTimeSec: 7200,
      source: 'simulated',
    }
    ride.useRidesStore.getState().addRide(r)
    ride.useRidesStore.getState().updateRide('r1', { memo: '여의도까지' })
    expect(saved('gt.rides')).toEqual({ state: { rides: [{ ...r, memo: '여의도까지' }] }, version: 1 })
  })

  it('진행 중 라이드는 idle로 시작하고 reset하면 초기값으로 돌아간다', () => {
    const store = ride.useActiveRideStore
    expect(store.getState().status).toBe('idle')
    store.setState({ status: 'riding', rideId: 'r2', distanceKm: 3 })
    expect(saved('gt.activeRide').state).toMatchObject({ status: 'riding', rideId: 'r2' })
    store.getState().reset()
    expect(saved('gt.activeRide')).toEqual({ state: ride.INITIAL_ACTIVE_RIDE, version: 1 })
  })
})
