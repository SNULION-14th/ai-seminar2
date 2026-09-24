import type { Ride } from '../../../domain/types'
import { formatJournalDate, formatMovingTime } from '../journal-view'
import styles from './JournalTimeline.module.css'

interface JournalTimelineProps {
  rides: readonly Ride[]
}

/** 일지 타임라인 — 라이드를 최근순으로 일자별 거리·메모와 함께 보여 준다 (SHR-01) */
export function JournalTimeline({ rides }: JournalTimelineProps) {
  if (rides.length === 0) {
    return <p className={styles.empty}>아직 기록이 없어요. 트래킹을 시작하면 여기에 쌓여요.</p>
  }

  const sorted = [...rides].sort((a, b) => b.startedAt.localeCompare(a.startedAt))

  return (
    <ul className={styles.list}>
      {sorted.map((ride) => (
        <li key={ride.id} className={styles.entry}>
          <div className={styles.entryHead}>
            <span className={styles.date}>{formatJournalDate(ride.startedAt)}</span>
            <span className={`${styles.stats} num`}>
              {ride.distanceKm.toFixed(1)}km · {formatMovingTime(ride.movingTimeSec)}
            </span>
          </div>
          {ride.memo ? <p className={styles.memo}>{ride.memo}</p> : null}
        </li>
      ))}
    </ul>
  )
}
