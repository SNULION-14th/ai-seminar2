import type { ShareDayDistance } from '../../../domain/share-codec'
import { formatJournalDate } from '../journal-view'
import styles from './SharedDayList.module.css'

interface SharedDayListProps {
  days: readonly ShareDayDistance[]
}

/** 공유 페이지의 일자별 거리 목록. 공유 payload에는 메모가 없다(SHR-04) */
export function SharedDayList({ days }: SharedDayListProps) {
  return (
    <ul className={styles.list}>
      {days.map((day) => (
        <li key={day.date} className={styles.row}>
          <span className={styles.date}>{formatJournalDate(day.date)}</span>
          <span className="num">{day.distanceKm.toFixed(1)}km</span>
        </li>
      ))}
    </ul>
  )
}
