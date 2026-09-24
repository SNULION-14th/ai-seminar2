// 라이드 스토어 — 저장 키 gt.rides, gt.activeRide (architecture.md §5, TRK-01, TRK-11)
// foundation이 골격을 만들었고, 2단계부터 track 담당이다.
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Ride, TrackPoint } from '../domain/types'

// ---- 완료된 라이드 (일지) ----

export const RIDES_STORAGE_KEY = 'gt.rides'
export const RIDES_STORE_VERSION = 1

export interface RidesData {
  rides: Ride[]
}

export interface RidesState extends RidesData {
  addRide: (ride: Ride) => void
  updateRide: (id: string, patch: Partial<Omit<Ride, 'id'>>) => void
  /** 백업 가져오기(SHR-09)용 전체 교체 */
  replaceRides: (rides: Ride[]) => void
}

export const useRidesStore = create<RidesState>()(
  persist(
    (set) => ({
      rides: [],
      addRide: (ride) => set((s) => ({ rides: [...s.rides, ride] })),
      updateRide: (id, patch) =>
        set((s) => ({ rides: s.rides.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      replaceRides: (rides) => set({ rides }),
    }),
    {
      name: RIDES_STORAGE_KEY,
      version: RIDES_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): RidesData => ({ rides: s.rides }),
      // 스키마가 바뀌면 version을 올리고 여기서 이전 버전 데이터를 변환한다.
      migrate: (persisted) => persisted as RidesData,
    },
  ),
)

export const selectRides = (s: RidesState) => s.rides

// ---- 진행 중 라이드 (새로고침 복구용, TRK-01) ----

export const ACTIVE_RIDE_STORAGE_KEY = 'gt.activeRide'
export const ACTIVE_RIDE_STORE_VERSION = 1

/** TRK-01 상태 머신: idle → riding ⇄ paused → finished */
export type RideStatus = 'idle' | 'riding' | 'paused' | 'finished'

export interface ActiveRideData {
  status: RideStatus
  rideId: string | null
  startedAt: string | null
  source: Ride['source']
  track: TrackPoint[]
  distanceKm: number
  movingTimeSec: number
}

export interface ActiveRideState extends ActiveRideData {
  reset: () => void
  // TODO(track): start, pause, resume, finish, addPoint 등 상태 전이 (TRK-01, TRK-02)
}

export const INITIAL_ACTIVE_RIDE: ActiveRideData = {
  status: 'idle',
  rideId: null,
  startedAt: null,
  source: 'gps',
  track: [],
  distanceKm: 0,
  movingTimeSec: 0,
}

export const useActiveRideStore = create<ActiveRideState>()(
  persist(
    (set) => ({
      ...INITIAL_ACTIVE_RIDE,
      reset: () => set({ ...INITIAL_ACTIVE_RIDE }),
    }),
    {
      name: ACTIVE_RIDE_STORAGE_KEY,
      version: ACTIVE_RIDE_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ status, rideId, startedAt, source, track, distanceKm, movingTimeSec }): ActiveRideData => ({
        status,
        rideId,
        startedAt,
        source,
        track,
        distanceKm,
        movingTimeSec,
      }),
      // 스키마가 바뀌면 version을 올리고 여기서 이전 버전 데이터를 변환한다.
      migrate: (persisted) => persisted as ActiveRideData,
    },
  ),
)

export const selectRideStatus = (s: ActiveRideState) => s.status
