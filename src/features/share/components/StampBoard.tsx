import { Stamp } from '../../../components'
import { CENTERS } from '../../../data/centers'
import styles from './StampBoard.module.css'

interface StampBoardProps {
  stampedCenterIds: ReadonlySet<string>
  /** centerId → stampedAt(ISO). 있으면 Stamp에 날짜를 보여 준다(공유 payload에는 없을 수 있다) */
  stampedAtByCenter?: ReadonlyMap<string, string>
}

/** 도장판 — 전체 인증센터 격자. ui-kit의 DS-03 Stamp로 찍은 곳만 컬러로 보여 준다 (SHR-01) */
export function StampBoard({ stampedCenterIds, stampedAtByCenter }: StampBoardProps) {
  return (
    <ul className={styles.grid}>
      {CENTERS.map((center) => (
        <li key={center.id}>
          <Stamp
            name={center.name}
            stamped={stampedCenterIds.has(center.id)}
            date={stampedAtByCenter?.get(center.id)}
            size="sm"
          />
        </li>
      ))}
    </ul>
  )
}
