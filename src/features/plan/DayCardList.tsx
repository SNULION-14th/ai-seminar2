// 일자 카드 리스트 (PLAN-03)
import { Minus, Mountain, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getCenter } from '../../data/centers'
import { dayHasMountainPass } from '../../domain/itinerary'
import type { DayPlan } from '../../domain/types'
import styles from './DayCardList.module.css'

interface DayCardListProps {
  days: readonly DayPlan[]
}

/** 이 이상 오르면 '업힐' 뱃지를 보여준다 (고개가 아닌 날 중에서) */
const CLIMB_BADGE_THRESHOLD_M = 200

type BadgeTone = 'flat' | 'climb' | 'pass'

function formatDayDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const md = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short', timeZone: 'UTC' }).format(
    date,
  )
  return `${md} (${weekday})`
}

function dayBadge(day: DayPlan): { label: string; tone: BadgeTone; Icon: LucideIcon } {
  if (dayHasMountainPass(day)) return { label: '고개', tone: 'pass', Icon: Mountain }
  if (day.climbM >= CLIMB_BADGE_THRESHOLD_M) return { label: '업힐', tone: 'climb', Icon: TrendingUp }
  return { label: '평지', tone: 'flat', Icon: Minus }
}

function toneClassName(tone: BadgeTone): string {
  if (tone === 'pass') return styles.badgePass
  if (tone === 'climb') return styles.badgeClimb
  return styles.badgeFlat
}

export function DayCardList({ days }: DayCardListProps) {
  return (
    <ul className={styles.list}>
      {days.map((day) => {
        const from = getCenter(day.fromCenterId)
        const to = getCenter(day.toCenterId)
        const badge = dayBadge(day)
        const Icon = badge.Icon
        return (
          <li key={day.dayIndex} className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.dayLabel}>DAY {day.dayIndex}</span>
              <span className={styles.date}>{formatDayDate(day.date)}</span>
            </div>
            <p className={styles.route}>
              {from?.name ?? day.fromCenterId} → {to?.name ?? day.toCenterId}
            </p>
            <div className={styles.meta}>
              <span className={`num ${styles.num}`}>
                {day.distanceKm.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}km
              </span>
              <span className={`num ${styles.num}`}>
                ↑{day.climbM.toLocaleString('ko-KR')}m
              </span>
              {day.stayTown && <span className={styles.stay}>숙박: {day.stayTown}</span>}
              <span className={styles.badge}>
                <Icon size={14} className={toneClassName(badge.tone)} aria-hidden="true" />
                {badge.label}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
