// 계획 화면 진입점 — PLAN-01, PLAN-03, PLAN-04, PLAN-05, PLAN-06, PLAN-07, PLAN-08, PLAN-09, PLAN-10.
import { useMemo, useState } from 'react'
import { PebbleHandle, RidgeProfile } from '../../components'
import type { RidgeBoundary } from '../../components'
import { CENTERS, getCenter } from '../../data/centers'
import { ROUTE } from '../../data/route'
import { TOTAL_KM } from '../../data/sections'
import { adjustDayBoundary, splitItinerary } from '../../domain/itinerary'
import type { DayPlan, TripPlan } from '../../domain/types'
import { selectPlan, usePlanStore } from '../../store/plan'
import { buildBoundaryEdges } from './boundaryEdges'
import { DEFAULT_CHECKLIST_ITEMS } from './checklistDefaults'
import { DayCardList } from './DayCardList'
import type { PlanFormValues } from './PlanForm'
import { PlanForm } from './PlanForm'
import { PlanActions } from './PlanActions'
import styles from './index.module.css'

/** PLAN-04: 일자 경계(마지막 날 제외)를 능선 고도 프로필의 세로선으로 넘긴다 */
function dayBoundaries(days: readonly DayPlan[]): RidgeBoundary[] {
  return days
    .slice(0, -1)
    .map((d): RidgeBoundary | null => {
      const center = getCenter(d.toCenterId)
      return center ? { km: center.kmFromStart, label: `${d.dayIndex}일차` } : null
    })
    .filter((b): b is RidgeBoundary => b != null)
}

interface BuiltPlan {
  plan: TripPlan
  warnings: string[]
}

function buildTripPlan(values: PlanFormValues): BuiltPlan {
  const base =
    values.mode === 'days'
      ? ({ startDate: values.startDate, pace: values.pace, mode: 'days', days: values.days } as const)
      : ({
          startDate: values.startDate,
          pace: values.pace,
          mode: 'dailyDistance',
          dailyDistanceKm: values.dailyDistanceKm,
        } as const)
  // PLAN-06 부분 계획: 구간만 고르면 그 구간의 시작/끝 인증센터로 잘라서 나눈다
  const options =
    values.scope === 'partial'
      ? { ...base, startCenterId: values.startCenterId, endCenterId: values.endCenterId }
      : base
  const { days, warnings } = splitItinerary(options)
  const plan: TripPlan = {
    id: crypto.randomUUID(),
    startDate: values.startDate,
    days,
    pace: values.pace,
    createdAt: new Date().toISOString(),
    // PLAN-07: 기본 준비물은 안 찍은 상태로 시작한다
    checklist: Object.fromEntries(DEFAULT_CHECKLIST_ITEMS.map((item) => [item, false])),
  }
  return { plan, warnings }
}

export function PlanPage() {
  const plan = usePlanStore(selectPlan)
  const setPlan = usePlanStore((s) => s.setPlan)
  const toggleChecklistItem = usePlanStore((s) => s.toggleChecklistItem)
  const addChecklistItem = usePlanStore((s) => s.addChecklistItem)
  const removeChecklistItem = usePlanStore((s) => s.removeChecklistItem)

  const [showForm, setShowForm] = useState(!plan)
  const [pending, setPending] = useState<BuiltPlan | null>(null)
  const [resultWarnings, setResultWarnings] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = (values: PlanFormValues) => {
    let built: BuiltPlan
    try {
      built = buildTripPlan(values)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '일정을 만들 수 없어요. 입력값을 확인해 주세요.')
      return
    }
    setFormError(null)
    if (plan) {
      // PLAN-09: 계획은 1개만 활성 상태로 둔다. 새로 만들면 덮어쓰기를 확인받는다.
      setPending(built)
    } else {
      setPlan(built.plan)
      setResultWarnings(built.warnings)
      setShowForm(false)
    }
  }

  const confirmOverwrite = () => {
    if (!pending) return
    setPlan(pending.plan)
    setResultWarnings(pending.warnings)
    setPending(null)
    setShowForm(false)
  }

  const cancelOverwrite = () => {
    // pending은 항상 기존 계획이 있을 때만 생긴다(handleSubmit 참고).
    // 취소하면 새 계획 폼을 닫고 기존 계획 결과 화면으로 돌아간다 (PLAN-09, QA-FAIL 수정).
    setPending(null)
    setShowForm(false)
  }

  const boundaries = useMemo(() => (plan ? dayBoundaries(plan.days) : []), [plan])
  const range = useMemo((): [number, number] | undefined => {
    if (!plan || plan.days.length === 0) return undefined
    const startCenter = getCenter(plan.days[0].fromCenterId)
    const endCenter = getCenter(plan.days[plan.days.length - 1].toCenterId)
    return startCenter && endCenter ? [startCenter.kmFromStart, endCenter.kmFromStart] : undefined
  }, [plan])
  const rangeValue: [number, number] = range ?? [0, TOTAL_KM]

  // PLAN-05: 경계 드래그. edges[i]를 옮기면 그 앞뒤 두 날만 다시 계산한다
  const edges = useMemo(() => (plan ? buildBoundaryEdges(plan.days) : []), [plan])
  const handleBoundaryCommit = (boundaryIndex: number, newCenterId: string) => {
    if (!plan) return
    try {
      const days = adjustDayBoundary(plan.days, boundaryIndex, newCenterId)
      setPlan({ ...plan, days })
    } catch {
      // 후보 범위 밖 값이 오면(이론상 일어나지 않음) 조용히 무시한다
    }
  }

  return (
    <section className={styles.page}>
      <h1 className="page-title">계획</h1>

      {pending && (
        <div className={styles.confirm} role="alertdialog" aria-label="계획 덮어쓰기 확인">
          <p>이미 만든 계획이 있어요. 새 계획으로 바꾸면 기존 계획은 사라져요. 계속할까요?</p>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.confirmCancel} onClick={cancelOverwrite}>
              취소
            </button>
            <button type="button" className={styles.confirmOk} onClick={confirmOverwrite}>
              새 계획으로 바꾸기
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <PlanForm onSubmit={handleSubmit} error={formError} disabled={pending != null} />
      )}

      {!showForm && plan && (
        <div className={styles.result}>
          {resultWarnings.map((w) => (
            <p key={w} className={styles.warning} role="status">
              {w}
            </p>
          ))}
          <RidgeProfile
            points={ROUTE}
            centers={CENTERS}
            range={range}
            boundaries={boundaries}
            ariaLabel="계획한 일정의 고도 프로필"
          >
            {edges.map((edge) => (
              <PebbleHandle
                key={edge.id}
                stops={edge.stops}
                value={edge.toCenterId}
                domain={rangeValue}
                label={edge.label}
                disabled={edge.stops.length < 2}
                onCommit={(id) => handleBoundaryCommit(edge.boundaryIndex, id)}
              />
            ))}
          </RidgeProfile>
          <DayCardList days={plan.days} />
          <PlanActions
            plan={plan}
            onToggleChecklistItem={toggleChecklistItem}
            onAddChecklistItem={addChecklistItem}
            onRemoveChecklistItem={removeChecklistItem}
          />
          <button type="button" className={styles.newPlan} onClick={() => setShowForm(true)}>
            새 일정 만들기
          </button>
        </div>
      )}
    </section>
  )
}
