// 인증센터 목록 — 자동 인식이 안 될 때 리스트에서 직접 도장을 찍는다 (TRK-06 manual, TRK-13 대체 흐름).
import { Stamp } from '../../components'
import { CENTERS } from '../../data/centers'
import type { Stamp as StampRecord } from '../../domain/types'
import styles from './CenterList.module.css'

export interface CenterListProps {
  stamps: readonly StampRecord[]
  onManualStamp: (centerId: string) => void
}

export function CenterList({ stamps, onManualStamp }: CenterListProps) {
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>인증센터 목록 (직접 찍기)</summary>
      <ul className={styles.list}>
        {CENTERS.map((c) => {
          const stamp = stamps.find((s) => s.centerId === c.id)
          return (
            <li key={c.id} className={styles.row}>
              <Stamp name={c.name} stamped={!!stamp} date={stamp?.stampedAt} size="sm" />
              <span className={styles.name}>{c.name}</span>
              {!stamp && (
                <button type="button" className={styles.manualButton} onClick={() => onManualStamp(c.id)}>
                  직접 찍기
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </details>
  )
}
