// 활성 계획 스토어 — 저장 키 gt.plan (architecture.md §5, PLAN-09)
// foundation이 골격을 만들었고, 2단계부터 plan 담당이다.
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { TripPlan } from '../domain/types'

export const PLAN_STORAGE_KEY = 'gt.plan'
export const PLAN_STORE_VERSION = 1

/** localStorage에 저장되는 부분 */
export interface PlanData {
  plan: TripPlan | null // 활성 계획은 1개만 둔다
}

export interface PlanState extends PlanData {
  setPlan: (plan: TripPlan) => void
  clearPlan: () => void
  // TODO(plan): 체크리스트, 경계 조정 등 액션 (PLAN-05, PLAN-07)
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      setPlan: (plan) => set({ plan }),
      clearPlan: () => set({ plan: null }),
    }),
    {
      name: PLAN_STORAGE_KEY,
      version: PLAN_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): PlanData => ({ plan: s.plan }),
      // 스키마가 바뀌면 version을 올리고 여기서 이전 버전 데이터를 변환한다.
      migrate: (persisted) => persisted as PlanData,
    },
  ),
)

export const selectPlan = (s: PlanState) => s.plan
