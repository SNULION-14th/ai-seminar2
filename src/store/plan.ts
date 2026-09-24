// 활성 계획 스토어 — 저장 키 gt.plan (architecture.md §5, PLAN-09)
// foundation이 골격을 만들었고, 2단계부터 plan 담당이다.
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DayPlan, TripPlan } from '../domain/types'

export const PLAN_STORAGE_KEY = 'gt.plan'
export const PLAN_STORE_VERSION = 1

/** localStorage에 저장되는 부분 */
export interface PlanData {
  plan: TripPlan | null // 활성 계획은 1개만 둔다
}

export interface PlanState extends PlanData {
  setPlan: (plan: TripPlan) => void
  clearPlan: () => void
  /** 체크리스트 항목을 켜고 끈다. 항목 텍스트 자체가 key다 (PLAN-07) */
  toggleChecklistItem: (item: string) => void
  /** 사용자 추가 항목. 이미 있는 항목이거나 빈 문자열이면 아무 일도 안 한다 */
  addChecklistItem: (item: string) => void
  removeChecklistItem: (item: string) => void
  // TODO(plan): 경계 조정 액션 (PLAN-05)
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      setPlan: (plan) => set({ plan }),
      clearPlan: () => set({ plan: null }),
      toggleChecklistItem: (item) =>
        set((s) => {
          if (!s.plan) return s
          const checked = s.plan.checklist[item] ?? false
          return { plan: { ...s.plan, checklist: { ...s.plan.checklist, [item]: !checked } } }
        }),
      addChecklistItem: (item) =>
        set((s) => {
          const trimmed = item.trim()
          if (!s.plan || !trimmed || trimmed in s.plan.checklist) return s
          return { plan: { ...s.plan, checklist: { ...s.plan.checklist, [trimmed]: false } } }
        }),
      removeChecklistItem: (item) =>
        set((s) => {
          if (!s.plan) return s
          const checklist = { ...s.plan.checklist }
          delete checklist[item]
          return { plan: { ...s.plan, checklist } }
        }),
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

function todayIso(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** 활성 계획에서 오늘 날짜에 해당하는 DayPlan. 계획이 없거나 오늘이 일정 범위 밖이면 null (TRK-07) */
export const selectTodayDayPlan = (s: PlanState): DayPlan | null => {
  if (!s.plan) return null
  const today = todayIso()
  return s.plan.days.find((d) => d.date === today) ?? null
}
