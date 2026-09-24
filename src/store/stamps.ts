// 도장 스토어 — 저장 키 gt.stamps (architecture.md §5, TRK-06)
// foundation이 골격을 만들었고, 2단계부터 track 담당이다.
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Stamp } from '../domain/types'

export const STAMPS_STORAGE_KEY = 'gt.stamps'
export const STAMPS_STORE_VERSION = 1

export interface StampsData {
  stamps: Stamp[]
}

export interface StampsState extends StampsData {
  /** 같은 인증센터에 이미 도장이 있으면 무시한다 */
  addStamp: (stamp: Stamp) => void
  removeStamp: (centerId: string) => void
  /** 백업 가져오기(SHR-09)용 전체 교체 */
  replaceStamps: (stamps: Stamp[]) => void
}

export const useStampsStore = create<StampsState>()(
  persist(
    (set) => ({
      stamps: [],
      addStamp: (stamp) =>
        set((s) =>
          s.stamps.some((x) => x.centerId === stamp.centerId)
            ? s
            : { stamps: [...s.stamps, stamp] },
        ),
      removeStamp: (centerId) =>
        set((s) => ({ stamps: s.stamps.filter((x) => x.centerId !== centerId) })),
      replaceStamps: (stamps) => set({ stamps }),
    }),
    {
      name: STAMPS_STORAGE_KEY,
      version: STAMPS_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): StampsData => ({ stamps: s.stamps }),
      // 스키마가 바뀌면 version을 올리고 여기서 이전 버전 데이터를 변환한다.
      migrate: (persisted) => persisted as StampsData,
    },
  ),
)

export const selectStamps = (s: StampsState) => s.stamps
export const selectIsStamped = (centerId: string) => (s: StampsState) =>
  s.stamps.some((x) => x.centerId === centerId)
