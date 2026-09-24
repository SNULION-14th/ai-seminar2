// 라이딩 종료 요약 시트 — TRK-11. 거리, 시간, 찍은 도장, 한 줄 메모를 확인하고 일지로 저장한다.
import { useId, useState } from 'react'
import styles from './SummarySheet.module.css'

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.round((totalSec % 3600) / 60)
  if (h === 0) return `${m}분`
  return `${h}시간 ${m}분`
}

export interface SummarySheetProps {
  distanceKm: number
  movingTimeSec: number
  stampCount: number
  onSave: (memo: string) => void
}

export function SummarySheet({ distanceKm, movingTimeSec, stampCount, onSave }: SummarySheetProps) {
  const [memo, setMemo] = useState('')
  const memoId = useId()

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="라이딩 요약">
      <div className={styles.sheet}>
        <h2 className={styles.title}>오늘 라이딩을 마쳤어요</h2>
        <div className={styles.stats}>
          <div>
            <p className={`${styles.statValue} num`}>{distanceKm.toFixed(1)}km</p>
            <p className={styles.statLabel}>이동 거리</p>
          </div>
          <div>
            <p className={`${styles.statValue} num`}>{formatDuration(movingTimeSec)}</p>
            <p className={styles.statLabel}>이동 시간</p>
          </div>
          <div>
            <p className={`${styles.statValue} num`}>{stampCount}개</p>
            <p className={styles.statLabel}>찍은 도장</p>
          </div>
        </div>
        <div className={styles.memo}>
          <label htmlFor={memoId}>오늘 하루는 어땠나요?</label>
          <textarea
            id={memoId}
            className={styles.memoInput}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="한 줄로 남겨 보세요"
          />
        </div>
        <button type="button" className={styles.saveButton} onClick={() => onSave(memo.trim())}>
          기록으로 저장하기
        </button>
      </div>
    </div>
  )
}
