// 라이드 스토어 — 저장 키 gt.rides, gt.activeRide (architecture.md §5, TRK-01, TRK-11)
// foundation이 골격을 만들었고, 2단계부터 track 담당이다.
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { GpsCandidate } from '../domain/tracking'
import { movingTimeSec as computeMovingTimeSec, sampleTrackPoint, trackDistanceKm } from '../domain/tracking'
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
  /** idle에서만 시작한다. 새 rideId를 만들고 riding으로 전이한다 (TRK-01) */
  start: (source: Ride['source']) => void
  /** riding에서만 paused로 전이한다 */
  pause: () => void
  /** paused에서만 riding으로 전이한다 */
  resume: () => void
  /** riding/paused에서 finished로 전이한다. 요약 시트(TRK-11) 확인 전까지 데이터는 남아 있다 */
  finish: () => void
  /** GPS/시뮬레이터가 만든 후보 점을 필터링해 받아들이고 거리·이동시간을 다시 계산한다 (TRK-02, TRK-03) */
  addPoint: (candidate: GpsCandidate) => void
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
    (set, get) => ({
      ...INITIAL_ACTIVE_RIDE,
      reset: () => set({ ...INITIAL_ACTIVE_RIDE }),
      start: (source) =>
        set((s) =>
          s.status === 'idle'
            ? {
                status: 'riding',
                rideId: crypto.randomUUID(),
                startedAt: new Date().toISOString(),
                source,
                track: [],
                distanceKm: 0,
                movingTimeSec: 0,
              }
            : s,
        ),
      pause: () => set((s) => (s.status === 'riding' ? { status: 'paused' } : s)),
      resume: () => set((s) => (s.status === 'paused' ? { status: 'riding' } : s)),
      finish: () =>
        set((s) => (s.status === 'riding' || s.status === 'paused' ? { status: 'finished' } : s)),
      addPoint: (candidate) => {
        const s = get()
        if (s.status !== 'riding') return
        const track = sampleTrackPoint(s.track, candidate)
        if (track === s.track) return
        set({ track, distanceKm: trackDistanceKm(track), movingTimeSec: computeMovingTimeSec(track) })
      },
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
export const selectActiveTrack = (s: ActiveRideState) => s.track
/**
 * ⚠️ 호출할 때마다 새 객체를 만든다. `useActiveRideStore(selectActiveRide)`처럼 그냥 쓰면
 * zustand가 매 렌더마다 "값이 바뀌었다"고 오인해 무한 리렌더에 빠진다(실제로 겪은 버그, TRK-01).
 * 반드시 `useActiveRideStore(useShallow(selectActiveRide))`(zustand/react/shallow)로 감싸서 쓴다.
 */
export const selectActiveRide = (s: ActiveRideState): ActiveRideData => ({
  status: s.status,
  rideId: s.rideId,
  startedAt: s.startedAt,
  source: s.source,
  track: s.track,
  distanceKm: s.distanceKm,
  movingTimeSec: s.movingTimeSec,
})
