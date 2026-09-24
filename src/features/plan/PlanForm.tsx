// 계획 입력 폼 (PLAN-01, PLAN-06)
import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { CENTERS } from '../../data/centers'
import { PACE_DAILY_KM } from '../../domain/itinerary'
import type { Pace } from '../../domain/types'
import styles from './PlanForm.module.css'

export type PlanFormMode = 'days' | 'dailyDistance'
export type PlanFormScope = 'full' | 'partial'

export interface PlanFormValues {
  startDate: string // ISO date
  pace: Pace
  mode: PlanFormMode
  days: number
  dailyDistanceKm: number
  /** PLAN-06 부분 계획: 'full'이면 전체 경로, 'partial'이면 startCenterId~endCenterId만 나눈다 */
  scope: PlanFormScope
  startCenterId: string
  endCenterId: string
}

interface PlanFormProps {
  initialValues?: Partial<PlanFormValues>
  error?: string | null
  disabled?: boolean
  submitLabel?: string
  onSubmit: (values: PlanFormValues) => void
}

const PACE_OPTIONS: { value: Pace; label: string }[] = [
  { value: 'relaxed', label: `여유롭게 (${PACE_DAILY_KM.relaxed}km/일)` },
  { value: 'normal', label: `보통 (${PACE_DAILY_KM.normal}km/일)` },
  { value: 'hard', label: `힘차게 (${PACE_DAILY_KM.hard}km/일)` },
]

function todayIso(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function PlanForm({
  initialValues,
  error,
  disabled,
  submitLabel = '일정 만들기',
  onSubmit,
}: PlanFormProps) {
  const formId = useId()
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? todayIso())
  const [pace, setPace] = useState<Pace>(initialValues?.pace ?? 'normal')
  const [mode, setMode] = useState<PlanFormMode>(initialValues?.mode ?? 'days')
  const [days, setDays] = useState(initialValues?.days ?? 4)
  const [dailyDistanceKm, setDailyDistanceKm] = useState(
    initialValues?.dailyDistanceKm ?? PACE_DAILY_KM.normal,
  )
  const [scope, setScope] = useState<PlanFormScope>(initialValues?.scope ?? 'full')
  const [startCenterId, setStartCenterId] = useState(
    initialValues?.startCenterId ?? CENTERS[0].id,
  )
  const [endCenterId, setEndCenterId] = useState(
    initialValues?.endCenterId ?? CENTERS[CENTERS.length - 1].id,
  )
  const [localError, setLocalError] = useState<string | null>(null)

  const shownError = error ?? localError

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!startDate) {
      setLocalError('출발일을 골라 주세요.')
      return
    }
    if (mode === 'days' && (!Number.isFinite(days) || days < 1)) {
      setLocalError('며칠 동안 달릴지 1일 이상으로 넣어 주세요.')
      return
    }
    if (mode === 'dailyDistance' && (!Number.isFinite(dailyDistanceKm) || dailyDistanceKm <= 0)) {
      setLocalError('하루 목표 거리를 0km보다 크게 넣어 주세요.')
      return
    }
    setLocalError(null)
    onSubmit({ startDate, pace, mode, days, dailyDistanceKm, scope, startCenterId, endCenterId })
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      aria-describedby={shownError ? `${formId}-error` : undefined}
    >
      <h2 className={styles.title}>언제, 며칠 동안 달릴까요?</h2>

      <label className={styles.field}>
        <span className={styles.label}>출발일</span>
        <input
          type="date"
          className={styles.input}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={disabled}
        />
      </label>

      <div className={styles.segmented} role="radiogroup" aria-label="일정 방식">
        <button
          type="button"
          className={mode === 'days' ? `${styles.segment} ${styles.segmentActive}` : styles.segment}
          aria-pressed={mode === 'days'}
          onClick={() => setMode('days')}
          disabled={disabled}
        >
          일수로 정하기
        </button>
        <button
          type="button"
          className={
            mode === 'dailyDistance' ? `${styles.segment} ${styles.segmentActive}` : styles.segment
          }
          aria-pressed={mode === 'dailyDistance'}
          onClick={() => setMode('dailyDistance')}
          disabled={disabled}
        >
          하루 거리로 정하기
        </button>
      </div>

      {mode === 'days' ? (
        <label className={styles.field}>
          <span className={styles.label}>며칠 동안 달릴까요?</span>
          <div className={styles.inputWithSuffix}>
            <input
              type="number"
              className={styles.input}
              min={1}
              max={60}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              disabled={disabled}
            />
            <span className={styles.suffix}>일</span>
          </div>
        </label>
      ) : (
        <label className={styles.field}>
          <span className={styles.label}>하루에 얼마나 달릴까요?</span>
          <div className={styles.inputWithSuffix}>
            <input
              type="number"
              className={styles.input}
              min={10}
              max={300}
              value={dailyDistanceKm}
              onChange={(e) => setDailyDistanceKm(Number(e.target.value))}
              disabled={disabled}
            />
            <span className={styles.suffix}>km/일</span>
          </div>
        </label>
      )}

      <label className={styles.field}>
        <span className={styles.label}>페이스</span>
        <select
          className={styles.input}
          value={pace}
          onChange={(e) => setPace(e.target.value as Pace)}
          disabled={disabled}
        >
          {PACE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.segmented} role="radiogroup" aria-label="구간 범위">
        <button
          type="button"
          className={scope === 'full' ? `${styles.segment} ${styles.segmentActive}` : styles.segment}
          aria-pressed={scope === 'full'}
          onClick={() => setScope('full')}
          disabled={disabled}
        >
          전체 구간
        </button>
        <button
          type="button"
          className={
            scope === 'partial' ? `${styles.segment} ${styles.segmentActive}` : styles.segment
          }
          aria-pressed={scope === 'partial'}
          onClick={() => setScope('partial')}
          disabled={disabled}
        >
          구간만 골라서 (주말 라이딩)
        </button>
      </div>

      {scope === 'partial' && (
        <>
          <label className={styles.field}>
            <span className={styles.label}>출발 인증센터</span>
            <select
              className={styles.input}
              value={startCenterId}
              onChange={(e) => setStartCenterId(e.target.value)}
              disabled={disabled}
            >
              {CENTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>도착 인증센터</span>
            <select
              className={styles.input}
              value={endCenterId}
              onChange={(e) => setEndCenterId(e.target.value)}
              disabled={disabled}
            >
              {CENTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {shownError && (
        <p id={`${formId}-error`} className={styles.error} role="alert">
          {shownError}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={disabled}>
        {submitLabel}
      </button>
    </form>
  )
}
